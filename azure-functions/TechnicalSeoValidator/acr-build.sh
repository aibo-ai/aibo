#!/bin/bash

# Azure Container Registry Build Script
# This builds the Docker image directly in Azure ACR

RESOURCE_GROUP="ContentArchitectRG"
ACR_NAME="contentarchitectacr"
IMAGE_NAME="technical-seo-validator"
IMAGE_TAG="latest"

echo "Building Technical SEO Validator Docker image in Azure Container Registry..."
echo "============================================================"

# Build the Docker image in ACR
az acr build \
    --registry $ACR_NAME \
    --resource-group $RESOURCE_GROUP \
    --image $IMAGE_NAME:$IMAGE_TAG \
    --file Dockerfile \
    .

echo ""
echo "Build complete! Image is now available at:"
echo "contentarchitectacr.azurecr.io/$IMAGE_NAME:$IMAGE_TAG"
