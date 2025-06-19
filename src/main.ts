import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { KeyVaultService } from './common/services/key-vault.service';
import { ApplicationInsightsService } from './common/services/application-insights.service';

async function bootstrap() {
  // Create a logger instance for bootstrap process
  const logger = new Logger('Bootstrap');
  
  // Initialize the application
  logger.log('Starting Content Architect application...');
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  // Enable CORS
  app.enableCors();
  
  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ContentArchitect API')
    .setDescription('API documentation for the ContentArchitect content generation system')
    .setVersion('1.0')
    .addTag('content')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Initialize Key Vault for secrets management
  try {
    const keyVaultService = app.get(KeyVaultService);
    await keyVaultService.onModuleInit(); // Ensure it's initialized
    logger.log('Key Vault service initialized');
  } catch (error) {
    logger.warn(`Key Vault initialization skipped: ${error.message}`);
  }

  // Initialize Application Insights for monitoring and telemetry
  try {
    const appInsightsService = app.get(ApplicationInsightsService);
    await appInsightsService.onModuleInit(); // Ensure it's initialized
    logger.log('Application Insights service initialized');
    
    // Track application startup
    appInsightsService.trackEvent('ApplicationStartup', {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    });
  } catch (error) {
    logger.warn(`Application Insights initialization skipped: ${error.message}`);
  }
  
  // Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  
  // Handle graceful shutdown
  const gracefulShutdown = async () => {
    logger.log('Graceful shutdown initiated...');
    
    try {
      const appInsightsService = app.get(ApplicationInsightsService);
      if (appInsightsService?.isAppInsightsAvailable()) {
        appInsightsService.trackEvent('ApplicationShutdown');
        await appInsightsService.flush();
        logger.log('Application Insights telemetry flushed');
      }
    } catch (error) {
      logger.error(`Error during shutdown: ${error.message}`);
    }
    
    await app.close();
    logger.log('Application shutdown complete');
    process.exit(0);
  };
  
  // Listen for termination signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

bootstrap();
