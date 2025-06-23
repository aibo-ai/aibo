/**
 * Comprehensive Unit Tests for Content Architect APIs
 * Tests all external API integrations, content generation, and orchestration services
 */

const axios = require('axios');
const { expect } = require('chai');
const sinon = require('sinon');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  timeout: 30000,
  retries: 3
};

describe('Content Architect API Integration Tests', function() {
  this.timeout(60000);

  let axiosStub;

  beforeEach(() => {
    axiosStub = sinon.stub(axios, 'post');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('External API Integration Tests', () => {
    
    describe('Claude AI Integration', () => {
      it('should successfully generate content with Claude API', async () => {
        // Mock Claude API response
        const mockClaudeResponse = {
          data: {
            content: [{
              text: JSON.stringify({
                title: 'AI Content Marketing Strategy',
                summary: 'A comprehensive guide to AI-powered content marketing',
                sections: [
                  {
                    title: 'Introduction',
                    content: 'AI is transforming content marketing...'
                  }
                ]
              })
            }],
            usage: { input_tokens: 100, output_tokens: 500 }
          }
        };

        axiosStub.resolves(mockClaudeResponse);

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: 'AI Content Marketing Strategy',
          audience: 'b2b',
          contentType: 'whitepaper',
          keyPoints: ['ROI', 'Automation', 'Analytics'],
          toneOfVoice: 'professional',
          llmTarget: 'claude'
        });

        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('title');
        expect(response.data.data).to.have.property('sections');
      });

      it('should handle Claude API errors gracefully', async () => {
        axiosStub.rejects(new Error('Claude API rate limit exceeded'));

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: 'Test Topic',
          audience: 'b2b'
        }).catch(err => err.response);

        expect(response.data.success).to.be.false;
        expect(response.data.error).to.include('generation failed');
      });
    });

    describe('Eleven Labs Audio Integration', () => {
      it('should successfully generate audio with Eleven Labs API', async () => {
        const mockAudioResponse = {
          data: Buffer.from('mock audio data')
        };

        axiosStub.resolves(mockAudioResponse);

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/audio/generate`, {
          content: 'This is a test of audio generation',
          contentType: 'blog_post',
          audience: 'b2b',
          voiceProfile: 'professional'
        });

        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('audioData');
        expect(response.data.data).to.have.property('voiceId');
        expect(response.data.data.audioFormat).to.equal('mp3');
      });

      it('should validate voice profile selection', async () => {
        const testVoiceProfiles = ['professional', 'conversational', 'authoritative', 'friendly'];
        
        for (const profile of testVoiceProfiles) {
          axiosStub.resolves({ data: Buffer.from('mock audio') });
          
          const response = await axios.post(`${TEST_CONFIG.baseUrl}/audio/generate`, {
            content: 'Test content',
            voiceProfile: profile
          });

          expect(response.data.success).to.be.true;
          expect(response.data.data.voiceProfile).to.equal(profile);
        }
      });
    });

    describe('DALL-E Image Integration', () => {
      it('should successfully generate images with DALL-E API', async () => {
        const mockImageResponse = {
          data: {
            data: [{
              url: 'https://example.com/generated-image.png',
              revised_prompt: 'A professional business illustration about AI Content Marketing Strategy'
            }]
          }
        };

        axiosStub.resolves(mockImageResponse);

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/image/generate`, {
          topic: 'AI Content Marketing Strategy',
          contentType: 'infographic',
          audience: 'b2b',
          style: 'professional',
          colorScheme: 'corporate'
        });

        expect(response.data.success).to.be.true;
        expect(response.data.data).to.have.property('imageUrl');
        expect(response.data.data).to.have.property('prompt');
      });

      it('should handle different image styles and color schemes', async () => {
        const styles = ['infographic', 'diagram', 'illustration', 'conceptual'];
        const colorSchemes = ['professional', 'vibrant', 'corporate', 'minimal'];

        for (const style of styles) {
          for (const colorScheme of colorSchemes) {
            axiosStub.resolves({
              data: { data: [{ url: 'https://example.com/image.png' }] }
            });

            const response = await axios.post(`${TEST_CONFIG.baseUrl}/image/generate`, {
              topic: 'Test Topic',
              style,
              colorScheme
            });

            expect(response.data.success).to.be.true;
            expect(response.data.data.style).to.equal(style);
            expect(response.data.data.colorScheme).to.equal(colorScheme);
          }
        }
      });
    });

    describe('News API Integration', () => {
      it('should fetch fresh news articles', async () => {
        const mockNewsResponse = {
          data: {
            articles: [
              {
                title: 'AI Marketing Trends 2024',
                description: 'Latest trends in AI marketing',
                url: 'https://example.com/article1',
                publishedAt: '2024-01-01T00:00:00Z',
                source: { name: 'Tech News' }
              }
            ]
          }
        };

        axiosStub.resolves(mockNewsResponse);

        // This would be tested through the content generation endpoint
        const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: 'AI Marketing',
          audience: 'b2b'
        });

        expect(response.data.success).to.be.true;
        // Verify that fresh content was integrated
        expect(response.data.data.metadata.freshnessScore).to.be.above(0.8);
      });
    });

    describe('Exa API Integration', () => {
      it('should fetch research papers and insights', async () => {
        const mockExaResponse = {
          data: {
            results: [
              {
                title: 'AI in Content Marketing Research',
                url: 'https://research.example.com/paper1',
                text: 'Research findings on AI content marketing effectiveness',
                published_date: '2024-01-01',
                score: 0.95
              }
            ]
          }
        };

        axiosStub.resolves(mockExaResponse);

        const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: 'AI Content Marketing',
          audience: 'b2b'
        });

        expect(response.data.success).to.be.true;
        expect(response.data.data.metadata.authorityScore).to.be.above(0.8);
      });
    });
  });

  describe('Content Generation Workflow Tests', () => {
    
    it('should complete full orchestration workflow', async () => {
      const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
        topic: 'Digital Transformation Strategy',
        audience: 'enterprise',
        contentType: 'whitepaper',
        keyPoints: ['Technology', 'Process', 'People', 'Culture'],
        toneOfVoice: 'authoritative',
        llmTarget: 'claude'
      });

      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('contentId');
      expect(response.data.data).to.have.property('title');
      expect(response.data.data).to.have.property('summary');
      expect(response.data.data).to.have.property('sections');
      expect(response.data.data.sections).to.be.an('array').with.length.above(3);
      expect(response.data.data.metadata.orchestrationLayers).to.include.members(['bottom', 'middle', 'top']);
    });

    it('should handle different content types', async () => {
      const contentTypes = ['blog_post', 'whitepaper', 'case_study', 'executive_brief'];
      
      for (const contentType of contentTypes) {
        const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: 'Test Topic',
          audience: 'b2b',
          contentType
        });

        expect(response.data.success).to.be.true;
        expect(response.data.data.contentType).to.equal(contentType);
      }
    });

    it('should handle different audiences', async () => {
      const audiences = ['b2b', 'b2c', 'enterprise', 'startup'];
      
      for (const audience of audiences) {
        const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: 'Test Topic',
          audience,
          contentType: 'blog_post'
        });

        expect(response.data.success).to.be.true;
        expect(response.data.data.audience).to.equal(audience);
      }
    });

    it('should handle different LLM targets', async () => {
      const llmTargets = ['claude', 'gpt4', 'general'];
      
      for (const llmTarget of llmTargets) {
        const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: 'Test Topic',
          audience: 'b2b',
          llmTarget
        });

        expect(response.data.success).to.be.true;
        expect(response.data.data.metadata.optimizedFor).to.equal(llmTarget);
      }
    });
  });

  describe('Error Handling and Resilience Tests', () => {
    
    it('should handle network timeouts gracefully', async () => {
      axiosStub.rejects(new Error('ETIMEDOUT'));

      const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
        topic: 'Test Topic'
      }).catch(err => err.response);

      expect(response.data.success).to.be.false;
      expect(response.data.error).to.include('failed');
    });

    it('should handle API rate limits', async () => {
      axiosStub.rejects({ response: { status: 429, data: { error: 'Rate limit exceeded' } } });

      const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
        topic: 'Test Topic'
      }).catch(err => err.response);

      expect(response.data.success).to.be.false;
    });

    it('should fallback when external APIs fail', async () => {
      // Simulate all external APIs failing
      axiosStub.rejects(new Error('Service unavailable'));

      const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
        topic: 'Test Topic',
        audience: 'b2b'
      });

      // Should still generate content using fallback methods
      expect(response.data.success).to.be.true;
      expect(response.data.data.metadata.isFallback).to.be.true;
    });
  });

  describe('Performance Tests', () => {
    
    it('should complete content generation within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
        topic: 'Performance Test Topic',
        audience: 'b2b'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.data.success).to.be.true;
      expect(duration).to.be.below(60000); // Should complete within 60 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill().map((_, i) => 
        axios.post(`${TEST_CONFIG.baseUrl}/llm-content/generate`, {
          topic: `Concurrent Test Topic ${i}`,
          audience: 'b2b'
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.data.success).to.be.true;
      });
    });
  });
});
