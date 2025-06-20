#!/bin/bash

# Deploy Technical SEO Validator to Azure Container Instance
# This script creates an Azure Container Instance using a pre-built Docker image with Puppeteer support

# Variables
RESOURCE_GROUP="ContentArchitectRG"
CONTAINER_NAME="ca-seo-validator-container"
LOCATION="eastus"
DNS_NAME_LABEL="ca-seo-validator"
IMAGE="mcr.microsoft.com/playwright:v1.40.0-focal"  # Microsoft's Playwright image with browser support

echo "Deploying Technical SEO Validator to Azure Container Instance..."
echo "============================================================"

# Create Azure Container Instance
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $IMAGE \
  --dns-name-label $DNS_NAME_LABEL \
  --ports 8080 \
  --cpu 2 \
  --memory 4 \
  --os-type Linux \
  --environment-variables \
    NODE_ENV=production \
    PORT=8080 \
    PUPPETEER_EXECUTABLE_PATH="/ms-playwright/chromium-1060/chrome-linux/chrome"

# Get the FQDN
FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query "ipAddress.fqdn" -o tsv)

echo ""
echo "Container deployment complete!"
echo "Container FQDN: $FQDN"
echo "Next steps:"
echo "1. Copy your application files to the container"
echo "2. Install dependencies and start your application"
echo "3. Access your application at http://$FQDN:8080"
