const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (no authentication required)
router.get('/posts', blogController.getPublishedPosts);
router.get('/posts/:slug', blogController.getPostBySlug);
router.get('/posts/:slug/related', blogController.getRelatedPosts);
router.get('/meta', blogController.getBlogMeta);

// Routes that require authentication
router.use(authenticate);
router.post('/posts/:slug/comments', blogController.addComment);
router.post('/posts/:slug/like', blogController.toggleLike);
router.get('/posts/:slug/comments', blogController.getComments);

// Admin routes (require admin role)
router.use(requireAdmin);
router.get('/admin/posts', blogController.getAllPosts);
router.post('/admin/posts', upload.single('featuredImage'), blogController.createPost);
router.put('/admin/posts/:id', upload.single('featuredImage'), blogController.updatePost);
router.delete('/admin/posts/:id', blogController.deletePost);

module.exports = router;
