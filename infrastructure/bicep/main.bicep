// Main Bicep template for Content Creation Platform infrastructure
// This template deploys the complete Azure infrastructure

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Project name used for resource naming')
param projectName string = 'content-platform'

@description('Database administrator login name')
param administratorLogin string

@description('Database administrator password')
@secure()
param administratorLoginPassword string

@description('Number of AKS nodes')
@minValue(1)
@maxValue(10)
param aksNodeCount int = 3

@description('AKS node VM size')
param aksNodeVmSize string = 'Standard_D2s_v3'

@description('Enable monitoring and observability stack')
param enableMonitoring bool = true

@description('Enable security features')
param enableSecurity bool = true

// Variables
var resourcePrefix = '${projectName}-${environment}'
var tags = {
  Environment: environment
  Project: projectName
  ManagedBy: 'Bicep'
  CostCenter: 'Engineering'
}

// Networking module
module networking 'modules/networking.bicep' = {
  name: 'networking-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Monitoring module
module monitoring 'modules/monitoring.bicep' = if (enableMonitoring) {
  name: 'monitoring-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Security module
module security 'modules/security.bicep' = if (enableSecurity) {
  name: 'security-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Storage module
module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Container Registry module
module containerRegistry 'modules/container-registry.bicep' = {
  name: 'acr-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Database module
module database 'modules/database.bicep' = {
  name: 'database-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    subnetId: networking.outputs.databaseSubnetId
  }
}

// Cache module
module cache 'modules/cache.bicep' = {
  name: 'cache-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Cosmos DB module
module cosmosDb 'modules/cosmos-db.bicep' = {
  name: 'cosmosdb-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Service Bus module
module serviceBus 'modules/service-bus.bicep' = {
  name: 'servicebus-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
  }
}

// Azure Functions module
module functions 'modules/functions.bicep' = {
  name: 'functions-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
    storageAccountName: storage.outputs.storageAccountName
    appInsightsInstrumentationKey: enableMonitoring ? monitoring.outputs.appInsightsInstrumentationKey : ''
    appInsightsConnectionString: enableMonitoring ? monitoring.outputs.appInsightsConnectionString : ''
  }
}

// AKS module
module aks 'modules/aks.bicep' = {
  name: 'aks-deployment'
  params: {
    resourcePrefix: resourcePrefix
    location: location
    tags: tags
    nodeCount: aksNodeCount
    nodeVmSize: aksNodeVmSize
    subnetId: networking.outputs.aksSubnetId
    logAnalyticsWorkspaceId: enableMonitoring ? monitoring.outputs.logAnalyticsWorkspaceId : ''
  }
}

// RBAC assignments for AKS to ACR
module aksAcrRbac 'modules/rbac.bicep' = {
  name: 'aks-acr-rbac'
  params: {
    principalId: aks.outputs.kubeletIdentityObjectId
    roleDefinitionId: '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull role
    scope: containerRegistry.outputs.acrId
  }
}

// Outputs
output aksClusterName string = aks.outputs.aksClusterName
output acrLoginServer string = containerRegistry.outputs.acrLoginServer
output appInsightsInstrumentationKey string = enableMonitoring ? monitoring.outputs.appInsightsInstrumentationKey : ''
output appInsightsConnectionString string = enableMonitoring ? monitoring.outputs.appInsightsConnectionString : ''
output keyVaultUri string = enableSecurity ? security.outputs.keyVaultUri : ''
output storageAccountName string = storage.outputs.storageAccountName
output postgreSqlServerName string = database.outputs.postgreSqlServerName
output redisCacheName string = cache.outputs.redisCacheName
output cosmosDbAccountName string = cosmosDb.outputs.cosmosDbAccountName
output serviceBusNamespaceName string = serviceBus.outputs.serviceBusNamespaceName
output functionAppName string = functions.outputs.functionAppName
