"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyVaultService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyVaultService = void 0;
const common_1 = require("@nestjs/common");
const identity_1 = require("@azure/identity");
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const dotenv = require("dotenv");
let KeyVaultService = KeyVaultService_1 = class KeyVaultService {
    constructor() {
        this.logger = new common_1.Logger(KeyVaultService_1.name);
        this.secretClient = null;
        this.isInitialized = false;
        this.cachedSecrets = new Map();
        dotenv.config();
        this.keyVaultUrl = process.env.AZURE_KEY_VAULT_URL || '';
    }
    async onModuleInit() {
        if (!this.keyVaultUrl) {
            this.logger.warn('AZURE_KEY_VAULT_URL is not defined. Key Vault integration is disabled.');
            return;
        }
        try {
            const credential = new identity_1.DefaultAzureCredential();
            this.secretClient = new keyvault_secrets_1.SecretClient(this.keyVaultUrl, credential);
            this.isInitialized = true;
            this.logger.log('Azure Key Vault client initialized successfully');
            await this.preloadCriticalSecrets();
        }
        catch (error) {
            this.logger.error(`Failed to initialize Azure Key Vault client: ${error.message}`);
        }
    }
    async preloadCriticalSecrets() {
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
        }
        catch (error) {
            this.logger.warn(`Failed to preload some critical secrets: ${error.message}`);
        }
    }
    async getSecret(secretName, useCache = true) {
        const formattedName = secretName.replace(/_/g, '-').toUpperCase();
        if (useCache && this.cachedSecrets.has(formattedName)) {
            return this.cachedSecrets.get(formattedName) || null;
        }
        if (!this.isInitialized || !this.secretClient) {
            this.logger.warn(`Key Vault not initialized when requesting secret: ${formattedName}`);
            return null;
        }
        try {
            const secret = await this.secretClient.getSecret(formattedName);
            const secretValue = secret.value || '';
            this.cachedSecrets.set(formattedName, secretValue);
            return secretValue;
        }
        catch (error) {
            this.logger.error(`Error retrieving secret ${formattedName}: ${error.message}`);
            return null;
        }
    }
    async getSecrets(secretNames) {
        const results = {};
        await Promise.all(secretNames.map(async (name) => {
            results[name] = await this.getSecret(name);
        }));
        return results;
    }
    isKeyVaultAvailable() {
        return this.isInitialized;
    }
};
exports.KeyVaultService = KeyVaultService;
exports.KeyVaultService = KeyVaultService = KeyVaultService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], KeyVaultService);
//# sourceMappingURL=key-vault.service.js.map