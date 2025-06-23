# Main Terraform configuration for Content Creation Platform
# This configuration deploys the complete Azure infrastructure

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration for state management
  backend "azurerm" {
    # These values should be provided via backend config file or environment variables
    # resource_group_name  = "terraform-state-rg"
    # storage_account_name = "terraformstate"
    # container_name       = "tfstate"
    # key                  = "content-platform.terraform.tfstate"
  }
}

# Configure the Azure Provider
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Local values
locals {
  resource_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${local.resource_prefix}-rg"
  location = var.location
  tags     = local.common_tags
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
  
  enable_monitoring = var.enable_monitoring
}

# Security Module
module "security" {
  source = "./modules/security"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
  
  tenant_id = data.azurerm_client_config.current.tenant_id
  enable_security = var.enable_security
}

# Storage Module
module "storage" {
  source = "./modules/storage"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
}

# Container Registry Module
module "container_registry" {
  source = "./modules/container-registry"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
  
  administrator_login    = var.administrator_login
  administrator_password = var.administrator_password
  subnet_id             = module.networking.database_subnet_id
}

# Cache Module
module "cache" {
  source = "./modules/cache"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
}

# Cosmos DB Module
module "cosmos_db" {
  source = "./modules/cosmos-db"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
}

# Service Bus Module
module "service_bus" {
  source = "./modules/service-bus"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
}

# Azure Functions Module
module "functions" {
  source = "./modules/functions"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
  
  storage_account_name                = module.storage.storage_account_name
  storage_account_primary_access_key  = module.storage.storage_account_primary_access_key
  app_insights_instrumentation_key    = var.enable_monitoring ? module.monitoring.app_insights_instrumentation_key : ""
  app_insights_connection_string      = var.enable_monitoring ? module.monitoring.app_insights_connection_string : ""
  subnet_id                          = module.networking.functions_subnet_id
}

# AKS Module
module "aks" {
  source = "./modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  resource_prefix    = local.resource_prefix
  tags              = local.common_tags
  
  node_count                    = var.aks_node_count
  node_vm_size                 = var.aks_node_vm_size
  subnet_id                    = module.networking.aks_subnet_id
  log_analytics_workspace_id   = var.enable_monitoring ? module.monitoring.log_analytics_workspace_id : null
}

# RBAC assignment for AKS to pull from ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = module.container_registry.acr_id
  role_definition_name = "AcrPull"
  principal_id         = module.aks.kubelet_identity_object_id
}

# Random password for database if not provided
resource "random_password" "db_password" {
  count   = var.administrator_password == "" ? 1 : 0
  length  = 16
  special = true
}

# Store secrets in Key Vault if security is enabled
resource "azurerm_key_vault_secret" "db_password" {
  count        = var.enable_security ? 1 : 0
  name         = "database-admin-password"
  value        = var.administrator_password != "" ? var.administrator_password : random_password.db_password[0].result
  key_vault_id = module.security.key_vault_id

  depends_on = [module.security]
}

resource "azurerm_key_vault_secret" "acr_admin_password" {
  count        = var.enable_security ? 1 : 0
  name         = "acr-admin-password"
  value        = module.container_registry.acr_admin_password
  key_vault_id = module.security.key_vault_id

  depends_on = [module.security]
}

# Application Gateway for ingress
resource "azurerm_public_ip" "app_gateway" {
  name                = "${local.resource_prefix}-agw-pip"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  allocation_method   = "Static"
  sku                = "Standard"
  tags               = local.common_tags

  domain_name_label = "${local.resource_prefix}-agw"
}

resource "azurerm_application_gateway" "main" {
  name                = "${local.resource_prefix}-agw"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  tags               = local.common_tags

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "appGatewayIpConfig"
    subnet_id = module.networking.application_gateway_subnet_id
  }

  frontend_port {
    name = "appGatewayFrontendPort80"
    port = 80
  }

  frontend_port {
    name = "appGatewayFrontendPort443"
    port = 443
  }

  frontend_ip_configuration {
    name                 = "appGatewayFrontendIP"
    public_ip_address_id = azurerm_public_ip.app_gateway.id
  }

  backend_address_pool {
    name = "appGatewayBackendPool"
  }

  backend_http_settings {
    name                  = "appGatewayBackendHttpSettings"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 20
  }

  http_listener {
    name                           = "appGatewayHttpListener"
    frontend_ip_configuration_name = "appGatewayFrontendIP"
    frontend_port_name             = "appGatewayFrontendPort80"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "rule1"
    rule_type                  = "Basic"
    http_listener_name         = "appGatewayHttpListener"
    backend_address_pool_name  = "appGatewayBackendPool"
    backend_http_settings_name = "appGatewayBackendHttpSettings"
    priority                   = 1
  }

  autoscale_configuration {
    min_capacity = 1
    max_capacity = 10
  }
}

# DNS Zone (optional)
resource "azurerm_dns_zone" "main" {
  count               = var.create_dns_zone ? 1 : 0
  name                = var.dns_zone_name
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

# A record for Application Gateway
resource "azurerm_dns_a_record" "app_gateway" {
  count               = var.create_dns_zone ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main[0].name
  resource_group_name = azurerm_resource_group.main.name
  ttl                 = 300
  records             = [azurerm_public_ip.app_gateway.ip_address]
  tags                = local.common_tags
}

# CNAME record for www
resource "azurerm_dns_cname_record" "www" {
  count               = var.create_dns_zone ? 1 : 0
  name                = "www"
  zone_name           = azurerm_dns_zone.main[0].name
  resource_group_name = azurerm_resource_group.main.name
  ttl                 = 300
  record              = azurerm_dns_zone.main[0].name
  tags                = local.common_tags
}
