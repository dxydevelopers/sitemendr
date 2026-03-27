'use strict';

const { prisma } = require('../config/db');

// Get all section templates
const getSectionTemplates = async (req, res) => {
  try {
    const { category, isBuiltIn } = req.query;

    const where = {};
    if (category) where.category = category;
    if (isBuiltIn !== undefined) where.isBuiltIn = isBuiltIn === 'true';
    where.isActive = true;

    const sections = await prisma.sectionTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Error fetching section templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single section template
const getSectionTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await prisma.sectionTemplate.findUnique({
      where: { id }
    });

    if (!section) {
      return res.status(404).json({ success: false, error: 'Section template not found' });
    }

    res.json({ success: true, data: section });
  } catch (error) {
    console.error('Error fetching section template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create custom section template
const createSectionTemplate = async (req, res) => {
  try {
    const { name, category, icon, description, defaultSettings, schema, componentName } = req.body;

    if (!name || !category || !componentName) {
      return res.status(400).json({ success: false, error: 'name, category, and componentName are required' });
    }

    const section = await prisma.sectionTemplate.create({
      data: {
        name,
        category,
        icon: icon || null,
        description: description || null,
        defaultSettings: defaultSettings || {},
        schema: schema || {},
        componentName,
        isBuiltIn: false,
        isActive: true
      }
    });

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    console.error('Error creating section template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update section template
const updateSectionTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description, defaultSettings, schema, isActive } = req.body;

    const section = await prisma.sectionTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(icon !== undefined && { icon }),
        ...(description !== undefined && { description }),
        ...(defaultSettings && { defaultSettings }),
        ...(schema && { schema }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ success: true, data: section });
  } catch (error) {
    console.error('Error updating section template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete section template (only non-built-in)
const deleteSectionTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a built-in section
    const existing = await prisma.sectionTemplate.findUnique({ where: { id } });
    if (existing?.isBuiltIn) {
      return res.status(403).json({ success: false, error: 'Cannot delete built-in sections' });
    }

    await prisma.sectionTemplate.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Section template deleted successfully' });
  } catch (error) {
    console.error('Error deleting section template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.sectionTemplate.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    res.json({ success: true, data: categories.map(c => c.category) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getSectionTemplates,
  getSectionTemplate,
  createSectionTemplate,
  updateSectionTemplate,
  deleteSectionTemplate,
  getCategories
};
