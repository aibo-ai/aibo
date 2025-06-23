# Variables for Content Creation Platform Terraform configuration

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "East US"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "content-platform"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "administrator_login" {
  description = "Database administrator login name"
  type        = string
  default     = "dbadmin"
  validation {
    condition     = length(var.administrator_login) >= 4 && length(var.administrator_login) <= 16
    error_message = "Administrator login must be between 4 and 16 characters."
  }
}

variable "administrator_password" {
  description = "Database administrator password (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
  validation {
    condition = var.administrator_password == "" || (
      length(var.administrator_password) >= 8 &&
      can(regex("[A-Z]", var.administrator_password)) &&
      can(regex("[a-z]", var.administrator_password)) &&
      can(regex("[0-9]", var.administrator_password)) &&
      can(regex("[^A-Za-z0-9]", var.administrator_password))
    )
    error_message = "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character."
  }
}

variable "aks_node_count" {
  description = "Number of AKS nodes"
  type        = number
  default     = 3
  validation {
    condition     = var.aks_node_count >= 1 && var.aks_node_count <= 10
    error_message = "AKS node count must be between 1 and 10."
  }
}

variable "aks_node_vm_size" {
  description = "AKS node VM size"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "enable_monitoring" {
  description = "Enable monitoring and observability stack"
  type        = bool
  default     = true
}

variable "enable_security" {
  description = "Enable security features (Key Vault, etc.)"
  type        = bool
  default     = true
}

variable "create_dns_zone" {
  description = "Create DNS zone for the application"
  type        = bool
  default     = false
}

variable "dns_zone_name" {
  description = "DNS zone name (required if create_dns_zone is true)"
  type        = string
  default     = ""
}

# Database configuration
variable "database_sku_name" {
  description = "Database SKU name"
  type        = string
  default     = "Standard_B2s"
}

variable "database_storage_gb" {
  description = "Database storage size in GB"
  type        = number
  default     = 128
  validation {
    condition     = var.database_storage_gb >= 32 && var.database_storage_gb <= 16384
    error_message = "Database storage must be between 32 GB and 16 TB."
  }
}

variable "database_backup_retention_days" {
  description = "Database backup retention in days"
  type        = number
  default     = 7
  validation {
    condition     = var.database_backup_retention_days >= 7 && var.database_backup_retention_days <= 35
    error_message = "Backup retention must be between 7 and 35 days."
  }
}

# Redis configuration
variable "redis_sku_name" {
  description = "Redis SKU name"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.redis_sku_name)
    error_message = "Redis SKU must be Basic, Standard, or Premium."
  }
}

variable "redis_family" {
  description = "Redis family"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Redis capacity"
  type        = number
  default     = 1
  validation {
    condition     = var.redis_capacity >= 0 && var.redis_capacity <= 6
    error_message = "Redis capacity must be between 0 and 6."
  }
}

# Container Registry configuration
variable "acr_sku" {
  description = "Container Registry SKU"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

variable "acr_admin_enabled" {
  description = "Enable admin user for Container Registry"
  type        = bool
  default     = true
}

# Storage configuration
variable "storage_account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Standard", "Premium"], var.storage_account_tier)
    error_message = "Storage account tier must be Standard or Premium."
  }
}

variable "storage_account_replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "LRS"
  validation {
    condition     = contains(["LRS", "GRS", "RAGRS", "ZRS", "GZRS", "RAGZRS"], var.storage_account_replication_type)
    error_message = "Invalid storage replication type."
  }
}

# Cosmos DB configuration
variable "cosmos_db_offer_type" {
  description = "Cosmos DB offer type"
  type        = string
  default     = "Standard"
}

variable "cosmos_db_consistency_level" {
  description = "Cosmos DB consistency level"
  type        = string
  default     = "Session"
  validation {
    condition = contains([
      "BoundedStaleness",
      "Eventual",
      "Session",
      "Strong",
      "ConsistentPrefix"
    ], var.cosmos_db_consistency_level)
    error_message = "Invalid Cosmos DB consistency level."
  }
}

variable "cosmos_db_enable_serverless" {
  description = "Enable Cosmos DB serverless"
  type        = bool
  default     = true
}

# Service Bus configuration
variable "service_bus_sku" {
  description = "Service Bus SKU"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.service_bus_sku)
    error_message = "Service Bus SKU must be Basic, Standard, or Premium."
  }
}

# Application Gateway configuration
variable "app_gateway_sku_name" {
  description = "Application Gateway SKU name"
  type        = string
  default     = "Standard_v2"
}

variable "app_gateway_sku_tier" {
  description = "Application Gateway SKU tier"
  type        = string
  default     = "Standard_v2"
}

variable "app_gateway_capacity" {
  description = "Application Gateway capacity"
  type        = number
  default     = 2
  validation {
    condition     = var.app_gateway_capacity >= 1 && var.app_gateway_capacity <= 125
    error_message = "Application Gateway capacity must be between 1 and 125."
  }
}

# Log Analytics configuration
variable "log_analytics_retention_days" {
  description = "Log Analytics retention in days"
  type        = number
  default     = 30
  validation {
    condition     = var.log_analytics_retention_days >= 30 && var.log_analytics_retention_days <= 730
    error_message = "Log Analytics retention must be between 30 and 730 days."
  }
}

# Key Vault configuration
variable "key_vault_sku_name" {
  description = "Key Vault SKU name"
  type        = string
  default     = "standard"
  validation {
    condition     = contains(["standard", "premium"], var.key_vault_sku_name)
    error_message = "Key Vault SKU must be standard or premium."
  }
}

variable "key_vault_soft_delete_retention_days" {
  description = "Key Vault soft delete retention in days"
  type        = number
  default     = 90
  validation {
    condition     = var.key_vault_soft_delete_retention_days >= 7 && var.key_vault_soft_delete_retention_days <= 90
    error_message = "Key Vault soft delete retention must be between 7 and 90 days."
  }
}

# Network configuration
variable "vnet_address_space" {
  description = "Virtual network address space"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_address_prefixes" {
  description = "Subnet address prefixes"
  type = object({
    default_subnet              = string
    aks_subnet                 = string
    database_subnet            = string
    functions_subnet           = string
    private_endpoints_subnet   = string
    application_gateway_subnet = string
  })
  default = {
    default_subnet              = "10.0.1.0/24"
    aks_subnet                 = "10.0.2.0/23"
    database_subnet            = "10.0.4.0/24"
    functions_subnet           = "10.0.5.0/24"
    private_endpoints_subnet   = "10.0.6.0/24"
    application_gateway_subnet = "10.0.7.0/24"
  }
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
