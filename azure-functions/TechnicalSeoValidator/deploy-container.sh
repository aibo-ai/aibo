#!/bin/bash

# Azure Container deployment script for Technical SEO Validator

# Variables
RESOURCE_GROUP="ContentArchitectRG"
ACR_NAME="contentarchitectacr"
CONTAINER_NAME="technical-seo-validator"
IMAGE_NAME="technical-seo-validator"
IMAGE_TAG="latest"
CONTAINER_INSTANCE_NAME="ca-seo-validator-container"

echo "Technical SEO Validator Container Deployment Script"
echo "=================================================="

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Please login to Azure first using: az login"
    exit 1
fi

# Create Azure Container Registry if it doesn't exist
echo "Checking if ACR exists..."
ACR_EXISTS=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "name" -o tsv 2>/dev/null)
if [ -z "$ACR_EXISTS" ]; then
    echo "Creating Azure Container Registry..."
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true
else
    echo "ACR already exists: $ACR_NAME"
fi

# Get ACR credentials
echo "Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query "loginServer" -o tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Build and push using ACR Tasks (no local Docker needed)
echo ""
echo "Building and pushing Docker image using Azure Container Registry Tasks..."
echo "=================================================="

# Build and push the image using ACR Tasks
echo "Running ACR build task..."
az acr build --registry $ACR_NAME --image $IMAGE_NAME:$IMAGE_TAG .

if [ $? -ne 0 ]; then
    echo "Error: Failed to build and push the Docker image."
    exit 1
fi

echo "Image successfully built and pushed to: $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG"
echo ""

# Create container instance
echo "Creating Azure Container Instance..."
az container create \
    --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_INSTANCE_NAME \
    --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG \
    --os-type Linux \
    --cpu 2 \
    --memory 4 \
    --registry-login-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --dns-name-label ca-seo-validator \
    --ports 8080 \
    --environment-variables NODE_ENV=production \
    --restart-policy OnFailure

# Get container details
echo ""
echo "Container deployment complete!"
echo "Getting container details..."
FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_INSTANCE_NAME --query "ipAddress.fqdn" -o tsv)
echo "Container FQDN: $FQDN"
echo "Health check URL: http://$FQDN:8080/health"
echo "API endpoint: http://$FQDN:8080/api/validate"
