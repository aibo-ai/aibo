import { NestFactory } from '@nestjs/core';
import { AppMinimalModule } from './app.minimal.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppMinimalModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Content Architect API - Minimal')
    .setDescription('Minimal API for orchestration layer testing')
    .setVersion('1.0')
    .addTag('bottom-layer', 'Bottom Layer Services')
    .addTag('middle-layer', 'Middle Layer Services')
    .addTag('top-layer', 'Top Layer Services')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0-minimal',
      environment: process.env.NODE_ENV || 'development',
      layers: ['bottom', 'middle', 'top'],
      orchestration: 'ready'
    });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Content Architect Minimal API running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
  console.log(`🔍 Health Check: http://localhost:${port}/health`);
  console.log(`🏗️ Orchestration Layers: Bottom, Middle, Top`);
  console.log(`🎯 Ready for orchestration calls from frontend!`);
}

bootstrap().catch(err => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
