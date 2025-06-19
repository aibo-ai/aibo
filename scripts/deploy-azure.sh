#!/bin/bash
# Azure Deployment Script for Content Architect
# This script automates the deployment of the Azure resources and functions for Content Architect

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
  echo -e "${BLUE}Loading environment variables from .env file${NC}"
  source .env
else
  echo -e "${YELLOW}No .env file found. Using existing environment variables.${NC}"
  echo -e "${YELLOW}Make sure all required Azure variables are set in your environment.${NC}"
fi

# Check required environment variables
required_vars=(
  "AZURE_TENANT_ID"
  "AZURE_CLIENT_ID" 
  "AZURE_CLIENT_SECRET" 
  "AZURE_SUBSCRIPTION_ID"
  "AZURE_RESOURCE_GROUP"
  "AZURE_LOCATION"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}Error: Required environment variable $var is not set.${NC}"
    exit 1
  fi
done

# Login to Azure
echo -e "${GREEN}Logging in to Azure...${NC}"
az login --service-principal \
  --username "$AZURE_CLIENT_ID" \
  --password "$AZURE_CLIENT_SECRET" \
  --tenant "$AZURE_TENANT_ID"

echo -e "${GREEN}Setting active subscription...${NC}"
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Create resource group if it doesn't exist
echo -e "${GREEN}Checking if resource group exists...${NC}"
if ! az group show --name "$AZURE_RESOURCE_GROUP" &> /dev/null; then
  echo -e "${YELLOW}Resource group does not exist. Creating...${NC}"
  az group create --name "$AZURE_RESOURCE_GROUP" --location "$AZURE_LOCATION"
else
  echo -e "${GREEN}Resource group already exists.${NC}"
fi

# Deploy ARM template
echo -e "${GREEN}Deploying ARM template...${NC}"
deployment_name="content-architect-deployment-$(date +%Y%m%d%H%M%S)"
az deployment group create \
  --name "$deployment_name" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --template-file "./infrastructure/azure-deploy.json" \
  --parameters location="$AZURE_LOCATION"

echo -e "${GREEN}ARM template deployment completed.${NC}"
echo -e "${GREEN}Deployment name: $deployment_name${NC}"

# Get outputs from deployment
echo -e "${GREEN}Retrieving deployment outputs...${NC}"
outputs=$(az deployment group show \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$deployment_name" \
  --query "properties.outputs" -o json)

# Extract key values from outputs
function_app_name=$(echo "$outputs" | jq -r '.functionAppName.value')
app_service_name=$(echo "$outputs" | jq -r '.appServiceName.value')
cosmos_db_name=$(echo "$outputs" | jq -r '.cosmosDbAccountName.value')
search_service_name=$(echo "$outputs" | jq -r '.searchServiceName.value')

echo -e "${BLUE}Function App: $function_app_name${NC}"
echo -e "${BLUE}App Service: $app_service_name${NC}"
echo -e "${BLUE}Cosmos DB: $cosmos_db_name${NC}"
echo -e "${BLUE}Search Service: $search_service_name${NC}"

# Deploy Azure Functions
echo -e "${GREEN}Deploying Azure Functions...${NC}"
azure_functions_dir="./azure-functions"

# Check if each function directory exists and deploy
function_dirs=(
  "QueryIntentAnalyzer"
  "FreshnessAggregator"
  "ContentChunker"
  "VectorStore"
  "ContentOptimizer"
  "AuthoritySignalsAnalyzer"
)

for func_dir in "${function_dirs[@]}"; do
  full_func_dir="$azure_functions_dir/$func_dir"
  if [ -d "$full_func_dir" ]; then
    echo -e "${GREEN}Deploying function: $func_dir${NC}"
    
    # Install dependencies if package.json exists
    if [ -f "$full_func_dir/package.json" ]; then
      echo -e "${BLUE}Installing dependencies for $func_dir${NC}"
      (cd "$full_func_dir" && npm install --production)
    fi
    
    # Deploy the function
    echo -e "${BLUE}Deploying $func_dir to Azure Functions...${NC}"
    func azure functionapp publish "$function_app_name" --typescript --javascript --force --cwd "$full_func_dir"
  else
    echo -e "${YELLOW}Function directory $full_func_dir not found. Skipping.${NC}"
  fi
done

# Deploy Logic App workflow
echo -e "${GREEN}Deploying Logic App workflow...${NC}"
workflow_file="./infrastructure/logic-app-workflow.json"
if [ -f "$workflow_file" ]; then
  # Get Logic App name from outputs or use default
  logic_app_name=$(echo "$outputs" | jq -r '.logicAppName.value // "contentarchitect-workflow"')
  
  az logic workflow create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$logic_app_name" \
    --definition "$workflow_file"
    
  echo -e "${GREEN}Logic App workflow deployed successfully.${NC}"
else
  echo -e "${YELLOW}Logic App workflow file not found. Skipping.${NC}"
fi

# Update frontend .env with new endpoints
echo -e "${GREEN}Updating frontend environment configuration...${NC}"
frontend_env="./client/.env.production"

# Create or update frontend .env file
function_app_url=$(az functionapp show \
  --name "$function_app_name" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query "defaultHostName" -o tsv)

function_app_key=$(az functionapp keys list \
  --name "$function_app_name" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query "functionKeys.default" -o tsv)

logic_app_url=$(az logic workflow show \
  --name "$logic_app_name" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query "accessEndpoint" -o tsv 2>/dev/null || echo "https://$logic_app_name.azurewebsites.net")

# Write to frontend .env.production file
cat > "$frontend_env" << EOF
# Production environment configuration for Content Architect frontend
REACT_APP_ENVIRONMENT=production

# Azure Function endpoints
REACT_APP_AZURE_FUNCTIONS_ENDPOINT=https://$function_app_url/api
REACT_APP_AZURE_FUNCTIONS_KEY=$function_app_key

# Logic App endpoint
REACT_APP_AZURE_LOGIC_APP_ENDPOINT=$logic_app_url
EOF

echo -e "${GREEN}Frontend environment configuration updated successfully.${NC}"
echo -e "${YELLOW}IMPORTANT: Make sure to securely store function and API keys.${NC}"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Build and deploy the frontend application${NC}"
echo -e "${BLUE}2. Verify all Azure services are up and running${NC}"
echo -e "${BLUE}3. Update any necessary application configurations${NC}"
echo -e "${BLUE}4. Perform end-to-end testing${NC}"

# Get all relevant endpoints and save to a file
echo -e "${GREEN}Saving service endpoints to deployment-info.json...${NC}"
cat > "./deployment-info.json" << EOF
{
  "deploymentName": "$deployment_name",
  "resourceGroup": "$AZURE_RESOURCE_GROUP",
  "functionApp": {
    "name": "$function_app_name",
    "endpoint": "https://$function_app_url/api"
  },
  "appService": {
    "name": "$app_service_name",
    "endpoint": "https://$app_service_name.azurewebsites.net"
  },
  "cosmosDb": {
    "name": "$cosmos_db_name",
    "endpoint": "https://$cosmos_db_name.documents.azure.com:443/"
  },
  "searchService": {
    "name": "$search_service_name",
    "endpoint": "https://$search_service_name.search.windows.net"
  },
  "logicApp": {
    "name": "$logic_app_name",
    "endpoint": "$logic_app_url"
  },
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo -e "${GREEN}All service endpoints saved to deployment-info.json${NC}"
echo -e "${GREEN}========== Deployment Complete ===========${NC}"
