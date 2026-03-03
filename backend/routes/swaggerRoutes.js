const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

const router = express.Router();

if (!swaggerSpec) {
  router.get('/', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Swagger is disabled because swagger-jsdoc is not available.'
    });
  });

  router.get('/json', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Swagger is disabled because swagger-jsdoc is not available.'
    });
  });

  router.get('/yaml', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Swagger is disabled because swagger-jsdoc is not available.'
    });
  });
} else {
  // Swagger JSON endpoint
  router.get('/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger YAML endpoint
  router.get('/yaml', (req, res) => {
    const yaml = require('js-yaml');
    const specYaml = yaml.dump(swaggerSpec);
    res.setHeader('Content-Type', 'text/yaml');
    res.send(specYaml);
  });

  // Swagger UI - use custom CSS
  const customCss = `
    .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5em; }
    .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
    .swagger-ui .opblock-tag { font-size: 1.2em; font-weight: 600; }
    .swagger-ui .opblock { margin-bottom: 15px; }
  `;

  // Swagger UI
  router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss,
    customSiteTitle: 'Sitemendr API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      tryItOutEnabled: true
    },
    onRequest: (req) => {
      // Log API documentation access
      console.log(`API Docs accessed from: ${req.ip}`);
    }
  }));
}

module.exports = router;
