#!/bin/bash

# Deployment script for Freshness Aggregator Function
# This script builds and deploys the function to Azure

set -e  # Exit on any error

# Configuration
FUNCTION_APP_NAME="freshness-aggregator-func"
RESOURCE_GROUP="freshness-aggregator-rg"

echo "=== Freshness Aggregator Deployment ==="
echo "Function App: $FUNCTION_APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Check if azure-config.json exists and load configuration
if [ -f "azure-config.json" ]; then
    echo "Loading configuration from azure-config.json..."
    FUNCTION_APP_NAME=$(jq -r '.functionApp' azure-config.json)
    RESOURCE_GROUP=$(jq -r '.resourceGroup' azure-config.json)
    echo "Updated Function App: $FUNCTION_APP_NAME"
    echo "Updated Resource Group: $RESOURCE_GROUP"
else
    echo "Warning: azure-config.json not found. Using default values."
    echo "Run azure-setup.sh first to create resources and configuration."
fi

# Check if user is logged in to Azure
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please log in to Azure first:"
    az login
fi

# Check if Azure Functions Core Tools is installed
if ! command -v func &> /dev/null; then
    echo "Azure Functions Core Tools not found. Installing..."
    npm install -g azure-functions-core-tools@4 --unsafe-perm true
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building TypeScript project..."
npm run build

# Check if Function App exists
echo "Checking if Function App exists..."
if ! az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Error: Function App '$FUNCTION_APP_NAME' not found in resource group '$RESOURCE_GROUP'"
    echo "Please run azure-setup.sh first to create the Function App."
    exit 1
fi

# Deploy to Azure
echo "Deploying to Azure Function App..."
func azure functionapp publish $FUNCTION_APP_NAME --typescript

# Get Function App URL
FUNCTION_URL=$(az functionapp show \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query defaultHostName -o tsv)

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Function App URL: https://$FUNCTION_URL"
echo "Function Endpoint: https://$FUNCTION_URL/api/freshness-aggregator"
echo ""
echo "Test your function with:"
echo "curl -X POST https://$FUNCTION_URL/api/freshness-aggregator \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"query\": \"azure functions\", \"options\": {\"maxResults\": 5}}'"
echo ""
echo "Monitor your function:"
echo "- Azure Portal: https://portal.azure.com"
echo "- Application Insights: Search for '$APP_INSIGHTS_NAME' in the portal"
echo "- Function Logs: az functionapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "Deployment completed successfully! 🚀"
