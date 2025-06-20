#!/bin/bash

# Deploy Technical SEO Validator (Serverless Version) to Azure Functions
# This script deploys the serverless version that doesn't require Puppeteer/Chrome

# Variables
RESOURCE_GROUP="ContentArchitectRG"
FUNCTION_APP_NAME="ca-seo-validator"
LOCATION="eastus"

echo "Deploying Technical SEO Validator (Serverless Version) to Azure Functions..."
echo "============================================================"

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Deploy to Azure Functions
echo "Deploying to Azure Functions..."
func azure functionapp publish $FUNCTION_APP_NAME

echo ""
echo "Deployment complete!"
echo "Function URL: https://$FUNCTION_APP_NAME.azurewebsites.net/api/validate-serverless"
echo "Note: This endpoint requires a function key for authentication"
echo ""
echo "To test the function, use:"
echo "curl -X POST https://$FUNCTION_APP_NAME.azurewebsites.net/api/validate-serverless?code=YOUR_FUNCTION_KEY \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"html\": \"<html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>\"}'"
