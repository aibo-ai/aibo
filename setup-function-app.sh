#!/bin/bash
# Setup script for Azure Function App

echo "Setting up Azure Function App for Content Architect..."

# Variables
RESOURCE_GROUP="marketing-rg"
LOCATION="eastus2"
FUNCTION_APP_NAME="content-architect-seo-validator"
STORAGE_ACCOUNT="seovalidatorstorage"

# Create storage account for Function App
echo "Creating storage account for Function App..."
az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS

# Create Function App
echo "Creating Function App..."
az functionapp create --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --storage-account $STORAGE_ACCOUNT --consumption-plan-location $LOCATION --runtime node --functions-version 4

# Configure Function App settings
echo "Configuring Function App settings..."
az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings "WEBSITE_NODE_DEFAULT_VERSION=~18" "FUNCTIONS_WORKER_RUNTIME=node" "WEBSITE_RUN_FROM_PACKAGE=1"

echo "Function App setup complete!"
