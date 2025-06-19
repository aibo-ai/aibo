# ContentArchitect

An advanced AI-powered content generation system designed to create content that ranks effectively in LLM-based search engines like ChatGPT, Perplexity, Gemini, and Grok.

## Overview

ContentArchitect serves both B2B and B2C brands with customized content strategies, leveraging a multi-layered architecture that combines data gathering, semantic processing, and AI-optimized content generation.

## Core Objectives

1. Generate content specifically optimized for LLM search visibility
2. Customize content strategies for both B2B and B2C brands
3. Leverage real-time data from multiple sources for freshness and relevance
4. Implement industry-specific best practices and frameworks
5. Provide a seamless user experience from input to final content delivery

## Architecture

The system follows a three-layer architecture with an orchestration layer:

- **Bottom Layer**: SEO Foundation
- **Middle Layer**: AI-Specific Optimization
- **Top Layer**: Authority & Trust
- **Orchestration Layer**: Coordinates data flow between layers

## Technology Stack

- **Core Platform**: Microsoft Azure with AWS integration
- **Backend Framework**: NestJS (TypeScript/Node.js)
- **Data Layer**: Azure Cosmos DB, Vector database
- **AI Integration**: Azure AI Foundry with Anthropic Claude Opus
- **API Gateway**: Azure API Management
- **Frontend**: React.js with Azure Static Web Apps

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- Azure CLI
- AWS CLI

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (see `.env.example`)
4. Start development server:
   ```
   npm run start:dev
   ```

## Project Structure

- `/src` - Source code
  - `/api` - API layer and controllers
  - `/components` - Core components for each architectural layer
  - `/services` - Business logic and services
  - `/models` - Data models and interfaces
  - `/utils` - Utility functions and helpers
- `/config` - Configuration files for different environments
- `/docs` - Documentation files
- `/tests` - Test files
