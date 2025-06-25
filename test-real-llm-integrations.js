const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

class RealLLMIntegrationTest {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Real LLM Integration Tests...\n');

    try {
      // Test 1: Health Check
      await this.testHealthCheck();

      // Test 2: Real Content Generation with Claude
      const contentResult = await this.testRealContentGeneration();

      // Test 3: DALL-E Image Generation
      await this.testImageGeneration();

      // Test 4: ElevenLabs Audio Generation
      await this.testAudioGeneration();

      // Test 5: Vector Database Storage
      await this.testVectorDatabaseStorage(contentResult);

      // Test 6: Vector Search
      await this.testVectorSearch();

      // Test 7: End-to-End Real Integration
      await this.testEndToEndRealIntegration();

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
        this.logSuccess('Health Check', 'Server is healthy and operational');
        console.log('   Services:', Object.keys(response.data.services || {}).join(', '));
      } else {
        this.logFailure('Health Check', 'Unexpected response');
      }
    } catch (error) {
      this.logFailure('Health Check', error.message);
    }
    console.log('');
  }

  async testRealContentGeneration() {
    console.log('🤖 Testing Real Content Generation with Claude...');
    try {
      const request = {
        topic: 'AI-Powered Content Strategy for Enterprise Success',
        audience: 'b2b',
        contentType: 'blog_post',
        toneOfVoice: 'professional',
        keyPoints: [
          'Machine learning personalization',
          'Automated content optimization',
          'Real-time performance analytics'
        ],
        enableImageGeneration: false, // Test content only first
        enableTextToSpeech: false,
        userId: 'test_user_real_001'
      };

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, request, {
        timeout: 120000 // 2 minutes for real LLM processing
      });
      
      if (response.status === 200 && response.data.success) {
        this.logSuccess('Real Content Generation', 'Claude content generated successfully');
        console.log('   Content ID:', response.data.data?.contentId);
        console.log('   Quality Score:', response.data.data?.metadata?.qualityScore);
        console.log('   E-E-A-T Score:', response.data.data?.metadata?.eeatScore);
        console.log('   Processing Time:', response.data.performanceMetrics?.totalProcessingTime + 'ms');
        console.log('   Storage Status:', response.data.storageMetadata?.stored ? 'Stored' : 'Not Stored');
        
        // Check if content is real (not mock)
        const content = response.data.data?.sections?.[0]?.content || '';
        if (content.length > 100 && !content.includes('mock') && !content.includes('simulated')) {
          this.logSuccess('Content Quality', 'Real content generated (not mock data)');
        } else {
          this.logFailure('Content Quality', 'Content appears to be mock data');
        }
        
        return response.data;
      } else {
        this.logFailure('Real Content Generation', 'Unexpected response');
        return null;
      }
    } catch (error) {
      this.logFailure('Real Content Generation', error.message);
      return null;
    }
    console.log('');
  }

  async testImageGeneration() {
    console.log('🎨 Testing DALL-E Image Generation...');
    try {
      const request = {
        topic: 'AI Technology Innovation',
        audience: 'b2b',
        contentType: 'blog_post',
        enableImageGeneration: true,
        enableTextToSpeech: false,
        imageStyle: 'professional',
        userId: 'test_user_image_001'
      };

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, request, {
        timeout: 180000 // 3 minutes for image generation
      });
      
      if (response.status === 200 && response.data.success) {
        const imageData = response.data.data?.imageGeneration;
        
        if (imageData) {
          this.logSuccess('DALL-E Image Generation', 'Image generated successfully');
          console.log('   Provider:', imageData.provider);
          console.log('   Model:', imageData.model);
          console.log('   Size:', imageData.size);
          console.log('   Has Image URL:', !!imageData.imageUrl);
          console.log('   Has Base64:', !!imageData.imageBase64);
          
          // Check if it's real DALL-E (not fallback)
          if (imageData.provider === 'openai-dalle' && imageData.model === 'dall-e-3') {
            this.logSuccess('DALL-E Integration', 'Real DALL-E 3 image generated');
          } else {
            this.logFailure('DALL-E Integration', `Fallback used: ${imageData.provider}`);
          }
        } else {
          this.logFailure('DALL-E Image Generation', 'No image data in response');
        }
      } else {
        this.logFailure('DALL-E Image Generation', 'Request failed');
      }
    } catch (error) {
      this.logFailure('DALL-E Image Generation', error.message);
    }
    console.log('');
  }

  async testAudioGeneration() {
    console.log('🔊 Testing ElevenLabs Audio Generation...');
    try {
      const request = {
        topic: 'Voice Technology Trends',
        audience: 'b2b',
        contentType: 'blog_post',
        enableImageGeneration: false,
        enableTextToSpeech: true,
        voiceSettings: {
          voiceId: 'pNInz6obpgDQGcFmaJgB',
          stability: 0.75,
          similarityBoost: 0.75
        },
        userId: 'test_user_audio_001'
      };

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, request, {
        timeout: 180000 // 3 minutes for audio generation
      });
      
      if (response.status === 200 && response.data.success) {
        const audioData = response.data.data?.audioGeneration;
        
        if (audioData) {
          this.logSuccess('ElevenLabs Audio Generation', 'Audio generated successfully');
          console.log('   Provider:', audioData.provider);
          console.log('   Model:', audioData.model);
          console.log('   Voice ID:', audioData.voiceId);
          console.log('   Text Length:', audioData.textLength);
          console.log('   Has Audio Data:', !!audioData.audioData);
          
          // Check if it's real ElevenLabs (not fallback)
          if (audioData.provider === 'elevenlabs' && audioData.audioData && audioData.audioData.length > 1000) {
            this.logSuccess('ElevenLabs Integration', 'Real ElevenLabs audio generated');
          } else {
            this.logFailure('ElevenLabs Integration', `Fallback used: ${audioData.provider}`);
          }
        } else {
          this.logFailure('ElevenLabs Audio Generation', 'No audio data in response');
        }
      } else {
        this.logFailure('ElevenLabs Audio Generation', 'Request failed');
      }
    } catch (error) {
      this.logFailure('ElevenLabs Audio Generation', error.message);
    }
    console.log('');
  }

  async testVectorDatabaseStorage(contentResult) {
    console.log('💾 Testing Vector Database Storage...');
    
    if (!contentResult?.storageMetadata) {
      this.logFailure('Vector Database Storage', 'No storage metadata from previous test');
      console.log('');
      return;
    }

    try {
      const storageMetadata = contentResult.storageMetadata;
      
      if (storageMetadata.stored !== false && storageMetadata.contentId) {
        this.logSuccess('Vector Database Storage', 'Content stored successfully');
        console.log('   Content ID:', storageMetadata.contentId);
        console.log('   Vector ID:', storageMetadata.vectorId);
        console.log('   Embedding ID:', storageMetadata.embeddingId);
        console.log('   Dimensions:', storageMetadata.dimensions);
        console.log('   Stored At:', storageMetadata.storedAt);
      } else {
        this.logFailure('Vector Database Storage', storageMetadata.error || 'Storage failed');
      }
    } catch (error) {
      this.logFailure('Vector Database Storage', error.message);
    }
    console.log('');
  }

  async testVectorSearch() {
    console.log('🔍 Testing Vector Search...');
    try {
      // This would require a direct call to the vector storage service
      // For now, we'll test if the search functionality is available through content generation
      const request = {
        topic: 'Machine Learning Applications', // Similar to previous content
        audience: 'b2b',
        contentType: 'blog_post',
        userId: 'test_user_search_001'
      };

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, request, {
        timeout: 60000
      });
      
      if (response.status === 200 && response.data.success) {
        const vectorData = response.data.layerResults?.bottom?.vectorData;
        
        if (vectorData?.searchResults) {
          this.logSuccess('Vector Search', 'Vector search executed during generation');
          console.log('   Search Results:', vectorData.searchResults.totalResults);
          console.log('   Similar Content Found:', vectorData.similarContent?.length || 0);
          
          if (vectorData.searchResults.totalResults > 0) {
            this.logSuccess('Vector Database Query', 'Found similar content in database');
          } else {
            this.logSuccess('Vector Database Query', 'No similar content found (expected for new topics)');
          }
        } else {
          this.logFailure('Vector Search', 'No search results in response');
        }
      } else {
        this.logFailure('Vector Search', 'Request failed');
      }
    } catch (error) {
      this.logFailure('Vector Search', error.message);
    }
    console.log('');
  }

  async testEndToEndRealIntegration() {
    console.log('🚀 Testing End-to-End Real Integration...');
    try {
      const request = {
        topic: 'Advanced AI Content Generation with Multi-Modal Capabilities',
        audience: 'b2b',
        contentType: 'blog_post',
        toneOfVoice: 'professional',
        keyPoints: [
          'Claude LLM integration',
          'DALL-E image generation',
          'ElevenLabs voice synthesis',
          'Vector database storage'
        ],
        enableImageGeneration: true,
        enableTextToSpeech: true,
        imageStyle: 'professional',
        voiceSettings: {
          voiceId: 'pNInz6obpgDQGcFmaJgB',
          stability: 0.75,
          similarityBoost: 0.75
        },
        userId: 'test_user_e2e_001'
      };

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, request, {
        timeout: 300000 // 5 minutes for full integration
      });
      
      if (response.status === 200 && response.data.success) {
        this.logSuccess('End-to-End Integration', 'Full pipeline completed successfully');
        
        const data = response.data.data;
        const layerResults = response.data.layerResults;
        const storageMetadata = response.data.storageMetadata;
        
        // Check all components
        const checks = {
          'Content Generated': !!data?.sections?.length,
          'Image Generated': !!data?.imageGeneration?.imageUrl,
          'Audio Generated': !!data?.audioGeneration?.audioData,
          'Vector Storage': !!storageMetadata?.contentId,
          'All Layers Processed': Object.keys(layerResults || {}).length === 4,
          'Quality Metrics': !!data?.metadata?.qualityScore,
          'E-E-A-T Score': !!data?.metadata?.eeatScore
        };
        
        Object.entries(checks).forEach(([check, passed]) => {
          console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });
        
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        console.log(`   Overall Success Rate: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
        
        if (passedChecks >= totalChecks * 0.8) {
          this.logSuccess('Integration Quality', `${passedChecks}/${totalChecks} components working`);
        } else {
          this.logFailure('Integration Quality', `Only ${passedChecks}/${totalChecks} components working`);
        }
        
      } else {
        this.logFailure('End-to-End Integration', 'Pipeline failed');
      }
    } catch (error) {
      this.logFailure('End-to-End Integration', error.message);
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
    console.log('\n📋 REAL LLM INTEGRATION TEST SUMMARY');
    console.log('=====================================');
    
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
    
    console.log('\n🎯 INTEGRATION STATUS:');
    console.log('======================');
    
    const integrationStatus = {
      'Claude LLM': this.testResults.some(r => r.test.includes('Content Generation') && r.status === 'PASS'),
      'DALL-E Images': this.testResults.some(r => r.test.includes('DALL-E') && r.status === 'PASS'),
      'ElevenLabs Audio': this.testResults.some(r => r.test.includes('ElevenLabs') && r.status === 'PASS'),
      'Vector Database': this.testResults.some(r => r.test.includes('Vector') && r.status === 'PASS'),
      'End-to-End': this.testResults.some(r => r.test.includes('End-to-End') && r.status === 'PASS')
    };
    
    Object.entries(integrationStatus).forEach(([service, working]) => {
      console.log(`${working ? '✅' : '❌'} ${service}: ${working ? 'WORKING' : 'FAILED'}`);
    });
    
    const workingServices = Object.values(integrationStatus).filter(Boolean).length;
    const totalServices = Object.keys(integrationStatus).length;
    
    console.log(`\n🏆 Overall Integration Health: ${workingServices}/${totalServices} services operational`);
    
    if (workingServices === totalServices) {
      console.log('🎉 ALL REAL LLM INTEGRATIONS ARE WORKING PERFECTLY!');
    } else if (workingServices >= totalServices * 0.8) {
      console.log('✅ Most integrations working - minor issues to resolve');
    } else {
      console.log('⚠️ Multiple integration issues detected - requires attention');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new RealLLMIntegrationTest();
  
  // Wait a moment for server to be ready
  setTimeout(() => {
    tester.runAllTests();
  }, 2000);
}

module.exports = { RealLLMIntegrationTest };
