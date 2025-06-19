"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const key_vault_service_1 = require("./common/services/key-vault.service");
const application_insights_service_1 = require("./common/services/application-insights.service");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    logger.log('Starting Content Architect application...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true }));
    app.enableCors();
    const config = new swagger_1.DocumentBuilder()
        .setTitle('ContentArchitect API')
        .setDescription('API documentation for the ContentArchitect content generation system')
        .setVersion('1.0')
        .addTag('content')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    try {
        const keyVaultService = app.get(key_vault_service_1.KeyVaultService);
        await keyVaultService.onModuleInit();
        logger.log('Key Vault service initialized');
    }
    catch (error) {
        logger.warn(`Key Vault initialization skipped: ${error.message}`);
    }
    try {
        const appInsightsService = app.get(application_insights_service_1.ApplicationInsightsService);
        await appInsightsService.onModuleInit();
        logger.log('Application Insights service initialized');
        appInsightsService.trackEvent('ApplicationStartup', {
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0'
        });
    }
    catch (error) {
        logger.warn(`Application Insights initialization skipped: ${error.message}`);
    }
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
    const gracefulShutdown = async () => {
        logger.log('Graceful shutdown initiated...');
        try {
            const appInsightsService = app.get(application_insights_service_1.ApplicationInsightsService);
            if (appInsightsService === null || appInsightsService === void 0 ? void 0 : appInsightsService.isAppInsightsAvailable()) {
                appInsightsService.trackEvent('ApplicationShutdown');
                await appInsightsService.flush();
                logger.log('Application Insights telemetry flushed');
            }
        }
        catch (error) {
            logger.error(`Error during shutdown: ${error.message}`);
        }
        await app.close();
        logger.log('Application shutdown complete');
        process.exit(0);
    };
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}
bootstrap();
//# sourceMappingURL=main.js.map