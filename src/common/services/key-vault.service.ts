import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import * as dotenv from 'dotenv';

/**
 * Service for managing Azure Key Vault integration
 * Used for securely retrieving secrets at runtime
 */
@Injectable()
export class KeyVaultService implements OnModuleInit {
  private readonly logger = new Logger(KeyVaultService.name);
  private secretClient: SecretClient | null = null;
  private keyVaultUrl: string;
  private isInitialized = false;
  private cachedSecrets: Map<string, string> = new Map();

  constructor() {
    // Load basic environment variables
    dotenv.config();
    this.keyVaultUrl = process.env.AZURE_KEY_VAULT_URL || '';
  }

  /**
   * Initialize the Key Vault client when the module starts
   */
  async onModuleInit() {
    if (!this.keyVaultUrl) {
      this.logger.warn('AZURE_KEY_VAULT_URL is not defined. Key Vault integration is disabled.');
      return;
    }

    try {
      // Azure SDK will use DefaultAzureCredential which supports multiple authentication methods
      const credential = new DefaultAzureCredential();
      this.secretClient = new SecretClient(this.keyVaultUrl, credential);
      this.isInitialized = true;
      this.logger.log('Azure Key Vault client initialized successfully');
      
      // Preload critical secrets if needed
      await this.preloadCriticalSecrets();
    } catch (error) {
      this.logger.error(`Failed to initialize Azure Key Vault client: ${error.message}`);
    }
  }

  /**
   * Preload frequently used secrets to reduce latency
   * and handle potential connectivity issues
   */
  private async preloadCriticalSecrets() {
    // List of critical secret names to preload
    const criticalSecrets = [
      'AZURE-OPENAI-KEY',
      'AZURE-SEARCH-KEY',
      'AZURE-COSMOS-KEY',
      'AZURE-LANGUAGE-KEY',
      'AZURE-REDIS-KEY',
    ];

    try {
      for (const secretName of criticalSecrets) {
        await this.getSecret(secretName);
      }
      this.logger.log('Critical secrets preloaded successfully');
    } catch (error) {
      this.logger.warn(`Failed to preload some critical secrets: ${error.message}`);
    }
  }

  /**
   * Get a secret from Azure Key Vault
   * @param secretName Name of the secret in Key Vault (note: use dashes instead of underscores)
   * @param useCache Whether to use cached value (default: true)
   * @returns Secret value or null if not available
   */
  async getSecret(secretName: string, useCache = true): Promise<string | null> {
    // Convert underscores to dashes for Key Vault naming conventions
    const formattedName = secretName.replace(/_/g, '-').toUpperCase();
    
    // Return from cache if available and cache use is requested
    if (useCache && this.cachedSecrets.has(formattedName)) {
      return this.cachedSecrets.get(formattedName) || null;
    }
    
    // If Key Vault is not initialized, return null
    if (!this.isInitialized || !this.secretClient) {
      this.logger.warn(`Key Vault not initialized when requesting secret: ${formattedName}`);
      return null;
    }
    
    try {
      const secret = await this.secretClient.getSecret(formattedName);
      const secretValue = secret.value || '';
      
      // Cache the secret
      this.cachedSecrets.set(formattedName, secretValue);
      
      return secretValue;
    } catch (error) {
      this.logger.error(`Error retrieving secret ${formattedName}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get multiple secrets at once
   * @param secretNames Array of secret names to retrieve
   * @returns Object mapping secret names to their values
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    await Promise.all(
      secretNames.map(async (name) => {
        results[name] = await this.getSecret(name);
      })
    );
    
    return results;
  }
  
  /**
   * Check if Key Vault integration is initialized
   * @returns True if Key Vault client is initialized
   */
  isKeyVaultAvailable(): boolean {
    return this.isInitialized;
  }
}
