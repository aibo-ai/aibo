const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const { OpenAIClient } = require("@azure/openai");
const { CosmosClient } = require("@azure/cosmos");
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');

// Initialize clients based on environment variables
const textAnalyticsClient = new TextAnalyticsClient(
  process.env.AZURE_COG_SERVICES_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_COG_SERVICES_KEY)
);

const openAIClient = new OpenAIClient(
  process.env.AZURE_AI_FOUNDRY_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_AI_FOUNDRY_KEY)
);

const cosmosClient = new CosmosClient({
  endpoint: process.env.AZURE_COSMOS_ENDPOINT,
  key: process.env.AZURE_COSMOS_KEY
});

module.exports = async function (context, req) {
  context.log('Authority Signals Analyzer processing request.');
  
  try {
    // Extract request body data
    const {
      content,
      contentId = uuidv4(),
      url,
      domain,
      title,
      author,
      publicationDate,
      contentType = "article"
    } = req.body || {};
    
    if (!content) {
      context.res = {
        status: 400,
        body: { error: "Content is required for analysis" }
      };
      return;
    }
    
    // Analyze factual claims in content
    context.log('Analyzing factual claims and citations...');
    const factualClaimsAnalysis = await analyzeFactualClaims(content);
    
    // Analyze E-A-T signals in content
    context.log('Analyzing E-A-T signals...');
    const eatSignalsAnalysis = await analyzeEATSignals(content, title, author);
    
    // Analyze domain authority if URL is provided
    let domainAuthorityScore = 0;
    if (domain || url) {
      context.log('Analyzing domain authority...');
      const domainToAnalyze = domain || extractDomain(url);
      if (domainToAnalyze) {
        domainAuthorityScore = await analyzeDomainAuthority(domainToAnalyze);
      }
    }
    
    // Calculate overall authority score based on all analyses
    const authorityAnalysis = {
      id: contentId,
      contentId: contentId,
      title: title || 'Untitled content',
      factualAccuracyAnalysis: factualClaimsAnalysis,
      eatSignalsAnalysis: eatSignalsAnalysis,
      domainAuthorityScore: domainAuthorityScore,
      overallScore: calculateOverallScore(
        factualClaimsAnalysis, 
        eatSignalsAnalysis,
        domainAuthorityScore
      ),
      analyzedAt: new Date().toISOString(),
      metadata: {
        url,
        domain: domain || (url ? extractDomain(url) : null),
        author,
        publicationDate,
        contentType
      }
    };
    
    // Save analysis to Cosmos DB
    context.bindings.authorityAnalysisDocument = authorityAnalysis;
    
    // Return successful response with analysis
    context.res = {
      status: 200,
      body: {
        data: authorityAnalysis,
        message: "Authority signals analysis completed successfully"
      }
    };
  } catch (error) {
    context.log.error(`Error in Authority Signals Analyzer: ${error.message}`);
    context.log.error(error);
    
    context.res = {
      status: 500,
      body: { 
        error: "Error analyzing authority signals",
        message: error.message
      }
    };
  }
};

/**
 * Analyzes factual claims and citations in content using Azure OpenAI
 */
async function analyzeFactualClaims(content) {
  // Create prompt for analyzing factual claims and citations
  const prompt = `
You are an expert fact-checker tasked with evaluating the factual accuracy and citation quality of the following content.

Please analyze the content for:
1. Factual claims that require verification
2. Citation quality and presence
3. Factual accuracy based on your knowledge

Content:
"""
${content.substring(0, 8000)} ${content.length > 8000 ? '... [content truncated]' : ''}
"""

First, identify up to 5 key factual claims that should be verified. For each claim, assess if it's supported by proper citations.
Then, evaluate the overall citation quality based on:
- Citation presence (are claims cited)
- Citation quality (are citations from reputable sources)
- Citation relevance (do citations support the claims)

Finally, provide an overall factual accuracy assessment.

Provide your evaluation in the following JSON format (and ONLY this format):
{
  "keyFactualClaims": [
    {
      "claim": "Claim text here",
      "hasCitation": true/false,
      "citationQuality": 0-10 (0 = no citation, 10 = perfect citation),
      "factualAccuracy": 0-10 (based on your knowledge)
    }
    // Up to 5 claims
  ],
  "citationAnalysis": {
    "citationPresenceScore": 0-10,
    "citationQualityScore": 0-10,
    "citationRelevanceScore": 0-10,
    "overallCitationScore": 0-10
  },
  "factualAccuracyScore": 0-10,
  "factCheckerNotes": "Brief notes on factual accuracy" 
}
`;

  // Get completion from Azure OpenAI
  const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME;
  const completion = await openAIClient.getCompletions(
    deploymentName,
    [prompt],
    {
      temperature: 0.0,
      maxTokens: 1500
    }
  );

  // Parse the response and handle any formatting errors
  try {
    const responseText = completion.choices[0].text.trim();
    // Extract just the JSON part from the response (in case there's any extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid JSON format in OpenAI response");
  } catch (error) {
    console.error("Error parsing factual claims analysis:", error);
    // Return a structured error response instead of failing completely
    return {
      keyFactualClaims: [],
      citationAnalysis: {
        citationPresenceScore: 0,
        citationQualityScore: 0,
        citationRelevanceScore: 0,
        overallCitationScore: 0
      },
      factualAccuracyScore: 0,
      factCheckerNotes: "Error analyzing factual claims: " + error.message
    };
  }
}

/**
 * Analyzes E-A-T (Expertise, Authoritativeness, Trustworthiness) signals
 */
async function analyzeEATSignals(content, title, author) {
  // Create prompt for analyzing E-A-T signals
  const prompt = `
You are an expert on Google's E-A-T guidelines (Expertise, Authoritativeness, and Trustworthiness).

Please analyze the following content for E-A-T signals:

${title ? `Title: ${title}` : ''}
${author ? `Author: ${author}` : ''}

Content:
"""
${content.substring(0, 8000)} ${content.length > 8000 ? '... [content truncated]' : ''}
"""

Evaluate the content for the following E-A-T signals:

1. Expertise signals:
   - Evidence of subject matter expertise
   - Depth and accuracy of information
   - Use of technical or specialized knowledge
   - Clarity of explanation

2. Authoritativeness signals:
   - Credibility indicators
   - References to authoritative sources
   - Professional presentation
   - Author credentials (if available)

3. Trustworthiness signals:
   - Transparency about sources
   - Accuracy of information
   - Objectivity vs. bias
   - Content currency and relevance
   - Appropriate disclaimers (if applicable)

Provide your analysis in the following JSON format (and ONLY this format):
{
  "expertise": {
    "score": 0-10,
    "signals": ["list of identified expertise signals"],
    "recommendations": ["suggestions for improving expertise"]
  },
  "authoritativeness": {
    "score": 0-10,
    "signals": ["list of identified authority signals"],
    "recommendations": ["suggestions for improving authoritativeness"]
  },
  "trustworthiness": {
    "score": 0-10,
    "signals": ["list of identified trust signals"],
    "recommendations": ["suggestions for improving trustworthiness"]
  },
  "overallEATScore": 0-10,
  "analysisNotes": "Brief summary of E-A-T analysis"
}
`;

  // Get completion from Azure OpenAI
  const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME;
  const completion = await openAIClient.getCompletions(
    deploymentName,
    [prompt],
    {
      temperature: 0.0,
      maxTokens: 1500
    }
  );

  // Parse the response and handle any formatting errors
  try {
    const responseText = completion.choices[0].text.trim();
    // Extract just the JSON part from the response (in case there's any extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid JSON format in OpenAI response");
  } catch (error) {
    console.error("Error parsing E-A-T signals analysis:", error);
    // Return a structured error response instead of failing completely
    return {
      expertise: {
        score: 0,
        signals: [],
        recommendations: ["Error analyzing expertise signals"]
      },
      authoritativeness: {
        score: 0,
        signals: [],
        recommendations: ["Error analyzing authoritativeness signals"]
      },
      trustworthiness: {
        score: 0,
        signals: [],
        recommendations: ["Error analyzing trustworthiness signals"]
      },
      overallEATScore: 0,
      analysisNotes: "Error analyzing E-A-T signals: " + error.message
    };
  }
}

/**
 * Analyzes domain authority using heuristics and available APIs
 */
async function analyzeDomainAuthority(domain) {
  try {
    // List of high-authority domains for quick check
    const highAuthorityDomains = [
      'edu', 'gov', 'wikipedia.org', 'nytimes.com', 'bbc.com', 'nature.com', 
      'science.org', 'who.int', 'cdc.gov', 'nih.gov', 'harvard.edu', 
      'stanford.edu', 'mit.edu', 'theguardian.com', 'washingtonpost.com',
      'economist.com', 'un.org', 'ieee.org', 'acm.org'
    ];

    // Convert to lowercase for comparison
    const lowercaseDomain = domain.toLowerCase();
    
    // Check if it's a known high-authority domain
    for (const authDomain of highAuthorityDomains) {
      if (lowercaseDomain.includes(authDomain)) {
        return 9; // High score for known authoritative domains
      }
    }
    
    // Check TLD quality
    const tldScore = getTLDScore(lowercaseDomain);
    
    // Calculate domain age score (estimated)
    const domainAgeScore = 5; // Default middle score without actual API
    
    // Simple heuristic to calculate final score (without external APIs)
    const authorityScore = Math.min(Math.round((tldScore + domainAgeScore) / 2), 10);
    
    return authorityScore;
  } catch (error) {
    console.error("Error analyzing domain authority:", error);
    return 5; // Default middle score on error
  }
}

/**
 * Helper function to score TLDs by perceived authority
 */
function getTLDScore(domain) {
  const tldMapping = {
    'edu': 10,
    'gov': 10,
    'org': 8,
    'mil': 9,
    'int': 8,
    'com': 5,
    'net': 5,
    'info': 3
  };
  
  // Extract TLD
  const tld = domain.split('.').pop().toLowerCase();
  
  // Return score based on TLD, default to 5 if not in mapping
  return tldMapping[tld] || 5;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    if (!url) return null;
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error("Error extracting domain from URL:", error);
    return null;
  }
}

/**
 * Calculate overall authority score from all analysis components
 */
function calculateOverallScore(factualClaimsAnalysis, eatSignalsAnalysis, domainAuthorityScore) {
  // Weight factors for different components
  const weights = {
    factualAccuracy: 0.35,
    citations: 0.25,
    eat: 0.30,
    domain: 0.10
  };
  
  // Get scores from each analysis (with fallbacks)
  const factualAccuracyScore = factualClaimsAnalysis?.factualAccuracyScore || 0;
  const citationScore = factualClaimsAnalysis?.citationAnalysis?.overallCitationScore || 0;
  const eatScore = eatSignalsAnalysis?.overallEATScore || 0;
  
  // Calculate weighted average
  const weightedScore = 
    (factualAccuracyScore * weights.factualAccuracy) +
    (citationScore * weights.citations) +
    (eatScore * weights.eat) +
    (domainAuthorityScore * weights.domain);
  
  // Normalize to 0-100 scale
  const normalizedScore = Math.round((weightedScore / 10) * 100);
  
  return normalizedScore;
}
