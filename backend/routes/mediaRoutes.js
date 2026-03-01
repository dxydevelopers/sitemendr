const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.post('/upload', upload.single('file'), mediaController.uploadMedia);
router.get('/', mediaController.getAllMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
