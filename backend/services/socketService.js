const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { prisma, isDbConnected } = require('../config/db');
const { withTimeout } = require('../utils/promise');

const SUPPORT_CHAT_TOKEN_SCOPE = 'sitemendr_support_chat';
const SUPPORT_CHAT_TYPES = new Set(['general', 'technical', 'billing', 'sales']);
const normalizeOrigin = value => typeof value === 'string' ? value.replace(/\/$/, '') : value;

let io;

const initSocket = server => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].map(normalizeOrigin);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Connections may be anonymous for the public help widget, but private room
  // access is granted only by a user JWT or a signed, chat-specific capability.
  io.use((socket, next) => {
    const { token, chatToken } = socket.handshake.auth || {};
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (typeof userId !== 'string' || !userId) return next(new Error('Unauthorized'));
        socket.data.userId = userId;
      } catch { return next(new Error('Unauthorized')); }
    }
    if (chatToken) {
      try {
        const capability = jwt.verify(chatToken, process.env.JWT_SECRET);
        if (capability.scope !== SUPPORT_CHAT_TOKEN_SCOPE || typeof capability.chatId !== 'string') return next(new Error('Unauthorized'));
        socket.data.liveChatId = capability.chatId;
      } catch { return next(new Error('Unauthorized')); }
    }
    next();
  });

  logger.info('WebSocket server initialized');
  io.on('connection', socket => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('join_user', () => {
      if (socket.data.userId) socket.join(`user_${socket.data.userId}`);
    });

    socket.on('join_chat', async (data, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const chatId = typeof data === 'string' ? data : data?.chatId;
      if (typeof chatId !== 'string' || chatId.length > 64 || (!socket.data.isAdmin && socket.data.liveChatId !== chatId)) {
        return respond({ success: false, message: 'This support conversation is not available.' });
      }
      if (!isDbConnected()) return respond({ success: false, message: 'Support chat is temporarily unavailable.' });

      try {
        const session = await withTimeout(prisma.chatSession.findUnique({
          where: { externalId: chatId },
          select: { id: true, userId: true, status: true, type: true, messages: { orderBy: { timestamp: 'asc' }, take: 100 } }
        }), 5000, 'Timeout fetching chat history');
        if (!session || (socket.data.userId && session.userId && session.userId !== socket.data.userId && !socket.data.isAdmin)) {
          return respond({ success: false, message: 'This support conversation is not available.' });
        }
        if (session.status === 'closed' && !socket.data.isAdmin) {
          socket.emit('chat_closed', { chatId });
          return respond({ success: false, message: 'This support conversation is closed.' });
        }
        if (!socket.data.isAdmin && socket.data.userId && !session.userId) {
          await prisma.chatSession.update({ where: { id: session.id }, data: { userId: socket.data.userId } });
        }
        socket.join(chatId);
        socket.emit('chat_history', session.messages);
        respond({ success: true, status: session.status, type: session.type });
      } catch (error) {
        logger.error('SOCKET_CHAT_JOIN_ERROR:', { errorCode: 'SOCKET_CHAT_JOIN_ERROR', error: error.message, chatId });
        respond({ success: false, message: 'Could not open this support conversation.' });
      }
    });

    socket.on('send_message', async (data, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const chatId = data?.chatId;
      const text = typeof data?.text === 'string' ? data.text.trim() : '';
      if (typeof chatId !== 'string' || !socket.rooms.has(chatId) || (!socket.data.isAdmin && socket.data.liveChatId !== chatId)) {
        return respond({ success: false, message: 'Join an authorized support conversation before sending.' });
      }
      if (!text || text.length > 4000) return respond({ success: false, message: 'Write a message of up to 4,000 characters.' });
      if (!isDbConnected()) return respond({ success: false, message: 'Message not sent because support chat is unavailable.' });

      try {
        const session = await withTimeout(prisma.chatSession.findUnique({ where: { externalId: chatId } }), 3000, 'Timeout finding chat session');
        if (!session || session.status === 'closed' || (socket.data.userId && session.userId && session.userId !== socket.data.userId && !socket.data.isAdmin)) {
          return respond({ success: false, message: 'This support conversation is not available.' });
        }
        if (!socket.data.isAdmin && !['waiting', 'active'].includes(session.status)) {
          return respond({ success: false, message: 'Request a Sitemendr agent before sending a live message.' });
        }
        const saved = await withTimeout(prisma.chatMessage.create({
          data: { sessionId: session.id, text, sender: socket.data.isAdmin ? 'agent' : 'user' }
        }), 3000, 'Timeout persisting support message');
        const message = { id: saved.id, chatId, text: saved.text, sender: saved.sender, timestamp: saved.timestamp };
        socket.to(chatId).emit('receive_message', message);
        respond({ success: true, data: message });
      } catch (error) {
        logger.error('SOCKET_MESSAGE_PERSIST_ERROR:', { errorCode: 'SOCKET_MESSAGE_PERSIST_ERROR', error: error.message, chatId });
        respond({ success: false, message: 'Message could not be saved. Please try again.' });
      }
    });

    socket.on('request_agent', async (data, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const { chatId, type } = data || {};
      if (socket.data.liveChatId !== chatId || !SUPPORT_CHAT_TYPES.has(type)) {
        return respond({ success: false, message: 'This support request is invalid.' });
      }
      if (!isDbConnected()) return respond({ success: false, message: 'Support is temporarily unavailable. Please try again shortly.' });
      try {
        const session = await prisma.chatSession.findUnique({ where: { externalId: chatId }, select: { id: true, userId: true, status: true } });
        if (!session || session.status === 'closed' || (socket.data.userId && session.userId && session.userId !== socket.data.userId)) {
          return respond({ success: false, message: 'This support conversation is not available.' });
        }
        const updated = await prisma.chatSession.update({ where: { id: session.id }, data: { status: 'waiting', type } });
        io.to('admin_room').emit('new_support_request', { chatId, type, timestamp: updated.updatedAt });
        respond({ success: true });
      } catch (error) {
        logger.error('SOCKET_AGENT_REQUEST_ERROR:', { errorCode: 'SOCKET_AGENT_REQUEST_ERROR', error: error.message, chatId });
        respond({ success: false, message: 'Your request could not be sent. Please try again.' });
      }
    });

    socket.on('admin_join', async (acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      if (!socket.data.userId || !isDbConnected()) return respond({ success: false, message: 'Admin access is required.' });
      try {
        const user = await prisma.user.findUnique({ where: { id: socket.data.userId }, select: { role: true } });
        if (user?.role !== 'admin') {
          logger.warn('Rejected socket admin room join for a non-admin user', { socketId: socket.id });
          return respond({ success: false, message: 'Admin access is required.' });
        }
        socket.data.isAdmin = true;
        socket.join('admin_room');
        const selectSession = {
          externalId: true, type: true, status: true, updatedAt: true,
          messages: { take: 1, orderBy: { timestamp: 'desc' }, select: { text: true } }
        };
        const sessions = await withTimeout(Promise.all([
          prisma.chatSession.findMany({ where: { status: { in: ['waiting', 'active'] } }, orderBy: { updatedAt: 'desc' }, take: 50, select: selectSession }),
          prisma.chatSession.findMany({ where: { status: 'closed' }, orderBy: { updatedAt: 'desc' }, take: 25, select: selectSession })
        ]).then(([active, closed]) => [...active, ...closed]), 5000, 'Timeout fetching support sessions');
        socket.emit('active_sessions', sessions.map(session => ({
          chatId: session.externalId,
          type: session.type,
          status: session.status,
          timestamp: session.updatedAt,
          lastMessage: session.messages[0]?.text
        })));
        respond({ success: true });
      } catch (error) {
        logger.warn('Could not initialize socket admin session', { socketId: socket.id, errorCode: error.code || 'SOCKET_ADMIN_AUTH_ERROR' });
        respond({ success: false, message: 'Admin support could not be loaded.' });
      }
    });

    socket.on('agent_joined', async (data, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const chatId = data?.chatId;
      if (!socket.data.isAdmin || typeof chatId !== 'string' || !isDbConnected()) {
        return respond({ success: false, message: 'Admin access is required.' });
      }
      try {
        const session = await prisma.chatSession.findUnique({ where: { externalId: chatId }, select: { id: true, type: true, status: true } });
        if (!session) return respond({ success: false, message: 'Support conversation not found.' });
        if (session.status === 'closed') return respond({ success: false, message: 'This conversation is already closed.' });
        await prisma.chatSession.update({ where: { id: session.id }, data: { status: 'active' } });
        socket.join(chatId);
        io.to(chatId).emit('agent_joined', { agentName: 'Sitemendr support', type: session.type });
        respond({ success: true });
      } catch (error) {
        logger.error('SOCKET_AGENT_JOIN_ERROR:', { errorCode: 'SOCKET_AGENT_JOIN_ERROR', error: error.message, chatId });
        respond({ success: false, message: 'Could not join this conversation.' });
      }
    });

    socket.on('close_chat', async (data, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
      const chatId = data?.chatId;
      if (!socket.data.isAdmin || typeof chatId !== 'string' || !isDbConnected()) {
        return respond({ success: false, message: 'Admin access is required.' });
      }
      try {
        const session = await prisma.chatSession.findUnique({ where: { externalId: chatId }, select: { id: true } });
        if (!session) return respond({ success: false, message: 'Support conversation not found.' });
        await prisma.chatSession.update({ where: { id: session.id }, data: { status: 'closed' } });
        io.to(chatId).emit('chat_closed', { chatId });
        respond({ success: true });
      } catch (error) {
        logger.error('SOCKET_CHAT_CLOSE_ERROR:', { errorCode: 'SOCKET_CHAT_CLOSE_ERROR', error: error.message, chatId });
        respond({ success: false, message: 'Could not close this conversation.' });
      }
    });

    socket.on('disconnect', () => logger.info(`User disconnected: ${socket.id}`));
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

const notifyUser = (userId, event, data) => {
  if (io) io.to(`user_${userId}`).emit(event, data);
};

const notifyAdmins = (event, data) => {
  if (io) io.to('admin_room').emit(event, data);
};

module.exports = { initSocket, getIO, notifyUser, notifyAdmins };
