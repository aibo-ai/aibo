# Content Architect - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Content Architect system to production environments using Docker, Kubernetes, and Azure cloud services.

## Prerequisites

### Required Tools
- Docker Desktop 4.0+
- kubectl 1.24+
- Azure CLI 2.40+
- Node.js 18+
- Terraform 1.0+ (optional, for infrastructure as code)

### Azure Services Required
- Azure Kubernetes Service (AKS)
- Azure Service Bus
- Azure Functions
- Azure Application Insights
- Azure Container Registry (ACR)
- Azure Key Vault
- Azure Database for PostgreSQL (optional)
- Azure Redis Cache (optional)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Load Balancer                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Azure Kubernetes Service                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Content API    │  │  Orchestrator   │  │  Layer       │ │
│  │  (NestJS)       │  │  Services       │  │  Services    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Azure Service Bus                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Azure Functions                              │
│            (Content Job Processor)                          │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Infrastructure Setup

### 1.1 Create Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create --name content-architect-prod --location eastus

# Create Azure Container Registry
az acr create --resource-group content-architect-prod \
  --name contentarchitectacr --sku Standard

# Create AKS cluster
az aks create \
  --resource-group content-architect-prod \
  --name content-architect-aks \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-addons monitoring \
  --attach-acr contentarchitectacr \
  --generate-ssh-keys

# Create Service Bus namespace
az servicebus namespace create \
  --resource-group content-architect-prod \
  --name content-architect-sb \
  --sku Standard

# Create Service Bus queue
az servicebus queue create \
  --resource-group content-architect-prod \
  --namespace-name content-architect-sb \
  --name content-jobs

# Create Application Insights
az monitor app-insights component create \
  --app content-architect-insights \
  --location eastus \
  --resource-group content-architect-prod

# Create Key Vault
az keyvault create \
  --name content-architect-kv \
  --resource-group content-architect-prod \
  --location eastus
```

### 1.2 Configure Key Vault Secrets

```bash
# Store sensitive configuration in Key Vault
az keyvault secret set --vault-name content-architect-kv \
  --name "ServiceBusConnectionString" \
  --value "$(az servicebus namespace authorization-rule keys list \
    --resource-group content-architect-prod \
    --namespace-name content-architect-sb \
    --name RootManageSharedAccessKey \
    --query primaryConnectionString -o tsv)"

az keyvault secret set --vault-name content-architect-kv \
  --name "ApplicationInsightsConnectionString" \
  --value "$(az monitor app-insights component show \
    --app content-architect-insights \
    --resource-group content-architect-prod \
    --query connectionString -o tsv)"

# Add other secrets (API keys, database connections, etc.)
az keyvault secret set --vault-name content-architect-kv \
  --name "MozApiKey" --value "your-moz-api-key"

az keyvault secret set --vault-name content-architect-kv \
  --name "AhrefsApiKey" --value "your-ahrefs-api-key"

az keyvault secret set --vault-name content-architect-kv \
  --name "AzureAIFoundryApiKey" --value "your-azure-ai-api-key"
```

## Step 2: Container Images

### 2.1 Create Dockerfiles

**Main Application Dockerfile:**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]
```

**Azure Functions Dockerfile:**
```dockerfile
# azure-functions/Dockerfile
FROM mcr.microsoft.com/azure-functions/node:4-node18

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY . /home/site/wwwroot

RUN cd /home/site/wwwroot && \
    npm install
```

### 2.2 Build and Push Images

```bash
# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name contentarchitectacr \
  --resource-group content-architect-prod \
  --query loginServer --output tsv)

# Login to ACR
az acr login --name contentarchitectacr

# Build and push main application
docker build -t $ACR_LOGIN_SERVER/content-architect:latest .
docker push $ACR_LOGIN_SERVER/content-architect:latest

# Build and push Azure Functions
cd azure-functions
docker build -t $ACR_LOGIN_SERVER/content-job-processor:latest .
docker push $ACR_LOGIN_SERVER/content-job-processor:latest
```

## Step 3: Kubernetes Deployment

### 3.1 Configure kubectl

```bash
# Get AKS credentials
az aks get-credentials --resource-group content-architect-prod \
  --name content-architect-aks
```

### 3.2 Create Kubernetes Manifests

**Namespace:**
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: content-architect
```

**ConfigMap:**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: content-architect-config
  namespace: content-architect
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  CITATION_CACHE_ENABLED: "true"
  CITATION_CACHE_TTL_MINUTES: "1440"
  CITATION_CACHE_MAX_SIZE: "10000"
  JOB_MAX_RETRIES: "3"
```

**Secret (using Azure Key Vault):**
```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: content-architect-secrets
  namespace: content-architect
type: Opaque
data:
  # These will be populated by Azure Key Vault CSI driver
  service-bus-connection: ""
  app-insights-connection: ""
  moz-api-key: ""
  ahrefs-api-key: ""
  azure-ai-api-key: ""
```

**Deployment:**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: content-architect-api
  namespace: content-architect
spec:
  replicas: 3
  selector:
    matchLabels:
      app: content-architect-api
  template:
    metadata:
      labels:
        app: content-architect-api
    spec:
      containers:
      - name: content-architect
        image: contentarchitectacr.azurecr.io/content-architect:latest
        ports:
        - containerPort: 3000
        env:
        - name: AZURE_SERVICE_BUS_CONNECTION_STRING
          valueFrom:
            secretKeyRef:
              name: content-architect-secrets
              key: service-bus-connection
        - name: APPLICATIONINSIGHTS_CONNECTION_STRING
          valueFrom:
            secretKeyRef:
              name: content-architect-secrets
              key: app-insights-connection
        - name: MOZ_API_KEY
          valueFrom:
            secretKeyRef:
              name: content-architect-secrets
              key: moz-api-key
        - name: AHREFS_API_KEY
          valueFrom:
            secretKeyRef:
              name: content-architect-secrets
              key: ahrefs-api-key
        - name: AZURE_AI_FOUNDRY_API_KEY
          valueFrom:
            secretKeyRef:
              name: content-architect-secrets
              key: azure-ai-api-key
        envFrom:
        - configMapRef:
            name: content-architect-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service:**
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: content-architect-service
  namespace: content-architect
spec:
  selector:
    app: content-architect-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Ingress:**
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: content-architect-ingress
  namespace: content-architect
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.contentarchitect.com
    secretName: content-architect-tls
  rules:
  - host: api.contentarchitect.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: content-architect-service
            port:
              number: 80
```

**Horizontal Pod Autoscaler:**
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: content-architect-hpa
  namespace: content-architect
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: content-architect-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 3.3 Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -n content-architect
kubectl get services -n content-architect
kubectl get ingress -n content-architect

# Check logs
kubectl logs -f deployment/content-architect-api -n content-architect
```

## Step 4: Azure Functions Deployment

### 4.1 Create Function App

```bash
# Create storage account for Functions
az storage account create \
  --name contentarchitectstorage \
  --location eastus \
  --resource-group content-architect-prod \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --resource-group content-architect-prod \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name content-job-processor \
  --storage-account contentarchitectstorage \
  --app-insights content-architect-insights
```

### 4.2 Configure Function App Settings

```bash
# Configure app settings
az functionapp config appsettings set \
  --name content-job-processor \
  --resource-group content-architect-prod \
  --settings \
    "ServiceBusConnection=@Microsoft.KeyVault(VaultName=content-architect-kv;SecretName=ServiceBusConnectionString)" \
    "CONTENT_ARCHITECT_API_URL=https://api.contentarchitect.com" \
    "INTERNAL_API_TOKEN=your-secure-internal-token"
```

### 4.3 Deploy Function Code

```bash
# Deploy using Azure Functions Core Tools
cd azure-functions
func azure functionapp publish content-job-processor

# Or deploy using container
az functionapp deployment container config \
  --name content-job-processor \
  --resource-group content-architect-prod \
  --docker-custom-image-name contentarchitectacr.azurecr.io/content-job-processor:latest \
  --docker-registry-server-url https://contentarchitectacr.azurecr.io
```

## Step 5: Monitoring and Observability

### 5.1 Configure Application Insights Dashboards

Create custom dashboards in Azure Portal for:
- API response times and error rates
- Job processing metrics
- Layer performance metrics
- Citation verification success rates
- Resource utilization

### 5.2 Set Up Alerts

```bash
# Create alert rules
az monitor metrics alert create \
  --name "High API Error Rate" \
  --resource-group content-architect-prod \
  --scopes "/subscriptions/{subscription-id}/resourceGroups/content-architect-prod/providers/Microsoft.Insights/components/content-architect-insights" \
  --condition "count 'requests/failed' > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group-ids "/subscriptions/{subscription-id}/resourceGroups/content-architect-prod/providers/microsoft.insights/actionGroups/content-architect-alerts"

# Create action group for notifications
az monitor action-group create \
  --name content-architect-alerts \
  --resource-group content-architect-prod \
  --short-name ca-alerts \
  --email-receivers name=admin email=admin@yourcompany.com
```

## Step 6: Security Configuration

### 6.1 Network Security

```bash
# Configure network security groups
az network nsg create \
  --resource-group content-architect-prod \
  --name content-architect-nsg

# Allow HTTPS traffic
az network nsg rule create \
  --resource-group content-architect-prod \
  --nsg-name content-architect-nsg \
  --name AllowHTTPS \
  --protocol tcp \
  --priority 1000 \
  --destination-port-range 443 \
  --access allow
```

### 6.2 Identity and Access Management

```bash
# Create managed identity for AKS
az aks update \
  --resource-group content-architect-prod \
  --name content-architect-aks \
  --enable-managed-identity

# Grant Key Vault access to AKS
MANAGED_IDENTITY_ID=$(az aks show \
  --resource-group content-architect-prod \
  --name content-architect-aks \
  --query identityProfile.kubeletidentity.clientId -o tsv)

az keyvault set-policy \
  --name content-architect-kv \
  --object-id $MANAGED_IDENTITY_ID \
  --secret-permissions get list
```

## Step 7: Backup and Disaster Recovery

### 7.1 Database Backup (if using PostgreSQL)

```bash
# Enable automated backups
az postgres server update \
  --resource-group content-architect-prod \
  --name content-architect-db \
  --backup-retention 30 \
  --geo-redundant-backup Enabled
```

### 7.2 Application Data Backup

```bash
# Create backup storage account
az storage account create \
  --name contentarchitectbackup \
  --resource-group content-architect-prod \
  --sku Standard_GRS
```

## Step 8: Performance Optimization

### 8.1 CDN Configuration

```bash
# Create CDN profile
az cdn profile create \
  --resource-group content-architect-prod \
  --name content-architect-cdn \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --resource-group content-architect-prod \
  --profile-name content-architect-cdn \
  --name content-architect-api \
  --origin api.contentarchitect.com
```

### 8.2 Redis Cache (Optional)

```bash
# Create Redis cache for session storage and caching
az redis create \
  --resource-group content-architect-prod \
  --name content-architect-cache \
  --location eastus \
  --sku Standard \
  --vm-size c1
```

## Step 9: Deployment Automation

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Build and push Docker image
      run: |
        az acr login --name contentarchitectacr
        docker build -t contentarchitectacr.azurecr.io/content-architect:${{ github.sha }} .
        docker push contentarchitectacr.azurecr.io/content-architect:${{ github.sha }}
    
    - name: Deploy to AKS
      run: |
        az aks get-credentials --resource-group content-architect-prod --name content-architect-aks
        kubectl set image deployment/content-architect-api content-architect=contentarchitectacr.azurecr.io/content-architect:${{ github.sha }} -n content-architect
        kubectl rollout status deployment/content-architect-api -n content-architect
```

## Step 10: Post-Deployment Verification

### 10.1 Health Checks

```bash
# Verify API health
curl https://api.contentarchitect.com/health

# Check Kubernetes pods
kubectl get pods -n content-architect

# Verify Function App
az functionapp show --name content-job-processor --resource-group content-architect-prod
```

### 10.2 Load Testing

```bash
# Install Artillery for load testing
npm install -g artillery

# Create load test configuration
cat > load-test.yml << EOF
config:
  target: 'https://api.contentarchitect.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Content generation test"
    requests:
      - post:
          url: "/content-architect/generate"
          json:
            topic: "Test Topic"
            contentType: "blog_post"
            audience: "b2b"
            async: true
EOF

# Run load test
artillery run load-test.yml
```

## Troubleshooting

### Common Issues

1. **Pod startup failures**: Check resource limits and secrets configuration
2. **Service Bus connection issues**: Verify connection string and permissions
3. **High memory usage**: Adjust resource limits and implement caching
4. **Slow API responses**: Check Application Insights for bottlenecks

### Debug Commands

```bash
# Check pod logs
kubectl logs -f deployment/content-architect-api -n content-architect

# Describe pod for events
kubectl describe pod <pod-name> -n content-architect

# Check resource usage
kubectl top pods -n content-architect

# View Application Insights logs
az monitor app-insights query \
  --app content-architect-insights \
  --analytics-query "requests | where timestamp > ago(1h) | summarize count() by resultCode"
```

## Maintenance

### Regular Tasks

1. **Update container images** with security patches
2. **Monitor resource usage** and scale as needed
3. **Review Application Insights** for performance issues
4. **Backup verification** and disaster recovery testing
5. **Security updates** for Kubernetes and Azure services

### Scaling Guidelines

- **CPU > 70%**: Increase HPA max replicas
- **Memory > 80%**: Increase pod memory limits
- **Queue depth > 100**: Scale Azure Functions
- **Response time > 2s**: Investigate bottlenecks

This deployment guide provides a production-ready setup for the Content Architect system with high availability, security, and monitoring capabilities.
