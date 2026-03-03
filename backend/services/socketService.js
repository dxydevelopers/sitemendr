const { Server } = require("socket.io");
const logger = require("../config/logger");
const { prisma } = require("../config/db");

const normalizeOrigin = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\/$/, '');
};

const initSocket = (server) => {
  const frontendOrigin = normalizeOrigin(process.env.FRONTEND_URL) || "http://localhost:3000";
  const io = new Server(server, {
    cors: {
      origin: frontendOrigin,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  logger.info("WebSocket server initialized");

  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join a specific room based on session/user ID
    socket.on("join_chat", async (chatId) => {
      socket.join(chatId);
      logger.info(`User ${socket.id} joined chat: ${chatId}`);
      
      // Send message history to the user/agent joining
      try {
        const session = await prisma.chatSession.findUnique({
          where: { externalId: chatId },
          include: { messages: { orderBy: { timestamp: 'asc' } } }
        });
        
        if (session) {
          socket.emit("chat_history", session.messages);
        }
      } catch (err) {
        logger.error("Error fetching chat history", {
          errorCode: 'SOCKET_CHAT_HISTORY_ERROR',
          error: err.message,
          chatId
        });
      }
    });

    // Handle messages
    socket.on("send_message", async (data) => {
      // data: { chatId, text, sender, timestamp }
      const { chatId, text, sender } = data;
      
      socket.to(chatId).emit("receive_message", data);
      logger.info(`Message in ${chatId}: ${text}`);

      // Persist message to database
      try {
        let session = await prisma.chatSession.findUnique({
          where: { externalId: chatId }
        });

        if (!session) {
          session = await prisma.chatSession.create({
            data: {
              externalId: chatId,
              status: 'active'
            }
          });
        }

        await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            text,
            sender,
            timestamp: new Date()
          }
        });
      } catch (err) {
        logger.error("Error persisting message", {
          errorCode: 'SOCKET_MESSAGE_PERSIST_ERROR',
          error: err.message,
          chatId
        });
      }
    });

    // Handle agent handoff
    socket.on("request_agent", async (data) => {
      // data: { chatId, type: 'technical' | 'billing' | 'sales' }
      const { chatId, type } = data;
      logger.info(`Agent requested for ${chatId}: ${type}`);
      
      try {
        await prisma.chatSession.upsert({
          where: { externalId: chatId },
          update: { status: 'waiting', type },
          create: { externalId: chatId, status: 'waiting', type }
        });
      } catch (err) {
        logger.error("Error updating chat session status", {
          errorCode: 'SOCKET_AGENT_REQUEST_ERROR',
          error: err.message,
          chatId
        });
      }

      // Notify admins (in a 'admin_room')
      io.to("admin_room").emit("new_support_request", {
        chatId: data.chatId,
        type: data.type,
        timestamp: new Date()
      });
    });

    socket.on("admin_join", async () => {
      socket.join("admin_room");
      logger.info(`Admin joined: ${socket.id}`);
      
      // Send list of active/waiting sessions to admin
      try {
        const waitingSessions = await prisma.chatSession.findMany({
          where: { status: { in: ['waiting', 'active'] } },
          orderBy: { updatedAt: 'desc' },
          include: { messages: { take: 1, orderBy: { timestamp: 'desc' } } }
        });
        
        socket.emit("active_sessions", waitingSessions.map(s => ({
          chatId: s.externalId,
          type: s.type,
          status: s.status,
          timestamp: s.updatedAt,
          lastMessage: s.messages[0]?.text
        })));
      } catch (err) {
        logger.error("Error fetching active sessions for admin", {
          errorCode: 'SOCKET_ADMIN_FETCH_SESSIONS_ERROR',
          error: err.message
        });
      }
    });

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initSocket };
