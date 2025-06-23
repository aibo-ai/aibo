# Outputs for Content Creation Platform Terraform configuration

# Resource Group
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# Networking
output "vnet_id" {
  description = "ID of the virtual network"
  value       = module.networking.vnet_id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = module.networking.vnet_name
}

output "subnet_ids" {
  description = "Map of subnet IDs"
  value = {
    default_subnet              = module.networking.default_subnet_id
    aks_subnet                 = module.networking.aks_subnet_id
    database_subnet            = module.networking.database_subnet_id
    functions_subnet           = module.networking.functions_subnet_id
    private_endpoints_subnet   = module.networking.private_endpoints_subnet_id
    application_gateway_subnet = module.networking.application_gateway_subnet_id
  }
}

output "application_gateway_public_ip" {
  description = "Public IP address of the Application Gateway"
  value       = azurerm_public_ip.app_gateway.ip_address
}

output "application_gateway_fqdn" {
  description = "FQDN of the Application Gateway"
  value       = azurerm_public_ip.app_gateway.fqdn
}

# AKS
output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = module.aks.aks_cluster_name
}

output "aks_cluster_id" {
  description = "ID of the AKS cluster"
  value       = module.aks.aks_cluster_id
}

output "aks_cluster_fqdn" {
  description = "FQDN of the AKS cluster"
  value       = module.aks.aks_cluster_fqdn
}

output "aks_node_resource_group" {
  description = "Resource group containing AKS nodes"
  value       = module.aks.node_resource_group
}

output "kubelet_identity" {
  description = "Kubelet managed identity"
  value = {
    client_id = module.aks.kubelet_identity_client_id
    object_id = module.aks.kubelet_identity_object_id
  }
  sensitive = true
}

# Container Registry
output "acr_login_server" {
  description = "Login server URL for the Container Registry"
  value       = module.container_registry.acr_login_server
}

output "acr_id" {
  description = "ID of the Container Registry"
  value       = module.container_registry.acr_id
}

output "acr_admin_username" {
  description = "Admin username for the Container Registry"
  value       = module.container_registry.acr_admin_username
  sensitive   = true
}

# Database
output "postgresql_server_name" {
  description = "Name of the PostgreSQL server"
  value       = module.database.postgresql_server_name
}

output "postgresql_server_fqdn" {
  description = "FQDN of the PostgreSQL server"
  value       = module.database.postgresql_server_fqdn
}

output "postgresql_database_name" {
  description = "Name of the PostgreSQL database"
  value       = module.database.postgresql_database_name
}

# Cache
output "redis_cache_name" {
  description = "Name of the Redis cache"
  value       = module.cache.redis_cache_name
}

output "redis_cache_hostname" {
  description = "Hostname of the Redis cache"
  value       = module.cache.redis_cache_hostname
}

output "redis_cache_port" {
  description = "Port of the Redis cache"
  value       = module.cache.redis_cache_port
}

# Storage
output "storage_account_name" {
  description = "Name of the storage account"
  value       = module.storage.storage_account_name
}

output "storage_account_primary_endpoint" {
  description = "Primary endpoint of the storage account"
  value       = module.storage.storage_account_primary_endpoint
}

# Cosmos DB
output "cosmos_db_account_name" {
  description = "Name of the Cosmos DB account"
  value       = module.cosmos_db.cosmos_db_account_name
}

output "cosmos_db_endpoint" {
  description = "Endpoint of the Cosmos DB account"
  value       = module.cosmos_db.cosmos_db_endpoint
}

# Service Bus
output "service_bus_namespace_name" {
  description = "Name of the Service Bus namespace"
  value       = module.service_bus.service_bus_namespace_name
}

output "service_bus_namespace_connection_string" {
  description = "Connection string for the Service Bus namespace"
  value       = module.service_bus.service_bus_namespace_connection_string
  sensitive   = true
}

# Azure Functions
output "function_app_name" {
  description = "Name of the Function App"
  value       = module.functions.function_app_name
}

output "function_app_default_hostname" {
  description = "Default hostname of the Function App"
  value       = module.functions.function_app_default_hostname
}

# Monitoring (if enabled)
output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = var.enable_monitoring ? module.monitoring.log_analytics_workspace_id : null
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = var.enable_monitoring ? module.monitoring.app_insights_instrumentation_key : null
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Connection string for Application Insights"
  value       = var.enable_monitoring ? module.monitoring.app_insights_connection_string : null
  sensitive   = true
}

# Security (if enabled)
output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = var.enable_security ? module.security.key_vault_id : null
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = var.enable_security ? module.security.key_vault_uri : null
}

# DNS (if enabled)
output "dns_zone_name" {
  description = "Name of the DNS zone"
  value       = var.create_dns_zone ? azurerm_dns_zone.main[0].name : null
}

output "dns_zone_name_servers" {
  description = "Name servers for the DNS zone"
  value       = var.create_dns_zone ? azurerm_dns_zone.main[0].name_servers : null
}

# Connection Strings and URLs
output "database_connection_string" {
  description = "Connection string for the PostgreSQL database"
  value       = "postgresql://${var.administrator_login}:${var.administrator_password != "" ? var.administrator_password : random_password.db_password[0].result}@${module.database.postgresql_server_fqdn}:5432/${module.database.postgresql_database_name}?sslmode=require"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Connection string for Redis cache"
  value       = "redis://:${module.cache.redis_cache_primary_access_key}@${module.cache.redis_cache_hostname}:${module.cache.redis_cache_port}/0?ssl=true"
  sensitive   = true
}

# Environment Configuration
output "environment_config" {
  description = "Environment configuration for applications"
  value = {
    environment                = var.environment
    location                  = var.location
    resource_group_name       = azurerm_resource_group.main.name
    aks_cluster_name         = module.aks.aks_cluster_name
    acr_login_server         = module.container_registry.acr_login_server
    storage_account_name     = module.storage.storage_account_name
    function_app_name        = module.functions.function_app_name
    service_bus_namespace    = module.service_bus.service_bus_namespace_name
    cosmos_db_account        = module.cosmos_db.cosmos_db_account_name
    application_gateway_ip   = azurerm_public_ip.app_gateway.ip_address
  }
}

# Kubernetes Configuration
output "kubeconfig_raw" {
  description = "Raw kubeconfig for the AKS cluster"
  value       = module.aks.kubeconfig_raw
  sensitive   = true
}

# Resource Tags
output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}
