#!/bin/bash
# Setup script for Content Architect Azure services

echo "Setting up Azure services for Content Architect..."

# Variables from .env file
RESOURCE_GROUP="marketing-rg"
LOCATION="eastus2"
COSMOS_DB_ACCOUNT="aibo"
COSMOS_DB_DATABASE="aibo-vector"
FUNCTION_APP_NAME="content-architect-seo-validator"
AI_SERVICE_NAME="aibo-ai-resource"

# Create resource group if it doesn't exist
echo "Creating resource group $RESOURCE_GROUP if it doesn't exist..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Cosmos DB account if it doesn't exist
echo "Creating Azure Cosmos DB account $COSMOS_DB_ACCOUNT if it doesn't exist..."
az cosmosdb check-name-exists --name $COSMOS_DB_ACCOUNT
if [ $? -ne 0 ]; then
  echo "Creating Cosmos DB account..."
  az cosmosdb create --name $COSMOS_DB_ACCOUNT --resource-group $RESOURCE_GROUP --locations regionName=$LOCATION
else
  echo "Cosmos DB account already exists."
fi

# Create Azure Cosmos DB database if it doesn't exist
echo "Creating Azure Cosmos DB database $COSMOS_DB_DATABASE if it doesn't exist..."
az cosmosdb sql database create --account-name $COSMOS_DB_ACCOUNT --resource-group $RESOURCE_GROUP --name $COSMOS_DB_DATABASE

# Create Cosmos DB containers
echo "Creating Cosmos DB containers..."
CONTAINERS=("generatedContent" "contentChunks" "authoritySignals" "projects" "queryAnalytics" "optimizationHistory" "freshContent" "queryIntents" "contentStrategies")

for CONTAINER in "${CONTAINERS[@]}"; do
  echo "Creating container $CONTAINER..."
  az cosmosdb sql container create --account-name $COSMOS_DB_ACCOUNT --database-name $COSMOS_DB_DATABASE --name $CONTAINER --resource-group $RESOURCE_GROUP --partition-key-path "/id"
done

# Create Azure AI service
echo "Creating Azure AI service $AI_SERVICE_NAME if it doesn't exist..."
az cognitiveservices account show --name $AI_SERVICE_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating Azure AI service..."
  az cognitiveservices account create --name $AI_SERVICE_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --kind OpenAI --sku S0
else
  echo "Azure AI service already exists."
fi

# Create Azure Function App for Technical SEO Validator
echo "Creating Azure Function App $FUNCTION_APP_NAME if it doesn't exist..."
az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating storage account for Function App..."
  STORAGE_ACCOUNT="${FUNCTION_APP_NAME//-/}storage"
  az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS
  
  echo "Creating Function App..."
  az functionapp create --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --storage-account $STORAGE_ACCOUNT --consumption-plan-location $LOCATION --runtime node --functions-version 4
else
  echo "Azure Function App already exists."
fi

echo "Setup complete! Please deploy your Azure Functions code using the Azure Functions Core Tools or VS Code extension."
