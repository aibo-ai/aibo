import { OnModuleInit } from '@nestjs/common';
export declare class KeyVaultService implements OnModuleInit {
    private readonly logger;
    private secretClient;
    private keyVaultUrl;
    private isInitialized;
    private cachedSecrets;
    constructor();
    onModuleInit(): Promise<void>;
    private preloadCriticalSecrets;
    getSecret(secretName: string, useCache?: boolean): Promise<string | null>;
    getSecrets(secretNames: string[]): Promise<Record<string, string | null>>;
    isKeyVaultAvailable(): boolean;
}
