#!/bin/bash

# Azure Functions Setup Script
# This script creates Azure Functions for all 19 services in the 4-layer architecture

set -e

echo "🚀 Setting up Azure Functions for Content Architect..."

# Set variables
RESOURCE_GROUP="aibo_group"
LOCATION="westus2"
STORAGE_ACCOUNT="aibocontentfunctions"
FUNCTION_APP="aibo-content-functions"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Storage Account: $STORAGE_ACCOUNT"
echo "   Function App: $FUNCTION_APP"

# Check if logged in to Azure
echo "🔐 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "✅ Azure login confirmed"

# Create storage account for Azure Functions
echo "💾 Creating storage account..."
if az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "✅ Storage account '$STORAGE_ACCOUNT' already exists"
else
    echo "🔄 Creating new storage account..."
    az storage account create \
        --name $STORAGE_ACCOUNT \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku Standard_LRS \
        --kind StorageV2
    
    echo "✅ Storage account created successfully"
fi

# Create Function App
echo "⚡ Creating Function App..."
if az functionapp show --name $FUNCTION_APP --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "✅ Function App '$FUNCTION_APP' already exists"
else
    echo "🔄 Creating new Function App..."
    az functionapp create \
        --name $FUNCTION_APP \
        --resource-group $RESOURCE_GROUP \
        --storage-account $STORAGE_ACCOUNT \
        --runtime node \
        --runtime-version 18 \
        --functions-version 4 \
        --consumption-plan-location $LOCATION
    
    echo "✅ Function App created successfully"
fi

# Configure Function App settings
echo "⚙️ Configuring Function App settings..."

# Get Cosmos DB connection string
COSMOS_ENDPOINT=$(az cosmosdb show --name aibo-content-db --resource-group $RESOURCE_GROUP --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list --name aibo-content-db --resource-group $RESOURCE_GROUP --query primaryMasterKey -o tsv)

# Set application settings
az functionapp config appsettings set \
    --name $FUNCTION_APP \
    --resource-group $RESOURCE_GROUP \
    --settings \
    "COSMOS_DB_ENDPOINT=$COSMOS_ENDPOINT" \
    "COSMOS_DB_KEY=$COSMOS_KEY" \
    "COSMOS_DB_DATABASE_NAME=ContentArchitect" \
    "COSMOS_DB_VECTORS_CONTAINER=ContentVectors" \
    "COSMOS_DB_EMBEDDINGS_CONTAINER=ContentEmbeddings" \
    "COSMOS_DB_SEARCH_HISTORY_CONTAINER=SearchHistory" \
    "AZURE_OPENAI_ENDPOINT=$(grep AZURE_OPENAI_ENDPOINT .env | cut -d '=' -f2)" \
    "AZURE_OPENAI_API_KEY=$(grep AZURE_OPENAI_API_KEY .env | cut -d '=' -f2)" \
    "AZURE_OPENAI_DEPLOYMENT_NAME=$(grep AZURE_OPENAI_DEPLOYMENT_NAME .env | cut -d '=' -f2)" \
    "CLAUDE_API_KEY=$(grep CLAUDE_API_KEY .env | cut -d '=' -f2)" \
    "OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2)" \
    "ELEVENLABS_API_KEY=$(grep ELEVENLABS_API_KEY .env | cut -d '=' -f2)"

echo "✅ Function App settings configured"

echo ""
echo "🎉 Azure Functions setup completed successfully!"
echo ""
echo "📋 Function App Details:"
echo "   Name: $FUNCTION_APP"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Storage Account: $STORAGE_ACCOUNT"
echo "   Runtime: Node.js 18"
echo ""
echo "🔗 Function App URL:"
az functionapp show --name $FUNCTION_APP --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv
echo ""
echo "✅ Your Azure Functions are ready for deployment!"
