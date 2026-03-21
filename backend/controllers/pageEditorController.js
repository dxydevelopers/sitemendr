'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all pages for a subscription
const getPages = async (req, res) => {
  try {
    const { subscriptionId } = req.query;
    
    if (!subscriptionId) {
      return res.status(400).json({ success: false, error: 'subscriptionId is required' });
    }

    const pages = await prisma.page.findMany({
      where: { subscriptionId },
      include: {
        sections: {
          include: {
            section: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single page by ID
const getPage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            section: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new page
const createPage = async (req, res) => {
  try {
    const { subscriptionId, type, slug, title, isHome } = req.body;

    if (!subscriptionId || !title) {
      return res.status(400).json({ success: false, error: 'subscriptionId and title are required' });
    }

    // If this is set as home, unset any existing home page
    if (isHome) {
      await prisma.page.updateMany({
        where: { subscriptionId, isHome: true },
        data: { isHome: false }
      });
    }

    // If slug is not provided, generate from title
    const pageSlug = slug || '/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const page = await prisma.page.create({
      data: {
        subscriptionId,
        type: type || 'CUSTOM',
        slug: pageSlug,
        title,
        isHome: isHome || false
      }
    });

    res.status(201).json({ success: true, data: page });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update page
const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, type, isPublished, isHome } = req.body;

    // If setting as home, unset any existing home
    if (isHome) {
      const currentPage = await prisma.page.findUnique({ where: { id } });
      if (currentPage) {
        await prisma.page.updateMany({
          where: { subscriptionId: currentPage.subscriptionId, isHome: true, NOT: { id } },
          data: { isHome: false }
        });
      }
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(type && { type }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isHome !== undefined && { isHome })
      }
    });

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete page
const deletePage = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.page.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Publish page
const publishPage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.update({
      where: { id },
      data: {
        isPublished: true,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error publishing page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Unpublish page
const unpublishPage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.update({
      where: { id },
      data: {
        isPublished: false
      }
    });

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error unpublishing page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add section to page
const addSectionToPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { sectionId, settings, order } = req.body;

    if (!sectionId) {
      return res.status(400).json({ success: false, error: 'sectionId is required' });
    }

    // Get the highest order and add to it
    const lastSection = await prisma.pageSection.findFirst({
      where: { pageId },
      orderBy: { order: 'desc' }
    });

    const newOrder = order ?? (lastSection ? lastSection.order + 1 : 0);

    const pageSection = await prisma.pageSection.create({
      data: {
        pageId,
        sectionId,
        order: newOrder,
        settings: settings || {}
      }
    });

    res.status(201).json({ success: true, data: pageSection });
  } catch (error) {
    console.error('Error adding section to page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update section settings
const updatePageSection = async (req, res) => {
  try {
    const { pageId, sectionId } = req.params;
    const { settings, order } = req.body;

    const pageSection = await prisma.pageSection.updateMany({
      where: { 
        pageId,
        id: sectionId 
      },
      data: {
        ...(settings && { settings }),
        ...(order !== undefined && { order })
      }
    });

    res.json({ success: true, data: pageSection });
  } catch (error) {
    console.error('Error updating page section:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Remove section from page
const removeSectionFromPage = async (req, res) => {
  try {
    const { pageId, sectionId } = req.params;

    await prisma.pageSection.delete({
      where: { id: sectionId }
    });

    res.json({ success: true, message: 'Section removed from page' });
  } catch (error) {
    console.error('Error removing section from page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reorder sections
const reorderSections = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { sections } = req.body; // Array of { id, order }

    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ success: false, error: 'sections array is required' });
    }

    // Update each section's order
    await Promise.all(
      sections.map(({ id, order }) =>
        prisma.pageSection.updateMany({
          where: { id, pageId },
          data: { order }
        })
      )
    );

    res.json({ success: true, message: 'Sections reordered successfully' });
  } catch (error) {
    console.error('Error reordering sections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  publishPage,
  unpublishPage,
  addSectionToPage,
  updatePageSection,
  removeSectionFromPage,
  reorderSections
};
