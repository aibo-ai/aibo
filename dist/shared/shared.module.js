"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const azure_ai_service_1 = require("./services/azure-ai.service");
const cosmos_db_service_1 = require("./services/cosmos-db.service");
const claude_ai_service_1 = require("./services/claude-ai.service");
const external_apis_service_1 = require("./services/external-apis.service");
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
        ],
        providers: [
            azure_ai_service_1.AzureAIService,
            cosmos_db_service_1.CosmosDBService,
            claude_ai_service_1.ClaudeAIService,
            external_apis_service_1.ExternalApisService,
        ],
        exports: [
            azure_ai_service_1.AzureAIService,
            cosmos_db_service_1.CosmosDBService,
            claude_ai_service_1.ClaudeAIService,
            external_apis_service_1.ExternalApisService,
        ],
    })
], SharedModule);
//# sourceMappingURL=shared.module.js.map