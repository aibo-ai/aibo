const express = require('express');
const bodyParser = require('body-parser');

// Import the compiled function
const { validateUrl, validateHtml } = require('./dist/azure-functions/TechnicalSeoValidator/index.js');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'Technical SEO Validator' });
});

// Main validation endpoint
app.post('/api/validate', async (req, res) => {
  console.log('Received validation request');
  
  try {
    const params = {
      url: req.body.url,
      html: req.body.html,
      contentType: req.body.contentType,
      validateSemanticHtml: req.body.validateSemanticHtml,
      validateAccessibility: req.body.validateAccessibility,
      validateHeadingStructure: req.body.validateHeadingStructure,
      validateMetaTags: req.body.validateMetaTags,
      validateImages: req.body.validateImages,
      validateLinks: req.body.validateLinks,
      validateMobileFriendly: req.body.validateMobileFriendly,
      validatePageSpeed: req.body.validatePageSpeed,
      validateStructuredData: req.body.validateStructuredData,
      validateSocialTags: req.body.validateSocialTags
    };

    if (!params.url && !params.html) {
      return res.status(400).json({ error: 'Either URL or HTML content is required' });
    }

    let result;
    if (params.url) {
      console.log(`Validating URL: ${params.url}`);
      result = await validateUrl(params);
    } else {
      console.log('Validating HTML content');
      result = await validateHtml(params);
    }

    console.log('Validation completed successfully');
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in Technical SEO Validator:', error);
    res.status(500).json({ 
      error: `Technical SEO validation failed: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Technical SEO Validator server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Validation endpoint available at http://localhost:${PORT}/api/validate`);
});
