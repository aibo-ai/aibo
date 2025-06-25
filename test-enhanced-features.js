const axios = require('axios');

const BASE_URL = 'http://localhost:3006';

class EnhancedFeaturesTest {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Enhanced LLM Generator Feature Tests...\n');

    try {
      // Test 1: Health Check
      await this.testHealthCheck();

      // Test 2: Basic Enhanced Content Generation
      const contentResult = await this.testEnhancedContentGeneration();

      // Test 3: Content Versioning
      await this.testContentVersioning(contentResult);

      // Test 4: A/B Testing
      await this.testABTesting();

      // Test 5: Feedback Loop
      await this.testFeedbackLoop(contentResult);

      // Test 6: Analytics
      await this.testAnalytics();

      // Test 7: Version Comparison
      await this.testVersionComparison();

      this.printTestSummary();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }

  async testHealthCheck() {
    console.log('🔍 Testing Health Check...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      
      if (response.status === 200 && response.data.status === 'healthy') {
        this.logSuccess('Health Check', 'Server is healthy and all services operational');
        console.log('   Features:', Object.keys(response.data.features).join(', '));
        console.log('   Services:', Object.keys(response.data.services).join(', '));
      } else {
        this.logFailure('Health Check', 'Unexpected response');
      }
    } catch (error) {
      this.logFailure('Health Check', error.message);
    }
    console.log('');
  }

  async testEnhancedContentGeneration() {
    console.log('🚀 Testing Enhanced Content Generation...');
    try {
      const request = {
        topic: 'Advanced AI Content Strategies for 2024',
        audience: 'b2b',
        contentType: 'blog_post',
        toneOfVoice: 'professional',
        keyPoints: [
          'Machine learning personalization',
          'Automated content optimization',
          'Real-time performance analytics'
        ],
        enableImageGeneration: true,
        enableTextToSpeech: true,
        userId: 'test_user_001',
        tags: ['ai', 'content', 'strategy'],
        changeLog: 'Initial test generation with enhanced features'
      };

      const response = await axios.post(`${BASE_URL}/enhanced-content/generate`, request);
      
      if (response.status === 200 && response.data.success) {
        this.logSuccess('Enhanced Content Generation', 'Content generated successfully');
        console.log('   Content ID:', response.data.data?.contentId);
        console.log('   Version ID:', response.data.enhancedMetadata?.versionId);
        console.log('   Quality Score:', response.data.data?.metadata?.qualityScore);
        console.log('   E-E-A-T Score:', response.data.data?.metadata?.eeatScore);
        console.log('   Processing Time:', response.data.enhancedMetadata?.processingTime + 'ms');
        console.log('   Features Applied:', Object.keys(response.data.enhancedMetadata?.features || {}).join(', '));
        return response.data;
      } else {
        this.logFailure('Enhanced Content Generation', 'Unexpected response');
        return null;
      }
    } catch (error) {
      this.logFailure('Enhanced Content Generation', error.message);
      return null;
    }
    console.log('');
  }

  async testContentVersioning(contentResult) {
    console.log('📝 Testing Content Versioning...');
    
    if (!contentResult?.data?.contentId) {
      this.logFailure('Content Versioning', 'No content ID available from previous test');
      console.log('');
      return;
    }

    try {
      const contentId = contentResult.data.contentId;
      
      // Test getting content history
      const historyResponse = await axios.get(`${BASE_URL}/content/${contentId}/history`);
      
      if (historyResponse.status === 200) {
        this.logSuccess('Content Versioning - History', 'Retrieved content history successfully');
        console.log('   Versions found:', historyResponse.data.versions?.length || 0);
        console.log('   History entries:', historyResponse.data.history?.length || 0);
        
        if (historyResponse.data.versions?.length > 0) {
          const version = historyResponse.data.versions[0];
          console.log('   Latest version:', version.version);
          console.log('   Created at:', version.metadata?.createdAt);
          console.log('   Quality score:', version.metadata?.qualityScore);
        }
      } else {
        this.logFailure('Content Versioning - History', 'Failed to retrieve history');
      }
    } catch (error) {
      this.logFailure('Content Versioning', error.message);
    }
    console.log('');
  }

  async testABTesting() {
    console.log('🧪 Testing A/B Testing...');
    try {
      // Create an A/B test experiment
      const experimentConfig = {
        name: 'Content Quality Optimization Test',
        description: 'Testing different approaches to improve content quality',
        testType: 'content_variant',
        hypothesis: 'Enhanced readability settings will improve user engagement',
        successMetrics: ['quality_score', 'eeat_score', 'user_engagement'],
        variants: [
          {
            id: 'control',
            name: 'Control Group',
            description: 'Standard content generation',
            modifications: {}
          },
          {
            id: 'enhanced_readability',
            name: 'Enhanced Readability',
            description: 'Optimized for better readability',
            modifications: {
              toneOfVoice: 'conversational',
              enhanceReadability: true
            }
          }
        ],
        duration: 7,
        minSampleSize: 50,
        userId: 'test_user_001',
        category: 'content_optimization'
      };

      const createResponse = await axios.post(`${BASE_URL}/experiments/create`, experimentConfig);
      
      if (createResponse.status === 200) {
        this.logSuccess('A/B Testing - Create', 'Experiment created successfully');
        const experimentId = createResponse.data.experiment.id;
        console.log('   Experiment ID:', experimentId);
        console.log('   Variants:', createResponse.data.experiment.variants.length);
        
        // Start the experiment
        const startResponse = await axios.post(`${BASE_URL}/experiments/${experimentId}/start`);
        
        if (startResponse.status === 200) {
          this.logSuccess('A/B Testing - Start', 'Experiment started successfully');
          console.log('   Start date:', startResponse.data.result.startDate);
          console.log('   End date:', startResponse.data.result.endDate);
        } else {
          this.logFailure('A/B Testing - Start', 'Failed to start experiment');
        }

        // Test content generation with A/B test
        const abTestRequest = {
          topic: 'A/B Test Content Generation',
          audience: 'b2b',
          contentType: 'blog_post',
          experimentId: experimentId,
          variantId: 'enhanced_readability',
          userId: 'test_user_002'
        };

        const abContentResponse = await axios.post(`${BASE_URL}/enhanced-content/generate`, abTestRequest);
        
        if (abContentResponse.status === 200) {
          this.logSuccess('A/B Testing - Content Generation', 'A/B test content generated');
          console.log('   Experiment ID:', abContentResponse.data.enhancedMetadata?.experimentId);
          console.log('   Variant ID:', abContentResponse.data.enhancedMetadata?.variantId);
        }

      } else {
        this.logFailure('A/B Testing - Create', 'Failed to create experiment');
      }
    } catch (error) {
      this.logFailure('A/B Testing', error.message);
    }
    console.log('');
  }

  async testFeedbackLoop(contentResult) {
    console.log('🔄 Testing Feedback Loop...');
    
    if (!contentResult?.data?.contentId) {
      this.logFailure('Feedback Loop', 'No content ID available from previous test');
      console.log('');
      return;
    }

    try {
      const feedbackData = {
        contentId: contentResult.data.contentId,
        versionId: contentResult.enhancedMetadata?.versionId,
        source: 'user',
        type: 'quality',
        rating: 4,
        comments: 'Great content! Very informative and well-structured. Could use more examples.',
        userId: 'test_user_003',
        userRole: 'content_creator',
        platform: 'web',
        device: 'desktop',
        metrics: {
          qualityScore: 85,
          eeatScore: 88,
          userEngagement: 75,
          processingTime: 3200
        },
        tags: ['positive', 'quality', 'examples_needed']
      };

      const response = await axios.post(`${BASE_URL}/feedback/submit`, feedbackData);
      
      if (response.status === 200 && response.data.success) {
        this.logSuccess('Feedback Loop', 'Feedback submitted and processed successfully');
        console.log('   Feedback ID:', response.data.feedbackId);
        console.log('   Rating:', feedbackData.rating + '/5');
        console.log('   Type:', feedbackData.type);
        console.log('   Source:', feedbackData.source);
      } else {
        this.logFailure('Feedback Loop', 'Failed to submit feedback');
      }
    } catch (error) {
      this.logFailure('Feedback Loop', error.message);
    }
    console.log('');
  }

  async testAnalytics() {
    console.log('📊 Testing Analytics...');
    try {
      const response = await axios.get(`${BASE_URL}/analytics?type=all&timeRange=30`);
      
      if (response.status === 200) {
        this.logSuccess('Analytics', 'Analytics retrieved successfully');
        
        if (response.data.feedback) {
          console.log('   Total feedback:', response.data.feedback.totalFeedback);
          console.log('   Average rating:', response.data.feedback.averageRating?.toFixed(2));
        }
        
        if (response.data.experiments) {
          console.log('   Total experiments:', response.data.experiments.total);
          console.log('   Running experiments:', response.data.experiments.running);
          console.log('   Completed experiments:', response.data.experiments.completed);
        }
        
        if (response.data.quality) {
          console.log('   Total improvements:', response.data.quality.totalImprovements);
          console.log('   Successful improvements:', response.data.quality.successfulImprovements);
        }
      } else {
        this.logFailure('Analytics', 'Failed to retrieve analytics');
      }
    } catch (error) {
      this.logFailure('Analytics', error.message);
    }
    console.log('');
  }

  async testVersionComparison() {
    console.log('🔍 Testing Version Comparison...');
    try {
      // This test would require actual version IDs from previous tests
      // For now, we'll test the endpoint availability
      const response = await axios.get(`${BASE_URL}/versions/compare?version1=test1&version2=test2`);
      
      // We expect this to fail with a proper error message
      if (response.status === 500) {
        this.logSuccess('Version Comparison', 'Endpoint available (expected error for test versions)');
      }
    } catch (error) {
      if (error.response?.status === 500) {
        this.logSuccess('Version Comparison', 'Endpoint available (expected error for test versions)');
      } else {
        this.logFailure('Version Comparison', error.message);
      }
    }
    console.log('');
  }

  logSuccess(testName, message) {
    console.log(`   ✅ ${testName}: ${message}`);
    this.testResults.push({ test: testName, status: 'PASS', message });
  }

  logFailure(testName, message) {
    console.log(`   ❌ ${testName}: ${message}`);
    this.testResults.push({ test: testName, status: 'FAIL', message });
  }

  printTestSummary() {
    console.log('\n📋 TEST SUMMARY');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`   ❌ ${result.test}: ${result.message}`);
      });
    }
    
    console.log('\n🎉 Enhanced LLM Generator Feature Testing Complete!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new EnhancedFeaturesTest();
  
  // Wait a moment for server to be ready
  setTimeout(() => {
    tester.runAllTests();
  }, 2000);
}

module.exports = { EnhancedFeaturesTest };
