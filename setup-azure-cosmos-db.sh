#!/bin/bash

# Azure Cosmos DB Setup Script
# This script creates a Cosmos DB account and database for the Content Architect application

set -e

echo "🚀 Setting up Azure Cosmos DB for Content Architect..."

# Load environment variables
source .env

# Set variables from environment or use defaults
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-"marketing-rg"}
LOCATION=${AZURE_LOCATION:-"eastus"}
COSMOS_ACCOUNT_NAME=${AZURE_COSMOS_DB_ACCOUNT_NAME:-"aibo-content-architect"}
DATABASE_NAME=${AZURE_COSMOS_DB_DATABASE_NAME:-"ContentArchitect"}

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Cosmos Account: $COSMOS_ACCOUNT_NAME"
echo "   Database: $DATABASE_NAME"

# Check if logged in to Azure
echo "🔐 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "✅ Azure login confirmed"

# Create Cosmos DB account if it doesn't exist
echo "🗄️ Creating Cosmos DB account..."
if az cosmosdb show --name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "✅ Cosmos DB account '$COSMOS_ACCOUNT_NAME' already exists"
else
    echo "🔄 Creating new Cosmos DB account..."
    az cosmosdb create \
        --name $COSMOS_ACCOUNT_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --kind GlobalDocumentDB \
        --default-consistency-level Session \
        --enable-multiple-write-locations true \
        --enable-automatic-failover true \
        --capabilities EnableServerless
    
    echo "✅ Cosmos DB account created successfully"
fi

# Create database
echo "🗃️ Creating database..."
if az cosmosdb sql database show --account-name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --name $DATABASE_NAME &> /dev/null; then
    echo "✅ Database '$DATABASE_NAME' already exists"
else
    echo "🔄 Creating new database..."
    az cosmosdb sql database create \
        --account-name $COSMOS_ACCOUNT_NAME \
        --resource-group $RESOURCE_GROUP \
        --name $DATABASE_NAME
    
    echo "✅ Database created successfully"
fi

# Create containers
echo "📦 Creating containers..."

# Container 1: ContentVectors
CONTAINER_1="ContentVectors"
if az cosmosdb sql container show --account-name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --database-name $DATABASE_NAME --name $CONTAINER_1 &> /dev/null; then
    echo "✅ Container '$CONTAINER_1' already exists"
else
    echo "🔄 Creating container '$CONTAINER_1'..."
    az cosmosdb sql container create \
        --account-name $COSMOS_ACCOUNT_NAME \
        --resource-group $RESOURCE_GROUP \
        --database-name $DATABASE_NAME \
        --name $CONTAINER_1 \
        --partition-key-path "/contentType" \
        --throughput 400
    
    echo "✅ Container '$CONTAINER_1' created successfully"
fi

# Container 2: ContentEmbeddings
CONTAINER_2="ContentEmbeddings"
if az cosmosdb sql container show --account-name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --database-name $DATABASE_NAME --name $CONTAINER_2 &> /dev/null; then
    echo "✅ Container '$CONTAINER_2' already exists"
else
    echo "🔄 Creating container '$CONTAINER_2'..."
    az cosmosdb sql container create \
        --account-name $COSMOS_ACCOUNT_NAME \
        --resource-group $RESOURCE_GROUP \
        --database-name $DATABASE_NAME \
        --name $CONTAINER_2 \
        --partition-key-path "/type" \
        --throughput 400
    
    echo "✅ Container '$CONTAINER_2' created successfully"
fi

# Container 3: SearchHistory
CONTAINER_3="SearchHistory"
if az cosmosdb sql container show --account-name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --database-name $DATABASE_NAME --name $CONTAINER_3 &> /dev/null; then
    echo "✅ Container '$CONTAINER_3' already exists"
else
    echo "🔄 Creating container '$CONTAINER_3'..."
    az cosmosdb sql container create \
        --account-name $COSMOS_ACCOUNT_NAME \
        --resource-group $RESOURCE_GROUP \
        --database-name $DATABASE_NAME \
        --name $CONTAINER_3 \
        --partition-key-path "/userId" \
        --throughput 400
    
    echo "✅ Container '$CONTAINER_3' created successfully"
fi

# Get connection details
echo "🔗 Retrieving connection details..."
COSMOS_ENDPOINT=$(az cosmosdb show --name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list --name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --query primaryMasterKey -o tsv)

echo ""
echo "🎉 Cosmos DB setup completed successfully!"
echo ""
echo "📋 Connection Details:"
echo "   Endpoint: $COSMOS_ENDPOINT"
echo "   Database: $DATABASE_NAME"
echo "   Containers: ContentVectors, ContentEmbeddings, SearchHistory"
echo ""
echo "🔧 Update your .env file with these values:"
echo "COSMOS_DB_ENDPOINT=$COSMOS_ENDPOINT"
echo "COSMOS_DB_KEY=$COSMOS_KEY"
echo "COSMOS_DB_DATABASE_NAME=$DATABASE_NAME"
echo ""
echo "✅ Your Cosmos DB is ready for production use!"
