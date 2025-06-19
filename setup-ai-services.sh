#!/bin/bash
# Setup script for Azure AI services for Query Intent Analyzer

echo "Setting up Azure AI services for Query Intent Analyzer..."

# Variables from .env file
RESOURCE_GROUP="marketing-rg"
LOCATION="eastus2"
AI_SERVICE_NAME="aibo-ai-resource"
OPENAI_DEPLOYMENT_NAME="gpt-4o"
EMBEDDINGS_DEPLOYMENT_NAME="text-embedding-ada-002"
SEARCH_SERVICE_NAME="aibo-search"

# Check if Azure AI service exists
echo "Checking if Azure AI service exists..."
az cognitiveservices account show --name $AI_SERVICE_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Creating Azure AI service..."
  az cognitiveservices account create --name $AI_SERVICE_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --kind OpenAI --sku S0
else
  echo "Azure AI service already exists."
fi

# Deploy GPT-4o model
echo "Deploying GPT-4o model..."
az cognitiveservices account deployment create \
  --name $AI_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --deployment-name $OPENAI_DEPLOYMENT_NAME \
  --model-name "gpt-4o" \
  --model-version "2024-05-13" \
  --model-format OpenAI \
  --sku-name "Standard" \
  --sku-capacity 1

# Deploy text embeddings model
echo "Deploying text embeddings model..."
az cognitiveservices account deployment create \
  --name $AI_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --deployment-name $EMBEDDINGS_DEPLOYMENT_NAME \
  --model-name "text-embedding-ada-002" \
  --model-version "2" \
  --model-format OpenAI \
  --sku-name "Standard" \
  --sku-capacity 1

# Create Azure AI Search service
echo "Creating Azure AI Search service..."
az search service create \
  --name $SEARCH_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Basic

echo "Azure AI services setup complete!"
