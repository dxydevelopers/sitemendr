const { prisma } = require("../config/db");
const logger = require("../config/logger");
const path = require('path');
const fs = require('fs');

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    const media = await prisma.media.create({
      data: {
        filename: req.file.originalname,
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
        userId: req.user.id
      }
    });

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    logger.error('UPLOAD_MEDIA_ERROR:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAllMedia = async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      where: req.user.role === 'admin' ? {} : { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: media });
  } catch (error) {
    logger.error('GET_ALL_MEDIA_ERROR:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    
    const media = await prisma.media.findUnique({ where: { id } });
    
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && media.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Delete from filesystem
    const filePath = path.join(__dirname, '../uploads', path.basename(media.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from DB
    await prisma.media.delete({ where: { id } });

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    logger.error('DELETE_MEDIA_ERROR:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
