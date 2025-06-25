const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class RealLLMIntegrationService {
  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
    this.claudeApiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com';
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiApiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
    this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.elevenlabsApiUrl = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';
    
    // Azure OpenAI as fallback
    this.azureOpenaiKey = process.env.AZURE_OPENAI_API_KEY;
    this.azureOpenaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.azureOpenaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  }

  /**
   * Generate content using Claude API
   */
  async generateContentWithClaude(prompt, options = {}) {
    try {
      console.log('🤖 Generating content with Claude...');
      
      const requestData = {
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: this.buildClaudePrompt(prompt, options)
          }
        ]
      };

      const response = await axios.post(`${this.claudeApiUrl}/v1/messages`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 120000 // 2 minutes for content generation
      });

      if (response.data && response.data.content && response.data.content[0]) {
        const content = response.data.content[0].text;
        console.log('✅ Claude content generation successful');
        
        return {
          content,
          model: requestData.model,
          usage: response.data.usage,
          provider: 'claude',
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response format from Claude API');
      }
    } catch (error) {
      console.error('❌ Claude API error:', error.message);
      
      // Fallback to Azure OpenAI
      console.log('🔄 Falling back to Azure OpenAI...');
      return await this.generateContentWithAzureOpenAI(prompt, options);
    }
  }

  /**
   * Generate content using Azure OpenAI as fallback
   */
  async generateContentWithAzureOpenAI(prompt, options = {}) {
    try {
      console.log('🤖 Generating content with Azure OpenAI...');
      
      const requestData = {
        messages: [
          {
            role: 'system',
            content: 'You are an expert content creator specializing in high-quality, SEO-optimized content that ranks well in AI search results.'
          },
          {
            role: 'user',
            content: this.buildOpenAIPrompt(prompt, options)
          }
        ],
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };

      const response = await axios.post(
        `${this.azureOpenaiEndpoint}/openai/deployments/${this.azureOpenaiDeployment}/chat/completions?api-version=2024-02-01`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureOpenaiKey
          },
          timeout: 120000 // 2 minutes for Azure OpenAI
        }
      );

      if (response.data && response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        console.log('✅ Azure OpenAI content generation successful');
        
        return {
          content,
          model: this.azureOpenaiDeployment,
          usage: response.data.usage,
          provider: 'azure-openai',
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response format from Azure OpenAI API');
      }
    } catch (error) {
      console.error('❌ Azure OpenAI API error:', error.message);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image using DALL-E 3
   */
  async generateImageWithDallE(prompt, options = {}) {
    try {
      console.log('🎨 Generating image with DALL-E 3...');
      
      const requestData = {
        model: 'dall-e-3',
        prompt: this.buildImagePrompt(prompt, options),
        n: 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style || 'natural'
      };

      const response = await axios.post(`${this.openaiApiUrl}/images/generations`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        timeout: 120000 // 2 minutes for image generation
      });

      if (response.data && response.data.data && response.data.data[0]) {
        const imageData = response.data.data[0];
        console.log('✅ DALL-E image generation successful');
        
        // Download and convert to base64
        const imageBase64 = await this.downloadImageAsBase64(imageData.url);
        
        return {
          imageUrl: imageData.url,
          imageBase64: imageBase64,
          revisedPrompt: imageData.revised_prompt,
          model: 'dall-e-3',
          size: requestData.size,
          quality: requestData.quality,
          style: requestData.style,
          provider: 'openai-dalle',
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response format from DALL-E API');
      }
    } catch (error) {
      console.error('❌ DALL-E API error:', error.message);
      
      // Fallback to SVG generation
      console.log('🔄 Falling back to SVG generation...');
      return await this.generateFallbackSVG(prompt, options);
    }
  }

  /**
   * Generate audio using ElevenLabs
   */
  async generateAudioWithElevenLabs(text, options = {}) {
    try {
      console.log('🔊 Generating audio with ElevenLabs...');
      
      const voiceId = options.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Adam voice
      const requestData = {
        text: this.prepareTextForSpeech(text),
        model_id: options.modelId || 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability || 0.75,
          similarity_boost: options.similarityBoost || 0.75,
          style: options.style || 0.5,
          use_speaker_boost: options.useSpeakerBoost || true
        }
      };

      const response = await axios.post(
        `${this.elevenlabsApiUrl}/text-to-speech/${voiceId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenlabsApiKey,
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer',
          timeout: 120000 // 2 minutes for audio generation
        }
      );

      if (response.data) {
        console.log('✅ ElevenLabs audio generation successful');
        
        // Convert to base64
        const audioBase64 = Buffer.from(response.data).toString('base64');
        const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
        
        return {
          audioData: audioBase64,
          audioUrl: audioDataUrl,
          voiceId: voiceId,
          model: requestData.model_id,
          voiceSettings: requestData.voice_settings,
          textLength: text.length,
          provider: 'elevenlabs',
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response from ElevenLabs API');
      }
    } catch (error) {
      console.error('❌ ElevenLabs API error:', error.message);
      
      // Fallback to mock audio
      console.log('🔄 Falling back to mock audio generation...');
      return await this.generateFallbackAudio(text, options);
    }
  }

  /**
   * Generate comprehensive content using all services
   */
  async generateComprehensiveContent(request) {
    try {
      console.log('🚀 Starting comprehensive content generation...');
      
      const startTime = Date.now();
      const results = {};

      // 1. Generate main content with Claude
      const contentPrompt = this.buildContentPrompt(request);
      results.content = await this.generateContentWithClaude(contentPrompt, {
        maxTokens: 4000,
        temperature: 0.7
      });

      // 2. Generate image if requested
      if (request.enableImageGeneration) {
        const imagePrompt = this.buildImagePromptFromContent(results.content.content, request);
        results.image = await this.generateImageWithDallE(imagePrompt, {
          style: request.imageStyle || 'natural',
          size: '1024x1024',
          quality: 'standard'
        });
      }

      // 3. Generate audio if requested
      if (request.enableTextToSpeech) {
        const audioText = this.extractTextForSpeech(results.content.content);
        results.audio = await this.generateAudioWithElevenLabs(audioText, {
          voiceId: request.voiceSettings?.voiceId || 'pNInz6obpgDQGcFmaJgB',
          stability: request.voiceSettings?.stability || 0.75,
          similarityBoost: request.voiceSettings?.similarityBoost || 0.75
        });
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Comprehensive content generation completed in ${processingTime}ms`);

      return {
        ...results,
        processingTime,
        generatedAt: new Date().toISOString(),
        request: {
          topic: request.topic,
          audience: request.audience,
          contentType: request.contentType,
          enableImageGeneration: request.enableImageGeneration,
          enableTextToSpeech: request.enableTextToSpeech
        }
      };
    } catch (error) {
      console.error('❌ Comprehensive content generation failed:', error);
      throw error;
    }
  }

  // Helper methods
  buildClaudePrompt(prompt, options) {
    return `You are an expert content creator specializing in high-quality, SEO-optimized content that ranks well in AI search results.

${prompt}

Please ensure the content is:
- Well-structured with clear headings and sections
- Optimized for search engines and AI systems
- Engaging and valuable for the target audience
- Factually accurate and authoritative
- Includes relevant examples and actionable insights

Content Type: ${options.contentType || 'blog_post'}
Target Audience: ${options.audience || 'general'}
Tone: ${options.toneOfVoice || 'professional'}
Word Count Target: ${options.wordCount || '1000-1500'} words

Generate comprehensive, high-quality content that meets these requirements.`;
  }

  buildOpenAIPrompt(prompt, options) {
    return `Create high-quality, SEO-optimized content for the following request:

${prompt}

Requirements:
- Content Type: ${options.contentType || 'blog_post'}
- Target Audience: ${options.audience || 'general'}
- Tone: ${options.toneOfVoice || 'professional'}
- Word Count: ${options.wordCount || '1000-1500'} words
- Include proper headings, structure, and SEO optimization
- Ensure factual accuracy and authority
- Make it engaging and valuable for readers`;
  }

  buildContentPrompt(request) {
    let prompt = `Create a comprehensive ${request.contentType || 'blog post'} about "${request.topic}"`;
    
    if (request.audience) {
      prompt += ` for ${request.audience} audience`;
    }
    
    if (request.keyPoints && request.keyPoints.length > 0) {
      prompt += `\n\nKey points to cover:\n${request.keyPoints.map(point => `- ${point}`).join('\n')}`;
    }
    
    if (request.toneOfVoice) {
      prompt += `\n\nTone of voice: ${request.toneOfVoice}`;
    }
    
    return prompt;
  }

  buildImagePrompt(prompt, options) {
    const style = options.style || 'professional';
    const contentType = options.contentType || 'blog_post';
    
    return `Create a ${style} illustration for a ${contentType} about: ${prompt}. 
    The image should be visually appealing, relevant to the content, and suitable for ${options.audience || 'professional'} audience. 
    Style: ${style}, high quality, modern design.`;
  }

  buildImagePromptFromContent(content, request) {
    // Extract key themes from content for image generation
    const topic = request.topic;
    const style = request.imageStyle || 'professional';
    
    return `Create a ${style} illustration representing the concept of "${topic}". 
    The image should be visually appealing, modern, and suitable for ${request.audience || 'professional'} content. 
    Style: ${style}, high quality, clean design.`;
  }

  prepareTextForSpeech(text) {
    // Clean up text for better speech synthesis
    return text
      .replace(/[#*_`]/g, '') // Remove markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/\n{2,}/g, '. ') // Convert paragraphs to pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 5000); // Limit length for TTS
  }

  extractTextForSpeech(content) {
    // Extract main content for speech, removing metadata
    if (typeof content === 'object') {
      // If content is structured, extract main text
      return this.prepareTextForSpeech(JSON.stringify(content));
    }
    return this.prepareTextForSpeech(content);
  }

  async downloadImageAsBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const base64 = Buffer.from(response.data).toString('base64');
      const mimeType = response.headers['content-type'] || 'image/png';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('❌ Error downloading image:', error.message);
      return null;
    }
  }

  async generateFallbackSVG(prompt, options) {
    // Generate a simple SVG as fallback
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">
          Content Image: ${prompt.substring(0, 50)}...
        </text>
        <text x="400" y="350" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
          Generated with fallback SVG
        </text>
      </svg>
    `;
    
    const base64 = Buffer.from(svg).toString('base64');
    
    return {
      imageUrl: `data:image/svg+xml;base64,${base64}`,
      imageBase64: base64,
      revisedPrompt: prompt,
      model: 'fallback-svg',
      provider: 'fallback',
      generatedAt: new Date().toISOString()
    };
  }

  async generateFallbackAudio(text, options) {
    // Generate mock audio data
    const mockAudioData = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    
    return {
      audioData: mockAudioData,
      audioUrl: `data:audio/wav;base64,${mockAudioData}`,
      voiceId: 'fallback',
      model: 'fallback-tts',
      textLength: text.length,
      provider: 'fallback',
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = { RealLLMIntegrationService };
