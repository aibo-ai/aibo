import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getRoot() {
    return {
      message: 'Content Architect API is running',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/production/health',
        gemini: '/gemini/health',
        seoData: '/seo-data/health',
        abTesting: '/ab-testing/health/check',
        contentArchitect: '/content-architect/health'
      },
      documentation: {
        frontend: 'http://localhost:3004',
        api: 'http://localhost:3003'
      }
    };
  }

  @Get('api')
  getApiInfo() {
    return {
      name: 'Content Architect API',
      description: 'Comprehensive AI-powered content generation and analysis platform',
      version: '1.0.0',
      features: [
        'Gemini AI Integration',
        'SEO Data Analysis',
        'Social Listening',
        'Product Intelligence',
        'A/B Testing',
        'Content Generation',
        'Performance Monitoring'
      ],
      endpoints: {
        production: '/production/*',
        gemini: '/gemini/*',
        seoData: '/seo-data/*',
        integrations: '/integrations/*',
        abTesting: '/ab-testing/*',
        contentArchitect: '/content-architect/*',
        bottomLayer: '/bottom-layer/*',
        middleLayer: '/middle-layer/*',
        topLayer: '/top-layer/*',
        orchestrator: '/orchestrator/*'
      }
    };
  }
}
