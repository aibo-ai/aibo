// DevOps module for Content Creation Platform
// Creates Container Registry, AKS cluster, and DevOps resources

@description('Resource prefix for naming')
param resourcePrefix string

@description('Location for all resources')
param location string

@description('Resource tags')
param tags object

@description('Log Analytics Workspace ID for monitoring')
param logAnalyticsWorkspaceId string

@description('Kubernetes version')
param kubernetesVersion string = '1.28.3'

@description('Node pool VM size')
param nodeVmSize string = 'Standard_D2s_v3'

@description('Initial node count')
param nodeCount int = 3

@description('Maximum node count for autoscaling')
param maxNodeCount int = 10

@description('Minimum node count for autoscaling')
param minNodeCount int = 1

// Variables
var acrName = replace('${resourcePrefix}acr', '-', '')
var aksName = '${resourcePrefix}-aks'
var aksIdentityName = '${resourcePrefix}-aks-identity'
var keyVaultName = replace('${resourcePrefix}-kv', '-', '')

// Managed Identity for AKS
resource aksIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: aksIdentityName
  location: location
  tags: tags
}

// Azure Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: false
    policies: {
      quarantinePolicy: {
        status: 'enabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'enabled'
      }
      retentionPolicy: {
        days: 30
        status: 'enabled'
      }
    }
    encryption: {
      status: 'disabled'
    }
    dataEndpointEnabled: false
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    zoneRedundancy: 'Disabled'
  }
}

// Key Vault for secrets management
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: aksIdentity.properties.principalId
        permissions: {
          secrets: ['get', 'list']
          certificates: ['get', 'list']
          keys: ['get', 'list']
        }
      }
    ]
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enableRbacAuthorization: false
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// AKS Cluster
resource aksCluster 'Microsoft.ContainerService/managedClusters@2023-10-01' = {
  name: aksName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${aksIdentity.id}': {}
    }
  }
  properties: {
    kubernetesVersion: kubernetesVersion
    dnsPrefix: '${resourcePrefix}-aks'
    agentPoolProfiles: [
      {
        name: 'systempool'
        count: nodeCount
        vmSize: nodeVmSize
        osType: 'Linux'
        mode: 'System'
        enableAutoScaling: true
        minCount: minNodeCount
        maxCount: maxNodeCount
        enableNodePublicIP: false
        availabilityZones: ['1', '2', '3']
        upgradeSettings: {
          maxSurge: '1'
        }
        nodeTaints: [
          'CriticalAddonsOnly=true:NoSchedule'
        ]
      }
      {
        name: 'workerpool'
        count: nodeCount
        vmSize: 'Standard_D4s_v3'
        osType: 'Linux'
        mode: 'User'
        enableAutoScaling: true
        minCount: minNodeCount
        maxCount: maxNodeCount
        enableNodePublicIP: false
        availabilityZones: ['1', '2', '3']
        upgradeSettings: {
          maxSurge: '1'
        }
      }
    ]
    servicePrincipalProfile: {
      clientId: 'msi'
    }
    addonProfiles: {
      azureKeyvaultSecretsProvider: {
        enabled: true
        config: {
          enableSecretRotation: 'true'
          rotationPollInterval: '2m'
        }
      }
      azurepolicy: {
        enabled: true
      }
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspaceId
        }
      }
      ingressApplicationGateway: {
        enabled: false
      }
    }
    nodeResourceGroup: '${resourcePrefix}-aks-nodes-rg'
    enableRBAC: true
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'azure'
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
      loadBalancerSku: 'standard'
      outboundType: 'loadBalancer'
    }
    aadProfile: {
      managed: true
      enableAzureRBAC: true
    }
    autoUpgradeProfile: {
      upgradeChannel: 'patch'
    }
    disableLocalAccounts: true
    securityProfile: {
      workloadIdentity: {
        enabled: true
      }
    }
  }
}

// Role assignment for AKS to pull from ACR
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, aksIdentity.id, 'AcrPull')
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: aksIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output containerRegistryId string = containerRegistry.id
output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output aksClusterId string = aksCluster.id
output aksClusterName string = aksCluster.name
output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output aksIdentityId string = aksIdentity.id
output aksIdentityClientId string = aksIdentity.properties.clientId
