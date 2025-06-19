require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

/**
 * Simple test script to verify Claude API integration with Azure OpenAI fallback
 */
async function testClaudeFallback() {
  console.log('Testing Claude API with Azure OpenAI fallback...');
  
  // Simulate the ClaudeAIService
  async function generateWithClaude(prompt) {
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
            max_tokens: 500,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
          };
          
          const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
              },
              timeout: 15000
            }
          );
          
          if (response.status === 200 && response.data) {
            const completionText = response.data.content?.[0]?.text || '';
            return {
              completion: completionText,
              model: modelName,
              usage: response.data.usage || null,
              stop_reason: response.data.stop_reason || null
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
  async function generateWithAzure(prompt) {
    console.log('Falling back to Azure OpenAI...');
    
    try {
      // Simulate Azure OpenAI response
      console.log('Successfully generated content with Azure OpenAI fallback');
      return {
        text: "This is a simulated Azure OpenAI response for: " + prompt,
        usage: {
          total_tokens: 150,
          prompt_tokens: 50,
          completion_tokens: 100
        }
      };
    } catch (error) {
      console.error(`Azure OpenAI error: ${error.message}`);
      throw error;
    }
  }
  
  // Simulate the LLMContentOptimizerService
  async function generateOptimizedTitle(input) {
    try {
      console.log('Generating optimized title...');
      
      const titlePrompt = `
        Generate a compelling title for a ${input.contentType} 
        on the topic of "${input.topic}" for a ${input.audience === 'b2b' ? 'business' : 'consumer'} audience.
      `.trim();
      
      try {
        console.log('Attempting to generate title with Claude AI');
        
        const result = await generateWithClaude(titlePrompt);
        
        if (result && result.completion) {
          console.log('Successfully generated title with Claude AI');
          return result.completion.trim();
        }
        
        console.warn('Claude AI returned unexpected response format');
      } catch (titleError) {
        console.warn(`Claude API error for title generation: ${titleError.message}`);
      }
      
      // Fallback to Azure if Claude fails
      console.log('Falling back to Azure OpenAI for title generation');
      const azureResult = await generateWithAzure(titlePrompt);
      
      console.log('Successfully generated title with Azure OpenAI');
      return azureResult.text.trim();
    } catch (error) {
      console.error(`Error generating title: ${error.message}`);
      throw new Error(`Failed to generate title: ${error.message}`);
    }
  }
  
  // Test the title generation with fallback
  try {
    const input = {
      topic: 'Cloud Computing Technology Trends',
      contentType: 'blog_post',
      audience: 'b2b',
      toneOfVoice: 'formal'
    };
    
    const title = await generateOptimizedTitle(input);
    console.log('Final generated title:', title);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testClaudeFallback();
