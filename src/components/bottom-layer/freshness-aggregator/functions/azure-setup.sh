#!/bin/bash

# Azure CLI Setup Script for Freshness Aggregator Function
# This script sets up all required Azure resources for the Freshness Aggregator function

set -e  # Exit on any error

# Configuration variables
RESOURCE_GROUP="freshness-aggregator-rg"
LOCATION="eastus"
FUNCTION_APP_NAME="freshness-aggregator-func"
STORAGE_ACCOUNT_NAME="freshnessstorage$(date +%s)"
COSMOS_ACCOUNT_NAME="freshness-cosmos-$(date +%s)"
COSMOS_DATABASE_NAME="freshness-aggregator"
COSMOS_CONTAINER_NAME="cache"
KEY_VAULT_NAME="freshness-kv-$(date +%s)"
APP_INSIGHTS_NAME="freshness-insights"
APP_SERVICE_PLAN_NAME="freshness-plan"

echo "=== Azure Freshness Aggregator Setup ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Function App: $FUNCTION_APP_NAME"
echo "Storage Account: $STORAGE_ACCOUNT_NAME"
echo "Cosmos Account: $COSMOS_ACCOUNT_NAME"
echo "Key Vault: $KEY_VAULT_NAME"
echo "App Insights: $APP_INSIGHTS_NAME"
echo ""

# Check if user is logged in to Azure
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please log in to Azure first:"
    az login
fi

# Get current user info for Key Vault access policy
CURRENT_USER=$(az account show --query user.name -o tsv)
echo "Current user: $CURRENT_USER"

# Create resource group
echo "Creating resource group..."
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION

# Create storage account for Azure Functions
echo "Creating storage account..."
az storage account create \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2

# Create Application Insights
echo "Creating Application Insights..."
az monitor app-insights component create \
    --app $APP_INSIGHTS_NAME \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP \
    --kind web

# Get Application Insights connection string
APP_INSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
    --app $APP_INSIGHTS_NAME \
    --resource-group $RESOURCE_GROUP \
    --query connectionString -o tsv)

echo "Application Insights connection string: $APP_INSIGHTS_CONNECTION_STRING"

# Create Cosmos DB account
echo "Creating Cosmos DB account..."
az cosmosdb create \
    --name $COSMOS_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --kind GlobalDocumentDB \
    --default-consistency-level Session \
    --enable-automatic-failover false \
    --enable-multiple-write-locations false

# Create Cosmos DB database
echo "Creating Cosmos DB database..."
az cosmosdb sql database create \
    --account-name $COSMOS_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP \
    --name $COSMOS_DATABASE_NAME

# Create Cosmos DB container with TTL enabled
echo "Creating Cosmos DB container..."
az cosmosdb sql container create \
    --account-name $COSMOS_ACCOUNT_NAME \
    --database-name $COSMOS_DATABASE_NAME \
    --resource-group $RESOURCE_GROUP \
    --name $COSMOS_CONTAINER_NAME \
    --partition-key-path "/key" \
    --throughput 400 \
    --ttl 3600

# Get Cosmos DB connection string
COSMOS_CONNECTION_STRING=$(az cosmosdb keys list \
    --name $COSMOS_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP \
    --type connection-strings \
    --query 'connectionStrings[0].connectionString' -o tsv)

echo "Cosmos DB connection string obtained"

# Create Key Vault
echo "Creating Key Vault..."
az keyvault create \
    --name $KEY_VAULT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku standard

# Set Key Vault access policy for current user
echo "Setting Key Vault access policy..."
az keyvault set-policy \
    --name $KEY_VAULT_NAME \
    --upn $CURRENT_USER \
    --secret-permissions get list set delete

# Store Cosmos DB connection string in Key Vault
echo "Storing Cosmos DB connection string in Key Vault..."
az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "cosmos-db-connection" \
    --value "$COSMOS_CONNECTION_STRING"

# Create App Service Plan (Consumption plan for serverless)
echo "Creating App Service Plan..."
az functionapp plan create \
    --name $APP_SERVICE_PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Y1 \
    --is-linux

# Create Function App
echo "Creating Function App..."
az functionapp create \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN_NAME \
    --storage-account $STORAGE_ACCOUNT_NAME \
    --runtime node \
    --runtime-version 18 \
    --functions-version 4 \
    --os-type Linux

# Configure Function App settings
echo "Configuring Function App settings..."
az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        "KEY_VAULT_URL=https://$KEY_VAULT_NAME.vault.azure.net/" \
        "COSMOS_DB_ID=$COSMOS_DATABASE_NAME" \
        "COSMOS_CONTAINER_ID=$COSMOS_CONTAINER_NAME" \
        "APPLICATIONINSIGHTS_CONNECTION_STRING=$APP_INSIGHTS_CONNECTION_STRING" \
        "CACHE_TTL_SECONDS=3600" \
        "NODE_ENV=production"

# Enable system-assigned managed identity for Function App
echo "Enabling managed identity for Function App..."
FUNCTION_PRINCIPAL_ID=$(az functionapp identity assign \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query principalId -o tsv)

echo "Function App managed identity: $FUNCTION_PRINCIPAL_ID"

# Grant Function App access to Key Vault
echo "Granting Function App access to Key Vault..."
az keyvault set-policy \
    --name $KEY_VAULT_NAME \
    --object-id $FUNCTION_PRINCIPAL_ID \
    --secret-permissions get list

# Grant Function App access to Cosmos DB
echo "Granting Function App access to Cosmos DB..."
az cosmosdb sql role assignment create \
    --account-name $COSMOS_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP \
    --scope "/" \
    --principal-id $FUNCTION_PRINCIPAL_ID \
    --role-definition-id "00000000-0000-0000-0000-000000000002"  # Cosmos DB Built-in Data Contributor

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Resource Details:"
echo "- Resource Group: $RESOURCE_GROUP"
echo "- Function App: $FUNCTION_APP_NAME"
echo "- Function App URL: https://$FUNCTION_APP_NAME.azurewebsites.net"
echo "- Storage Account: $STORAGE_ACCOUNT_NAME"
echo "- Cosmos DB Account: $COSMOS_ACCOUNT_NAME"
echo "- Key Vault: $KEY_VAULT_NAME"
echo "- Key Vault URL: https://$KEY_VAULT_NAME.vault.azure.net/"
echo "- Application Insights: $APP_INSIGHTS_NAME"
echo ""
echo "Next Steps:"
echo "1. Deploy your function code using: func azure functionapp publish $FUNCTION_APP_NAME"
echo "2. Test your function at: https://$FUNCTION_APP_NAME.azurewebsites.net/api/freshness-aggregator"
echo "3. Monitor your function in Application Insights"
echo ""
echo "Environment Variables Set:"
echo "- KEY_VAULT_URL=https://$KEY_VAULT_NAME.vault.azure.net/"
echo "- COSMOS_DB_ID=$COSMOS_DATABASE_NAME"
echo "- COSMOS_CONTAINER_ID=$COSMOS_CONTAINER_NAME"
echo "- APPLICATIONINSIGHTS_CONNECTION_STRING=[Set]"
echo "- CACHE_TTL_SECONDS=3600"
echo ""

# Save configuration to file for reference
cat > azure-config.json << EOF
{
  "resourceGroup": "$RESOURCE_GROUP",
  "location": "$LOCATION",
  "functionApp": "$FUNCTION_APP_NAME",
  "functionAppUrl": "https://$FUNCTION_APP_NAME.azurewebsites.net",
  "storageAccount": "$STORAGE_ACCOUNT_NAME",
  "cosmosAccount": "$COSMOS_ACCOUNT_NAME",
  "cosmosDatabase": "$COSMOS_DATABASE_NAME",
  "cosmosContainer": "$COSMOS_CONTAINER_NAME",
  "keyVault": "$KEY_VAULT_NAME",
  "keyVaultUrl": "https://$KEY_VAULT_NAME.vault.azure.net/",
  "appInsights": "$APP_INSIGHTS_NAME",
  "appServicePlan": "$APP_SERVICE_PLAN_NAME"
}
EOF

echo "Configuration saved to azure-config.json"
echo ""
echo "Setup completed successfully! 🎉"
