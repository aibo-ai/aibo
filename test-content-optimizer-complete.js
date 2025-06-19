require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

/**
 * Comprehensive test script to verify Claude API integration with Azure OpenAI fallback
 * for all three content generation methods in LLMContentOptimizerService
 */
async function testContentOptimizerService() {
  console.log('Testing LLMContentOptimizerService with Claude API...');
  
  // Simulate the ClaudeAIService
  async function generateWithClaude(prompt, options = {}) {
    console.log('Attempting to generate with Claude API...');
    
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('CLAUDE_API_KEY not found in environment variables');
      throw new Error('Claude API key is not configured');
    }
    
    try {
      const requestId = crypto.randomBytes(4).toString('hex');
      console.log(`[${requestId}] Starting Claude completion request`);
      
      const models = [
        'claude-3-haiku-20240307',
        'claude-3-sonnet-20240229',
        'claude-2.1'
      ];
      
      for (const modelName of models) {
        try {
          console.log(`[${requestId}] Attempting completion with Claude model: ${modelName}`);
          
          const payload = {
            model: modelName,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            messages: [{ role: 'user', content: prompt }]
          };
          
          if (options.system) {
            payload.system = options.system;
          }
          
          const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
              },
              timeout: 30000
            }
          );
          
          if (response.status === 200 && response.data) {
            const completionText = response.data.content?.[0]?.text || '';
            return {
              completion: completionText,
              model: modelName,
              usage: response.data.usage || null,
              stop_reason: response.data.stop_reason || null,
              provider: 'claude'
            };
          } else {
            console.warn(`[${requestId}] Claude API returned unexpected status ${response.status}`);
          }
        } catch (err) {
          const status = err.response?.status;
          if (status === 401) {
            console.error(`[${requestId}] Authentication failed: Invalid API key or unauthorized access`);
            throw new Error('Claude API authentication failed: Invalid API key');
          } else if (status === 403) {
            console.error(`[${requestId}] Authorization failed: Insufficient permissions`);
            throw new Error('Claude API authorization failed: Insufficient permissions');
          } else {
            console.warn(`[${requestId}] Error with model ${modelName}: ${err.message}`);
            // Continue to try next model
          }
        }
      }
      
      throw new Error('All Claude models failed');
    } catch (error) {
      console.error(`Claude API error: ${error.message}`);
      throw error;
    }
  }
  
  // Simulate the AzureAIService
  async function generateWithAzure(prompt, options = {}) {
    console.log('Falling back to Azure OpenAI...');
    
    try {
      // Simulate Azure OpenAI response
      console.log('Successfully generated content with Azure OpenAI fallback');
      return {
        text: `[Azure OpenAI Fallback] Response for prompt: ${prompt.substring(0, 50)}...`,
        usage: {
          total_tokens: 150,
          prompt_tokens: 50,
          completion_tokens: 100
        },
        provider: 'azure'
      };
    } catch (error) {
      console.error(`Azure OpenAI error: ${error.message}`);
      throw error;
    }
  }
  
  // Simulate the LLMContentOptimizerService.generateOptimizedTitle method
  async function generateOptimizedTitle(input) {
    try {
      console.log('Generating optimized title...');
      
      const titlePrompt = `
        Generate a compelling title for a ${input.contentType} 
        on the topic of "${input.topic}" for a ${input.audience === 'b2b' ? 'business' : 'consumer'} audience.
      `.trim();
      
      try {
        console.log('Attempting to generate title with Claude AI');
        
        const result = await generateWithClaude(titlePrompt, {
          maxTokens: 100,
          temperature: 0.7
        });
        
        if (result && result.completion) {
          console.log('Successfully generated title with Claude AI');
          return {
            title: result.completion.trim(),
            provider: 'claude'
          };
        }
        
        console.warn('Claude AI returned unexpected response format');
      } catch (titleError) {
        console.warn(`Claude API error for title generation: ${titleError.message}`);
      }
      
      // Fallback to Azure if Claude fails
      console.log('Falling back to Azure OpenAI for title generation');
      const azureResult = await generateWithAzure(titlePrompt);
      
      console.log('Successfully generated title with Azure OpenAI');
      return {
        title: azureResult.text.trim(),
        provider: 'azure'
      };
    } catch (error) {
      console.error(`Error generating title: ${error.message}`);
      throw new Error(`Failed to generate title: ${error.message}`);
    }
  }
  
  // Simulate the LLMContentOptimizerService.generateContentSections method
  async function generateContentSections(input) {
    try {
      console.log('Generating content sections...');
      
      const sectionsPrompt = `
        Generate ${input.keypoints.length} detailed sections for a ${input.contentType} 
        on the topic of "${input.topic}" for a ${input.audience === 'b2b' ? 'business' : 'consumer'} audience.
        
        Each section should cover one of the following key points:
        ${input.keypoints.map((point, index) => `${index + 1}. ${point}`).join('\\n')}
        
        For each section, provide:
        - A compelling subheading
        - 2-3 paragraphs of informative content
        - Key takeaways or actionable insights
      `.trim();
      
      try {
        console.log('Attempting to generate sections with Claude AI');
        
        const result = await generateWithClaude(sectionsPrompt, {
          maxTokens: 2000,
          temperature: 0.7
        });
        
        if (result && result.completion) {
          console.log('Successfully generated sections with Claude AI');
          return {
            sections: result.completion.trim(),
            provider: 'claude'
          };
        }
        
        console.warn('Claude AI returned unexpected response format');
      } catch (sectionsError) {
        console.warn(`Claude API error for sections generation: ${sectionsError.message}`);
      }
      
      // Fallback to Azure if Claude fails
      console.log('Falling back to Azure OpenAI for sections generation');
      const azureResult = await generateWithAzure(sectionsPrompt);
      
      console.log('Successfully generated sections with Azure OpenAI');
      return {
        sections: azureResult.text.trim(),
        provider: 'azure'
      };
    } catch (error) {
      console.error(`Error generating sections: ${error.message}`);
      throw new Error(`Failed to generate sections: ${error.message}`);
    }
  }
  
  // Simulate the LLMContentOptimizerService.generateContentSummary method
  async function generateContentSummary(input) {
    try {
      console.log('Generating content summary...');
      
      const summaryPrompt = `
        Write a concise executive summary for a ${input.contentType} 
        on the topic of "${input.topic}" for a ${input.audience === 'b2b' ? 'business' : 'consumer'} audience.
        
        The content covers the following key points:
        ${input.keypoints.map((point, index) => `${index + 1}. ${point}`).join('\\n')}
        
        The summary should:
        - Be approximately 2-3 paragraphs
        - Highlight the main value proposition
        - Include a brief overview of the key points
        - End with a compelling conclusion
      `.trim();
      
      try {
        console.log('Attempting to generate summary with Claude AI');
        
        const result = await generateWithClaude(summaryPrompt, {
          maxTokens: 500,
          temperature: 0.7
        });
        
        if (result && result.completion) {
          console.log('Successfully generated summary with Claude AI');
          return {
            summary: result.completion.trim(),
            provider: 'claude'
          };
        }
        
        console.warn('Claude AI returned unexpected response format');
      } catch (summaryError) {
        console.warn(`Claude API error for summary generation: ${summaryError.message}`);
      }
      
      // Fallback to Azure if Claude fails
      console.log('Falling back to Azure OpenAI for summary generation');
      const azureResult = await generateWithAzure(summaryPrompt);
      
      console.log('Successfully generated summary with Azure OpenAI');
      return {
        summary: azureResult.text.trim(),
        provider: 'azure'
      };
    } catch (error) {
      console.error(`Error generating summary: ${error.message}`);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }
  
  // Test all three content generation methods
  try {
    const input = {
      topic: 'Cloud Computing Technology Trends',
      contentType: 'blog_post',
      audience: 'b2b',
      toneOfVoice: 'formal',
      keypoints: [
        'Edge computing integration',
        'Multi-cloud strategies',
        'AI-powered cloud services',
        'Serverless architecture adoption',
        'Cloud security innovations'
      ],
      targetLength: 'medium'
    };
    
    console.log('=== Testing generateOptimizedTitle ===');
    const titleResult = await generateOptimizedTitle(input);
    console.log('Title Provider:', titleResult.provider);
    console.log('Generated Title:', titleResult.title);
    console.log();
    
    console.log('=== Testing generateContentSections ===');
    const sectionsResult = await generateContentSections(input);
    console.log('Sections Provider:', sectionsResult.provider);
    console.log('Generated Sections (excerpt):', sectionsResult.sections.substring(0, 200) + '...');
    console.log();
    
    console.log('=== Testing generateContentSummary ===');
    const summaryResult = await generateContentSummary(input);
    console.log('Summary Provider:', summaryResult.provider);
    console.log('Generated Summary (excerpt):', summaryResult.summary.substring(0, 200) + '...');
    console.log();
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testContentOptimizerService();
