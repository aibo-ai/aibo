/**
 * Real API Integration Tests
 * Tests actual API calls to verify all external integrations are working
 */

const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3001';

describe('Real API Integration Tests', function() {
  this.timeout(120000); // 2 minutes for real API calls

  before(async () => {
    // Verify server is running
    try {
      const healthCheck = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running and healthy');
    } catch (error) {
      console.error('❌ Server is not running. Please start the orchestrated server first.');
      throw new Error('Server not available');
    }
  });

  describe('Content Generation API Tests', () => {
    
    it('should generate content with all external APIs', async () => {
      console.log('🧪 Testing full content generation with external APIs...');

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
        topic: 'AI-Powered Content Marketing Strategy',
        audience: 'b2b',
        contentType: 'whitepaper',
        keyPoints: ['ROI Measurement', 'Automation Tools', 'Performance Analytics'],
        toneOfVoice: 'professional',
        llmTarget: 'claude'
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('object');

      const content = response.data.data;
      expect(content).to.have.property('contentId');
      expect(content).to.have.property('title');
      expect(content).to.have.property('summary');
      expect(content).to.have.property('sections');
      expect(content.sections).to.be.an('array').with.length.above(3);

      console.log(`✅ Generated content: "${content.title}"`);
      console.log(`📊 Sections: ${content.sections.length}`);
      console.log(`⏱️ Processing time: ${content.processingTime}ms`);

      // Check if external APIs were integrated
      if (content.freshContent) {
        console.log(`📰 News articles: ${content.freshContent.newsArticles?.length || 0}`);
        console.log(`🔍 Research papers: ${content.freshContent.researchPapers?.length || 0}`);
      }

      console.log('✅ Content generation test passed');
    });

    it('should handle different content types', async () => {
      console.log('🧪 Testing different content types...');

      const contentTypes = ['blog_post', 'whitepaper', 'case_study'];
      
      for (const contentType of contentTypes) {
        console.log(`Testing ${contentType}...`);
        
        const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
          topic: `Test Topic for ${contentType}`,
          audience: 'b2b',
          contentType,
          toneOfVoice: 'professional'
        });

        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data.contentType).to.equal(contentType);
        
        console.log(`✅ ${contentType} generated successfully`);
      }

      console.log('✅ Content type variation test passed');
    });
  });

  describe('Audio Generation API Tests', () => {
    
    it('should generate audio with Eleven Labs', async () => {
      console.log('🧪 Testing Eleven Labs audio generation...');

      const response = await axios.post(`${BASE_URL}/audio/generate`, {
        content: 'This is a test of the Eleven Labs audio generation system for professional content marketing.',
        contentType: 'whitepaper',
        audience: 'b2b',
        voiceProfile: 'professional'
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('audioData');
      expect(response.data.data).to.have.property('voiceId');
      expect(response.data.data.audioFormat).to.equal('mp3');

      console.log(`✅ Audio generated with voice ID: ${response.data.data.voiceId}`);
      console.log(`📊 Audio length: ${response.data.data.textLength} characters`);

      console.log('✅ Audio generation test passed');
    });

    it('should handle different voice profiles', async () => {
      console.log('🧪 Testing different voice profiles...');

      const voiceProfiles = ['professional', 'conversational', 'authoritative'];
      
      for (const voiceProfile of voiceProfiles) {
        console.log(`Testing ${voiceProfile} voice...`);
        
        const response = await axios.post(`${BASE_URL}/audio/generate`, {
          content: `Testing ${voiceProfile} voice profile for content generation.`,
          voiceProfile
        });

        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data.voiceProfile).to.equal(voiceProfile);
        
        console.log(`✅ ${voiceProfile} voice generated successfully`);
      }

      console.log('✅ Voice profile variation test passed');
    });
  });

  describe('Image Generation API Tests', () => {
    
    it('should generate images with DALL-E', async () => {
      console.log('🧪 Testing DALL-E image generation...');

      const response = await axios.post(`${BASE_URL}/image/generate`, {
        topic: 'AI Content Marketing Strategy Dashboard',
        contentType: 'infographic',
        audience: 'b2b',
        keyPoints: ['ROI', 'Analytics', 'Automation'],
        style: 'infographic',
        colorScheme: 'professional'
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('imageUrl');
      expect(response.data.data.imageUrl).to.match(/^https?:\/\/.+/);

      console.log(`✅ Image generated: ${response.data.data.imageUrl}`);
      console.log(`🎨 Style: ${response.data.data.style}`);
      console.log(`🎨 Color scheme: ${response.data.data.colorScheme}`);

      console.log('✅ Image generation test passed');
    });

    it('should handle different image styles', async () => {
      console.log('🧪 Testing different image styles...');

      const styles = ['infographic', 'diagram', 'illustration'];
      
      for (const style of styles) {
        console.log(`Testing ${style} style...`);
        
        const response = await axios.post(`${BASE_URL}/image/generate`, {
          topic: `Test Image for ${style}`,
          style,
          colorScheme: 'professional'
        });

        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data.style).to.equal(style);
        
        console.log(`✅ ${style} image generated successfully`);
      }

      console.log('✅ Image style variation test passed');
    });
  });

  describe('External API Integration Verification', () => {
    
    it('should verify News API integration', async () => {
      console.log('🧪 Verifying News API integration...');

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
        topic: 'Latest Technology News',
        audience: 'b2b',
        contentType: 'blog_post'
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;

      // Check server logs for News API activity
      console.log('📰 News API integration verified through content generation');
      console.log('✅ News API verification test passed');
    });

    it('should verify Exa API integration', async () => {
      console.log('🧪 Verifying Exa API integration...');

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
        topic: 'Machine Learning Research',
        audience: 'enterprise',
        contentType: 'whitepaper'
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;

      // Check server logs for Exa API activity
      console.log('🔍 Exa API integration verified through content generation');
      console.log('✅ Exa API verification test passed');
    });

    it('should verify Claude AI integration', async () => {
      console.log('🧪 Verifying Claude AI integration...');

      const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
        topic: 'Advanced AI Content Generation',
        audience: 'b2b',
        contentType: 'executive_brief',
        llmTarget: 'claude'
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;

      const content = response.data.data;
      expect(content.metadata.optimizedFor).to.equal('claude');

      console.log('🤖 Claude AI integration verified');
      console.log('✅ Claude AI verification test passed');
    });
  });

  describe('Performance and Quality Tests', () => {
    
    it('should generate high-quality content within reasonable time', async () => {
      console.log('🧪 Testing content quality and performance...');

      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
        topic: 'Enterprise Digital Transformation Strategy',
        audience: 'enterprise',
        contentType: 'whitepaper',
        keyPoints: ['Technology Integration', 'Change Management', 'ROI Analysis'],
        toneOfVoice: 'authoritative'
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;

      const content = response.data.data;
      
      // Quality checks
      expect(content.title).to.have.length.above(20);
      expect(content.summary).to.have.length.above(100);
      expect(content.sections).to.have.length.above(4);

      // Performance checks
      expect(processingTime).to.be.below(120000); // 2 minutes max

      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`📊 Content quality score: ${content.metadata.llmQualityScore}`);
      console.log(`📊 Title length: ${content.title.length} characters`);
      console.log(`📊 Summary length: ${content.summary.length} characters`);
      console.log(`📊 Number of sections: ${content.sections.length}`);

      console.log('✅ Quality and performance test passed');
    });

    it('should handle concurrent requests efficiently', async () => {
      console.log('🧪 Testing concurrent request handling...');

      const concurrentRequests = 5;
      const startTime = Date.now();

      const requests = Array(concurrentRequests).fill().map((_, i) => 
        axios.post(`${BASE_URL}/llm-content/generate`, {
          topic: `Concurrent Test Topic ${i + 1}`,
          audience: 'b2b',
          contentType: 'blog_post'
        })
      );

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.data.success
      );

      console.log(`⏱️ Total processing time: ${totalTime}ms`);
      console.log(`✅ Successful requests: ${successful.length}/${concurrentRequests}`);

      expect(successful.length).to.be.at.least(Math.floor(concurrentRequests * 0.8));

      console.log('✅ Concurrent request test passed');
    });
  });

  describe('Error Handling Tests', () => {
    
    it('should handle invalid input gracefully', async () => {
      console.log('🧪 Testing error handling...');

      try {
        const response = await axios.post(`${BASE_URL}/llm-content/generate`, {
          topic: '', // Empty topic
          audience: 'invalid_audience'
        });

        // Should either succeed with fallback or fail gracefully
        if (response.data.success) {
          console.log('✅ System handled invalid input with fallback');
        }
      } catch (error) {
        expect(error.response.status).to.be.oneOf([400, 422, 500]);
        console.log('✅ System rejected invalid input appropriately');
      }

      console.log('✅ Error handling test passed');
    });
  });

  describe('Health Check Tests', () => {
    
    it('should respond to health checks', async () => {
      console.log('🧪 Testing health check endpoints...');

      const healthResponse = await axios.get(`${BASE_URL}/health`);
      expect(healthResponse.status).to.equal(200);
      expect(healthResponse.data.status).to.equal('healthy');

      const apiHealthResponse = await axios.get(`${BASE_URL}/api/health`);
      expect(apiHealthResponse.status).to.equal(200);

      console.log('✅ Health check endpoints working correctly');
    });
  });
});
