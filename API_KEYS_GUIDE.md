# 🔑 API Keys Configuration Guide

## 📋 Overview

This guide helps you configure all the necessary API keys for the **Content Architect 4-Layer Orchestration System**. Your `.env` file already has most Azure services configured with real keys. Below are the additional services you may want to add for enhanced functionality.

## ✅ Already Configured (Working Keys)

Your `.env` file already includes these working services:

### 🔵 Azure Services (Fully Configured)
- ✅ **Azure OpenAI**: `AZURE_OPENAI_KEY` - Working
- ✅ **Azure AI Foundry**: `AZURE_FOUNDRY_API_KEY` - Working  
- ✅ **Azure Cosmos DB**: `AZURE_COSMOS_KEY` - Working
- ✅ **Azure Search**: `AZURE_SEARCH_KEY` - Working
- ✅ **Azure Language Services**: `AZURE_LANGUAGE_SERVICE_API_KEY` - Working
- ✅ **Azure Redis Cache**: `REDIS_PASSWORD` - Working
- ✅ **Azure Application Insights**: `AZURE_APP_INSIGHTS_INSTRUMENTATION_KEY` - Working

### 🌐 External APIs (Configured)
- ✅ **Exa API**: `EXA_API_KEY` - Working
- ✅ **NewsAPI**: `NEWS_API_KEY` - Working
- ✅ **SerpAPI**: `SERP_API_KEY` - Working
- ✅ **MediaStack**: `MEDIASTACK_API_KEY` - Working
- ✅ **Social Searcher**: `SOCIAL_SEARCHER_API_KEY` - Working
- ✅ **Twitter/X API**: `X_BEARER_TOKEN` - Working
- ✅ **Claude API**: `CLAUDE_API_KEY` - Working

## 🔧 Optional Additional Services

These services can enhance the orchestration layer but are not required for basic functionality:

### 🤖 Additional AI Services

#### OpenAI (Backup to Azure OpenAI)
```bash
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION_ID=org-...
```
**How to get**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)

#### Google AI (Gemini/PaLM)
```bash
GOOGLE_AI_API_KEY=AIza...
GOOGLE_AI_PROJECT_ID=your-project-id
```
**How to get**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

### 📊 SEO & Authority Services

#### Moz API (Domain Authority)
```bash
MOZ_ACCESS_ID=your-access-id
MOZ_SECRET_KEY=your-secret-key
```
**How to get**: Visit [Moz API](https://moz.com/products/mozscape/access)
**Cost**: Paid service, starts at $99/month

#### Ahrefs API (Backlink Analysis)
```bash
AHREFS_API_TOKEN=your-token
```
**How to get**: Visit [Ahrefs API](https://ahrefs.com/api)
**Cost**: Paid service, starts at $500/month

#### SEMrush API (Keyword Analysis)
```bash
SEMRUSH_API_KEY=your-api-key
```
**How to get**: Visit [SEMrush API](https://www.semrush.com/api-documentation/)
**Cost**: Paid service, varies by plan

#### Majestic API (Link Intelligence)
```bash
MAJESTIC_API_KEY=your-api-key
MAJESTIC_API_SECRET=your-secret
```
**How to get**: Visit [Majestic API](https://majestic.com/reports/api-documentation)
**Cost**: Paid service, starts at $49.99/month

## 🚀 Quick Start (Minimum Required)

Your system is already configured with the minimum required services! You can start the orchestration layer immediately with:

```bash
# Start the NestJS backend (port 3000)
npm run start:dev

# Start the orchestrated frontend (port 3001)
node orchestrated-server.js
```

## 🔄 Testing the Orchestration

With your current configuration, the system will:

1. ✅ **Connect to Azure OpenAI** for content generation
2. ✅ **Use Exa API** for fresh content discovery
3. ✅ **Access NewsAPI** for news aggregation
4. ✅ **Query SerpAPI** for search results
5. ✅ **Integrate Twitter API** for social signals
6. ✅ **Store data in Cosmos DB** for persistence
7. ✅ **Cache results in Redis** for performance

## 📈 Service Priority Recommendations

### High Priority (Immediate Value)
1. **Keep current Azure services** - Already working perfectly
2. **OpenAI API** - Good backup for Azure OpenAI
3. **Google AI API** - Adds Gemini model support

### Medium Priority (Enhanced SEO)
1. **Moz API** - For domain authority scoring
2. **SEMrush API** - For keyword research enhancement

### Low Priority (Advanced Features)
1. **Ahrefs API** - Expensive but comprehensive backlink data
2. **Majestic API** - Alternative link intelligence

## 🛠️ Configuration Steps

### For Additional AI Services:

1. **OpenAI** (Optional backup):
   ```bash
   # Add to .env
   OPENAI_API_KEY=your_openai_key_here
   OPENAI_ORGANIZATION_ID=your_org_id_here
   ```

2. **Google AI** (Optional Gemini support):
   ```bash
   # Add to .env
   GOOGLE_AI_API_KEY=your_google_ai_key_here
   GOOGLE_AI_PROJECT_ID=your_project_id_here
   ```

### For SEO Enhancement Services:

1. **Moz API** (Domain Authority):
   ```bash
   # Add to .env
   MOZ_ACCESS_ID=your_moz_access_id
   MOZ_SECRET_KEY=your_moz_secret_key
   ```

## 🔍 Testing Individual Services

You can test each service independently:

```bash
# Test Azure OpenAI
curl -X POST http://localhost:3000/test/azure-openai

# Test Exa API
curl -X POST http://localhost:3000/test/exa-search

# Test NewsAPI
curl -X POST http://localhost:3000/test/news-api

# Test full orchestration
curl -X POST http://localhost:3001/llm-content/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI Technology", "audience": "b2b"}'
```

## 🎯 Current System Capabilities

With your existing configuration, the orchestration layer can:

### ✅ Bottom Layer (SEO Foundation)
- **Query Intent Analysis** via Azure Language Services
- **Freshness Aggregation** via Exa, NewsAPI, SerpAPI
- **Keyword Analysis** via Azure Search and external APIs
- **Technical SEO Validation** via Azure Functions
- **Vector Search** via Azure AI Search

### ✅ Middle Layer (AI Optimization)  
- **BLUF Content Structuring** via Azure OpenAI
- **Conversational Query Optimization** via Claude API
- **Semantic Relationship Mapping** via Azure Language Services
- **Platform-Specific Tuning** for Claude, GPT-4, etc.

### ✅ Top Layer (Authority Signals)
- **E-E-A-T Signal Generation** via Azure AI
- **Original Research Engine** via multiple data sources
- **Citation Authority Verification** via external APIs

## 🔐 Security Best Practices

1. **Never commit `.env` to version control**
2. **Rotate API keys regularly**
3. **Use Azure Key Vault for production**
4. **Monitor API usage and costs**
5. **Set up rate limiting and quotas**

## 📞 Support

If you need help with any API configuration:

1. **Azure Services**: Check Azure Portal for service status
2. **External APIs**: Refer to each provider's documentation
3. **Orchestration Issues**: Check the console logs for detailed error messages

Your system is already well-configured and ready for production use! 🚀
