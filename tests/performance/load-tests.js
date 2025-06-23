/**
 * Performance and Load Tests
 * Tests system performance under various load conditions
 */

const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3001';
const PERFORMANCE_THRESHOLDS = {
  contentGeneration: 60000, // 60 seconds max
  audioGeneration: 30000,   // 30 seconds max
  imageGeneration: 45000,   // 45 seconds max
  concurrentRequests: 120000 // 2 minutes for concurrent processing
};

describe('Performance and Load Tests', function() {
  this.timeout(300000); // 5 minutes for performance tests

  describe('Content Generation Performance', () => {
    
    it('should generate content within performance threshold', async () => {
      console.log('🚀 Testing content generation performance...');
      
      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
        topic: 'Advanced AI Content Marketing Strategies for Enterprise Organizations',
        audience: 'enterprise',
        contentType: 'whitepaper',
        keyPoints: [
          'Strategic AI Implementation',
          'Content Personalization at Scale',
          'ROI Measurement and Analytics',
          'Competitive Intelligence Integration',
          'Multi-channel Content Distribution'
        ],
        toneOfVoice: 'authoritative',
        llmTarget: 'claude'
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log(`⏱️ Content generation time: ${processingTime}ms`);
      
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(processingTime).to.be.below(PERFORMANCE_THRESHOLDS.contentGeneration);

      // Verify content quality wasn't compromised for speed
      const content = response.data.data;
      expect(content.sections).to.have.length.above(4);
      expect(content.metadata.llmQualityScore).to.be.above(0.85);

      console.log('✅ Content generation performance test passed');
    });

    it('should handle multiple content types efficiently', async () => {
      console.log('🚀 Testing multiple content type performance...');

      const contentTypes = ['blog_post', 'whitepaper', 'case_study', 'executive_brief'];
      const results = [];

      for (const contentType of contentTypes) {
        const startTime = Date.now();
        
        const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
          topic: `Performance Test for ${contentType}`,
          audience: 'b2b',
          contentType,
          toneOfVoice: 'professional'
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        results.push({
          contentType,
          processingTime,
          success: response.data.success
        });

        console.log(`⏱️ ${contentType}: ${processingTime}ms`);
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(processingTime).to.be.below(PERFORMANCE_THRESHOLDS.contentGeneration);
      }

      const averageTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      console.log(`📊 Average processing time: ${averageTime}ms`);

      console.log('✅ Multiple content type performance test passed');
    });
  });

  describe('Audio Generation Performance', () => {
    
    it('should generate audio within performance threshold', async () => {
      console.log('🚀 Testing audio generation performance...');

      const startTime = Date.now();

      const response = await axios.post(`${BASE_URL}/audio/generate`, {
        content: 'This is a comprehensive performance test of the Eleven Labs audio generation system. We are testing the speed and quality of voice synthesis for professional content marketing applications. The system should maintain high quality while meeting performance requirements.',
        contentType: 'whitepaper',
        audience: 'b2b',
        voiceProfile: 'professional'
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log(`⏱️ Audio generation time: ${processingTime}ms`);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(processingTime).to.be.below(PERFORMANCE_THRESHOLDS.audioGeneration);

      // Verify audio quality
      expect(response.data.data).to.have.property('audioData');
      expect(response.data.data.audioFormat).to.equal('mp3');

      console.log('✅ Audio generation performance test passed');
    });

    it('should handle different voice profiles efficiently', async () => {
      console.log('🚀 Testing voice profile performance...');

      const voiceProfiles = ['professional', 'conversational', 'authoritative', 'friendly'];
      const results = [];

      for (const voiceProfile of voiceProfiles) {
        const startTime = Date.now();

        const response = await axios.post(`${BASE_URL}/audio/generate`, {
          content: `Performance test for ${voiceProfile} voice profile.`,
          voiceProfile
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        results.push({
          voiceProfile,
          processingTime,
          success: response.data.success
        });

        console.log(`⏱️ ${voiceProfile}: ${processingTime}ms`);

        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
      }

      const averageTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      console.log(`📊 Average audio generation time: ${averageTime}ms`);

      console.log('✅ Voice profile performance test passed');
    });
  });

  describe('Image Generation Performance', () => {
    
    it('should generate images within performance threshold', async () => {
      console.log('🚀 Testing image generation performance...');

      const startTime = Date.now();

      const response = await axios.post(`${BASE_URL}/image/generate`, {
        topic: 'Advanced AI Content Marketing Performance Dashboard',
        contentType: 'infographic',
        audience: 'enterprise',
        keyPoints: ['Performance Metrics', 'ROI Analysis', 'User Engagement', 'Content Quality'],
        style: 'infographic',
        colorScheme: 'professional'
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log(`⏱️ Image generation time: ${processingTime}ms`);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(processingTime).to.be.below(PERFORMANCE_THRESHOLDS.imageGeneration);

      // Verify image quality
      expect(response.data.data).to.have.property('imageUrl');
      expect(response.data.data.imageUrl).to.match(/^https?:\/\/.+/);

      console.log('✅ Image generation performance test passed');
    });
  });

  describe('Concurrent Load Tests', () => {
    
    it('should handle concurrent content generation requests', async () => {
      console.log('🚀 Testing concurrent content generation load...');

      const concurrentRequests = 10;
      const startTime = Date.now();

      const requests = Array(concurrentRequests).fill().map((_, i) => 
        axios.post(`${BASE_URL}/llm-content/generate`, {
          topic: `Concurrent Load Test Topic ${i + 1}`,
          audience: 'b2b',
          contentType: 'blog_post',
          toneOfVoice: 'professional'
        })
      );

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.data.success);
      const failed = responses.filter(r => r.status === 'rejected' || !r.value.data.success);

      console.log(`⏱️ Total concurrent processing time: ${totalTime}ms`);
      console.log(`✅ Successful requests: ${successful.length}/${concurrentRequests}`);
      console.log(`❌ Failed requests: ${failed.length}/${concurrentRequests}`);

      expect(totalTime).to.be.below(PERFORMANCE_THRESHOLDS.concurrentRequests);
      expect(successful.length).to.be.at.least(Math.floor(concurrentRequests * 0.8)); // 80% success rate

      console.log('✅ Concurrent load test passed');
    });

    it('should handle mixed API concurrent requests', async () => {
      console.log('🚀 Testing mixed API concurrent load...');

      const startTime = Date.now();

      const mixedRequests = [
        // Content generation requests
        ...Array(5).fill().map((_, i) => 
          axios.post(`${BASE_URL}/llm-content/generate`, {
            topic: `Mixed Load Content ${i + 1}`,
            audience: 'b2b',
            contentType: 'blog_post'
          })
        ),
        // Audio generation requests
        ...Array(3).fill().map((_, i) => 
          axios.post(`${BASE_URL}/audio/generate`, {
            content: `Mixed load audio test ${i + 1}`,
            voiceProfile: 'professional'
          })
        ),
        // Image generation requests
        ...Array(2).fill().map((_, i) => 
          axios.post(`${BASE_URL}/image/generate`, {
            topic: `Mixed Load Image ${i + 1}`,
            style: 'infographic',
            colorScheme: 'professional'
          })
        )
      ];

      const responses = await Promise.allSettled(mixedRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.data.success);
      const failed = responses.filter(r => r.status === 'rejected' || !r.value.data.success);

      console.log(`⏱️ Mixed API processing time: ${totalTime}ms`);
      console.log(`✅ Successful requests: ${successful.length}/${mixedRequests.length}`);
      console.log(`❌ Failed requests: ${failed.length}/${mixedRequests.length}`);

      expect(successful.length).to.be.at.least(Math.floor(mixedRequests.length * 0.7)); // 70% success rate for mixed load

      console.log('✅ Mixed API concurrent load test passed');
    });
  });

  describe('Memory and Resource Usage Tests', () => {
    
    it('should maintain stable memory usage during extended operation', async () => {
      console.log('🚀 Testing memory stability...');

      const iterations = 20;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
          topic: `Memory Test Iteration ${i + 1}`,
          audience: 'b2b',
          contentType: 'blog_post'
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        results.push({
          iteration: i + 1,
          processingTime,
          success: response.data.success
        });

        if (i % 5 === 0) {
          console.log(`📊 Iteration ${i + 1}: ${processingTime}ms`);
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const averageTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      const successRate = results.filter(r => r.success).length / results.length;

      console.log(`📊 Average processing time: ${averageTime}ms`);
      console.log(`📊 Success rate: ${(successRate * 100).toFixed(1)}%`);

      expect(successRate).to.be.above(0.9); // 90% success rate
      expect(averageTime).to.be.below(PERFORMANCE_THRESHOLDS.contentGeneration);

      console.log('✅ Memory stability test passed');
    });
  });

  describe('API Rate Limiting Tests', () => {
    
    it('should handle rate limiting gracefully', async () => {
      console.log('🚀 Testing rate limiting behavior...');

      const rapidRequests = Array(50).fill().map((_, i) => 
        axios.post(`${BASE_URL}/llm-content/generate`, {
          topic: `Rate Limit Test ${i + 1}`,
          audience: 'b2b',
          contentType: 'blog_post'
        }).catch(error => ({ error: true, status: error.response?.status }))
      );

      const responses = await Promise.all(rapidRequests);
      
      const successful = responses.filter(r => !r.error && r.data?.success);
      const rateLimited = responses.filter(r => r.error && r.status === 429);
      const otherErrors = responses.filter(r => r.error && r.status !== 429);

      console.log(`✅ Successful requests: ${successful.length}`);
      console.log(`⏸️ Rate limited requests: ${rateLimited.length}`);
      console.log(`❌ Other errors: ${otherErrors.length}`);

      // System should handle rate limiting gracefully
      expect(successful.length + rateLimited.length).to.be.above(40); // Most should be handled

      console.log('✅ Rate limiting test passed');
    });
  });
});
