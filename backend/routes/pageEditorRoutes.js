const express = require('express');
const router = express.Router();
const pageEditorController = require('../controllers/pageEditorController');
const sectionController = require('../controllers/sectionController');
const themeController = require('../controllers/themeController');
const { authenticate } = require('../middleware/auth');

// All page editor routes require authentication
router.use(authenticate);

// Page routes
router.get('/pages', pageEditorController.getPages);
router.get('/pages/:id', pageEditorController.getPage);
router.post('/pages', pageEditorController.createPage);
router.put('/pages/:id', pageEditorController.updatePage);
router.delete('/pages/:id', pageEditorController.deletePage);
router.post('/pages/:id/publish', pageEditorController.publishPage);
router.post('/pages/:id/unpublish', pageEditorController.unpublishPage);

// Section routes
router.get('/sections', sectionController.getSectionTemplates);
router.get('/sections/categories', sectionController.getCategories);
router.get('/sections/:id', sectionController.getSectionTemplate);
router.post('/sections', sectionController.createSectionTemplate);
router.put('/sections/:id', sectionController.updateSectionTemplate);
router.delete('/sections/:id', sectionController.deleteSectionTemplate);

// Page section routes
router.post('/pages/:pageId/sections', pageEditorController.addSectionToPage);
router.put('/pages/:pageId/sections/:sectionId', pageEditorController.updatePageSection);
router.delete('/pages/:pageId/sections/:sectionId', pageEditorController.removeSectionFromPage);
router.put('/pages/:pageId/sections/reorder', pageEditorController.reorderSections);

// Theme routes
router.get('/theme', themeController.getThemeSettings);
router.put('/theme/:subscriptionId', themeController.updateThemeSettings);
router.post('/theme/preview', themeController.previewTheme);
router.post('/theme/:subscriptionId/reset', themeController.resetTheme);

module.exports = router;
