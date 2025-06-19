import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AzureAIService } from './services/azure-ai.service';
import { CosmosDBService } from './services/cosmos-db.service';
import { ClaudeAIService } from './services/claude-ai.service';
import { ExternalApisService } from './services/external-apis.service';
import { RedisCacheService } from './services/redis-cache.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [
    AzureAIService,
    CosmosDBService,
    ClaudeAIService,
    ExternalApisService,
    RedisCacheService,
  ],
  exports: [
    AzureAIService,
    CosmosDBService,
    ClaudeAIService,
    ExternalApisService,
    RedisCacheService,
  ],
})
export class SharedModule {}
