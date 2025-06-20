# Technical SEO Validator - Container Deployment Guide

## Overview

This guide explains how to deploy the Technical SEO Validator as a containerized service using Azure Container Instances. This approach solves the Puppeteer/Chrome compatibility issues encountered with Azure Functions.

## Architecture

- **Service**: Express.js web server hosting the SEO validation logic
- **Container**: Docker container with Node.js 22 and Chrome/Puppeteer pre-installed
- **Hosting**: Azure Container Instances for serverless container deployment
- **Registry**: Azure Container Registry for storing Docker images

## Prerequisites

1. Azure CLI installed and logged in
2. Docker installed (for building images)
3. Azure subscription with Container Registry and Container Instances providers registered

## Deployment Steps

### 1. Register Azure Providers (if not already done)

```bash
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.ContainerInstance
```

### 2. Create Azure Container Registry

```bash
az acr create --resource-group ContentArchitectRG --name contentarchitectacr --sku Basic --admin-enabled true
```

### 3. Build Docker Image

On a machine with Docker installed:

```bash
cd azure-functions/TechnicalSeoValidator
docker build -t technical-seo-validator:latest .
```

### 4. Push to Azure Container Registry

```bash
# Get ACR credentials
ACR_LOGIN_SERVER=$(az acr show --name contentarchitectacr --query "loginServer" -o tsv)
ACR_USERNAME=$(az acr credential show --name contentarchitectacr --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name contentarchitectacr --query "passwords[0].value" -o tsv)

# Login to ACR
docker login $ACR_LOGIN_SERVER -u $ACR_USERNAME -p $ACR_PASSWORD

# Tag and push image
docker tag technical-seo-validator:latest $ACR_LOGIN_SERVER/technical-seo-validator:latest
docker push $ACR_LOGIN_SERVER/technical-seo-validator:latest
```

### 5. Deploy Container Instance

Using the provided YAML configuration:

```bash
az container create --resource-group ContentArchitectRG --file container-config.yaml
```

Or using the deployment script:

```bash
./deploy-container.sh
```

## API Endpoints

Once deployed, the service will be available at:

- **Health Check**: `http://ca-seo-validator.eastus.azurecontainer.io:8080/health`
- **Validation API**: `http://ca-seo-validator.eastus.azurecontainer.io:8080/api/validate`

## API Usage

### Request Format

```json
POST /api/validate
Content-Type: application/json

{
  "html": "<html>...</html>",
  "contentType": "text/html",
  "validateSemanticHtml": true,
  "validateAccessibility": true,
  "validateHeadingStructure": true,
  "validateMetaTags": true,
  "validateImages": true,
  "validateLinks": true,
  "validateMobileFriendly": true,
  "validatePageSpeed": true,
  "validateStructuredData": true,
  "validateSocialTags": true
}
```

### Response Format

```json
{
  "id": "uuid",
  "url": "html-content",
  "contentType": "text/html",
  "validatedAt": "2025-06-20T10:30:00Z",
  "score": {
    "overall": 85,
    "accessibility": 80,
    "semanticStructure": 90,
    "mobileFriendly": 85
  },
  "metrics": {
    "totalIssues": 10,
    "criticalIssues": 1,
    "highIssues": 2,
    "mediumIssues": 3,
    "lowIssues": 4
  },
  "issues": [...],
  "recommendations": [...]
}
```

## Testing

Use the provided test script:

```bash
node test-container.js
```

## Monitoring

View container logs:

```bash
az container logs --resource-group ContentArchitectRG --name ca-seo-validator-container
```

Check container status:

```bash
az container show --resource-group ContentArchitectRG --name ca-seo-validator-container --query instanceView.state
```

## Troubleshooting

1. **Container fails to start**: Check logs for errors
2. **Puppeteer errors**: Ensure Chrome dependencies are installed in Dockerfile
3. **Memory issues**: Increase memory allocation in container configuration
4. **Network issues**: Verify DNS name and port configuration

## Security Considerations

1. The container runs without authentication by default
2. Consider adding API key authentication for production use
3. Use HTTPS with Azure Application Gateway for secure communication
4. Regularly update base images and dependencies

## Cost Optimization

- Container Instances are billed per second of execution
- Consider using Azure Container Apps for better scaling and cost efficiency
- Monitor resource usage and adjust CPU/memory as needed
