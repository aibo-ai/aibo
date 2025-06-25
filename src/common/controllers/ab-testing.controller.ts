import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { ABTestingService, ABTest, ABTestResult } from '../services/ab-testing.service';

@Controller('ab-testing')
export class ABTestingController {
  constructor(private abTestingService: ABTestingService) {}

  /**
   * Get all A/B tests
   */
  @Get()
  async getTests() {
    try {
      const tests = this.abTestingService.getTests();
      
      return {
        success: true,
        data: tests,
        count: tests.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get specific A/B test
   */
  @Get(':testId')
  async getTest(@Param('testId') testId: string) {
    try {
      const test = this.abTestingService.getTest(testId);
      
      if (!test) {
        return {
          success: false,
          error: 'Test not found'
        };
      }

      return {
        success: true,
        data: test
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create new A/B test
   */
  @Post()
  async createTest(@Body() testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const test = await this.abTestingService.createTest(testData);
      
      return {
        success: true,
        data: test,
        message: 'A/B test created successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get variant assignment for user
   */
  @Get(':testId/variant')
  async getVariant(
    @Param('testId') testId: string,
    @Query('userId') userId: string,
    @Query('sessionId') sessionId?: string
  ) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'userId is required'
        };
      }

      const variant = await this.abTestingService.getVariantForUser(testId, userId, sessionId);
      
      return {
        success: true,
        data: variant
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record test result
   */
  @Post(':testId/result')
  async recordResult(
    @Param('testId') testId: string,
    @Body() resultData: Omit<ABTestResult, 'testId' | 'timestamp'>
  ) {
    try {
      const success = await this.abTestingService.recordResult({
        ...resultData,
        testId
      });
      
      return {
        success,
        message: success ? 'Result recorded successfully' : 'Failed to record result'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get test analytics
   */
  @Get(':testId/analytics')
  async getAnalytics(@Param('testId') testId: string) {
    try {
      const analytics = await this.abTestingService.getTestAnalytics(testId);
      
      if (!analytics) {
        return {
          success: false,
          error: 'Analytics not available for this test'
        };
      }

      return {
        success: true,
        data: analytics
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update test status
   */
  @Put(':testId/status')
  async updateStatus(
    @Param('testId') testId: string,
    @Body() body: { status: ABTest['status'] }
  ) {
    try {
      const success = await this.abTestingService.updateTestStatus(testId, body.status);
      
      return {
        success,
        message: success ? 'Test status updated successfully' : 'Failed to update test status'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get A/B testing dashboard data
   */
  @Get('dashboard/overview')
  async getDashboard() {
    try {
      const tests = this.abTestingService.getTests();
      
      const summary = {
        totalTests: tests.length,
        runningTests: tests.filter(t => t.status === 'running').length,
        completedTests: tests.filter(t => t.status === 'completed').length,
        draftTests: tests.filter(t => t.status === 'draft').length,
        pausedTests: tests.filter(t => t.status === 'paused').length
      };

      // Get analytics for running tests
      const runningTestsAnalytics = await Promise.all(
        tests
          .filter(t => t.status === 'running')
          .map(async t => ({
            test: t,
            analytics: await this.abTestingService.getTestAnalytics(t.id)
          }))
      );

      return {
        success: true,
        data: {
          summary,
          runningTests: runningTestsAnalytics,
          recentTests: tests
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get content optimization recommendations
   */
  @Get('recommendations/content')
  async getContentRecommendations() {
    try {
      const tests = this.abTestingService.getTests();
      const completedTests = tests.filter(t => t.status === 'completed');
      
      const recommendations = [];

      for (const test of completedTests) {
        const analytics = await this.abTestingService.getTestAnalytics(test.id);
        if (analytics && analytics.recommendations.length > 0) {
          recommendations.push({
            testName: test.name,
            testId: test.id,
            recommendations: analytics.recommendations,
            completedDate: test.endDate
          });
        }
      }

      return {
        success: true,
        data: recommendations
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test DALL-E image generation integration
   */
  @Post('test/image-generation')
  async testImageGeneration(@Body() body: { prompt: string; style?: string }) {
    try {
      // This would integrate with the image generation service
      const mockResult = {
        success: true,
        imageUrl: `https://example.com/generated-image-${Date.now()}.png`,
        prompt: body.prompt,
        style: body.style || 'professional',
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: mockResult,
        message: 'DALL-E image generation test completed'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test ElevenLabs audio generation integration
   */
  @Post('test/audio-generation')
  async testAudioGeneration(@Body() body: { text: string; voice?: string }) {
    try {
      // This would integrate with the audio generation service
      const mockResult = {
        success: true,
        audioUrl: `https://example.com/generated-audio-${Date.now()}.mp3`,
        text: body.text,
        voice: body.voice || 'professional',
        duration: Math.floor(body.text.length / 10), // Rough estimate
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: mockResult,
        message: 'ElevenLabs audio generation test completed'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for A/B testing service
   */
  @Get('health/check')
  async healthCheck() {
    try {
      const tests = this.abTestingService.getTests();
      const runningTests = tests.filter(t => t.status === 'running');
      
      return {
        success: true,
        status: 'healthy',
        data: {
          totalTests: tests.length,
          runningTests: runningTests.length,
          serviceUptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}
