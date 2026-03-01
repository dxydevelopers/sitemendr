const { prisma } = require('../config/db');
const logger = require('../config/logger');

// Helper to calculate reading time
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Get all published blog posts with pagination
exports.getPublishedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const tag = req.query.tag;
    const search = req.query.search;

    const where = { status: 'published' };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by tag
    if (tag) {
      where.tags = { has: tag };
    }

    // Search in title, excerpt, or content
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit
    });

    const total = await prisma.blogPost.count({ where });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get published posts', {
      errorCode: 'GET_PUBLISHED_POSTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get blog posts'
    });
  }
};

// Get single blog post by slug
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: {
        author: {
          select: { name: true, email: true }
        },
        comments: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count
    const updatedPost = await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: { name: true, email: true }
        },
        comments: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    logger.error('Failed to get blog post by slug', {
      errorCode: 'GET_BLOG_POST_BY_SLUG_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get blog post'
    });
  }
};

// Get blog categories and tags
exports.getBlogMeta = async (req, res) => {
  try {
    const publishedPosts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { category: true, tags: true }
    });

    const categories = [...new Set(publishedPosts.map(p => p.category))];
    const allTags = publishedPosts.flatMap(p => p.tags);
    const tags = [...new Set(allTags)];

    // Get category counts
    const categoryCountsRaw = await prisma.blogPost.groupBy({
      by: ['category'],
      where: { status: 'published' },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    });
    const categoryCounts = categoryCountsRaw.map(c => ({ id: c.category, count: c._count.category }));

    // Get tag counts
    const tagCountsMap = {};
    allTags.forEach(tag => {
      tagCountsMap[tag] = (tagCountsMap[tag] || 0) + 1;
    });
    const tagCounts = Object.entries(tagCountsMap)
      .map(([tag, count]) => ({ id: tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    res.json({
      success: true,
      categories,
      tags,
      categoryCounts,
      tagCounts
    });
  } catch (error) {
    logger.error('Failed to get blog metadata', {
      errorCode: 'GET_BLOG_META_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get blog metadata'
    });
  }
};

// Get related posts based on category and tags
exports.getRelatedPosts = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, category: true, tags: true }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        id: { not: post.id },
        status: 'published',
        OR: [
          { category: post.category },
          { tags: { hasSome: post.tags } }
        ]
      },
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      take: 3,
      orderBy: { publishedAt: 'desc' }
    });

    res.json({
      success: true,
      posts: relatedPosts
    });
  } catch (error) {
    logger.error('Failed to get related posts', {
      errorCode: 'GET_RELATED_POSTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get related blog posts'
    });
  }
};

// Admin: Get all blog posts (including drafts)
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit
    });

    const total = await prisma.blogPost.count({ where });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Admin failed to get all posts', {
      errorCode: 'ADMIN_GET_ALL_POSTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get blog posts'
    });
  }
};

// Admin: Create new blog post
exports.createPost = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, seoTitle, seoDescription, seoKeywords, status } = req.body;
    const featuredImage = req.file ? `/uploads/${req.file.filename}` : null;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'A post with this title already exists'
      });
    }

    const readingTime = calculateReadingTime(content);

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        category,
        tags: tags || [],
        featuredImage,
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywords || [],
        authorId: req.admin.id, // Assuming req.admin.id is set by auth middleware
        status: status || 'draft',
        readingTime,
        publishedAt: status === 'published' ? new Date() : null
      },
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post
    });
  } catch (error) {
    logger.error('Failed to create blog post', {
      errorCode: 'CREATE_BLOG_POST_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post'
    });
  }
};

// Admin: Update blog post
exports.updatePost = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, seoTitle, seoDescription, seoKeywords, status } = req.body;
    const newFeaturedImage = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const data = {};

    // Update slug if title changed
    if (title && title !== post.title) {
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if new slug conflicts with existing post
      const existingPost = await prisma.blogPost.findFirst({
        where: { slug: newSlug, id: { not: post.id } }
      });
      if (existingPost) {
        return res.status(400).json({
          success: false,
          message: 'A post with this title already exists'
        });
      }
      data.slug = newSlug;
      data.title = title;
    }

    // Update fields
    if (excerpt) data.excerpt = excerpt;
    if (content) {
      data.content = content;
      data.readingTime = calculateReadingTime(content);
    }
    if (category) data.category = category;
    if (tags) data.tags = tags;
    if (newFeaturedImage) data.featuredImage = newFeaturedImage;
    if (seoTitle !== undefined) data.seoTitle = seoTitle;
    if (seoDescription !== undefined) data.seoDescription = seoDescription;
    if (seoKeywords) data.seoKeywords = seoKeywords;
    if (status) {
      data.status = status;
      if (status === 'published' && !post.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: post.id },
      data,
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    logger.error('Failed to update blog post', {
      errorCode: 'UPDATE_BLOG_POST_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update blog post'
    });
  }
};

// Admin: Delete blog post
exports.deletePost = async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Need to delete comments first due to relations if not using cascade
    await prisma.comment.deleteMany({ where: { blogPostId: post.id } });
    await prisma.blogPost.delete({ where: { id: post.id } });

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete blog post', {
      errorCode: 'DELETE_BLOG_POST_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog post'
    });
  }
};

// Add comment to blog post
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug }
    });

    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        blogPostId: post.id,
        userId: req.user.userId,
        content: content.trim()
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    logger.error('Failed to add comment', {
      errorCode: 'ADD_COMMENT_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

// Get comments for a blog post
exports.getComments = async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug }
    });

    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const comments = await prisma.comment.findMany({
      where: { blogPostId: post.id },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    logger.error('Failed to get comments', {
      errorCode: 'GET_COMMENTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get comments'
    });
  }
};

// Like/unlike blog post
exports.toggleLike = async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug }
    });

    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: post.id },
      data: { likes: { increment: 1 } }
    });

    res.json({
      success: true,
      likes: updatedPost.likes
    });
  } catch (error) {
    logger.error('Failed to toggle like', {
      errorCode: 'TOGGLE_LIKE_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};
