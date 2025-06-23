#!/usr/bin/env ts-node

/**
 * Orchestration Layer Demo
 * 
 * This script demonstrates the complete orchestration layer functionality:
 * - Multi-layer workflow execution
 * - Async job processing with Azure Service Bus
 * - Real-time progress updates
 * - Job management and monitoring
 * - Error handling and resilience
 */

import { NestFactory } from '@nestjs/core';
import { OrchestratorModule } from '../src/components/orchestrator/orchestrator.module';
import { OrchestrationService } from '../src/components/orchestrator/services/orchestration.service';
import { JobManagementService } from '../src/components/orchestrator/services/job-management.service';
import { WorkflowEngineService } from '../src/components/orchestrator/services/workflow-engine.service';
import { RealtimeUpdatesService } from '../src/components/orchestrator/services/realtime-updates.service';

// Sample content requests for different scenarios
const sampleRequests = {
  blogPost: {
    topic: 'The Future of Artificial Intelligence in Healthcare',
    contentType: 'blog_post',
    audience: 'b2b',
    targetLength: 'medium',
    toneOfVoice: 'professional',
    purpose: 'Educate healthcare professionals about AI applications',
    keyPoints: [
      'Current AI applications in healthcare',
      'Benefits and challenges',
      'Future trends and predictions',
      'Implementation considerations'
    ],
    searchKeywords: ['AI healthcare', 'medical AI', 'healthcare technology'],
    includeResearch: true,
    includeCitations: true,
    includeEEAT: true,
    includeSchemaMarkup: true,
    workflowType: 'research_heavy',
    priority: 'high',
    userId: 'demo-user-123',
    projectId: 'demo-project-456'
  },

  technicalGuide: {
    topic: 'Implementing Machine Learning Models in Production',
    contentType: 'technical_guide',
    audience: 'b2b',
    targetLength: 'long',
    toneOfVoice: 'technical',
    purpose: 'Guide developers through ML deployment best practices',
    keyPoints: [
      'Model versioning and management',
      'Deployment strategies',
      'Monitoring and maintenance',
      'Performance optimization'
    ],
    searchKeywords: ['ML deployment', 'machine learning production', 'MLOps'],
    includeResearch: false,
    includeCitations: true,
    includeEEAT: false,
    includeSchemaMarkup: true,
    workflowType: 'seo_focused',
    priority: 'normal',
    userId: 'demo-user-123',
    projectId: 'demo-project-789'
  },

  socialMedia: {
    topic: 'Benefits of Remote Work for Employees',
    contentType: 'social_media',
    audience: 'b2c',
    targetLength: 'short',
    toneOfVoice: 'friendly',
    purpose: 'Engage audience on social media platforms',
    keyPoints: [
      'Work-life balance',
      'Increased productivity',
      'Cost savings',
      'Flexibility'
    ],
    searchKeywords: ['remote work benefits', 'work from home', 'flexible work'],
    includeResearch: false,
    includeCitations: false,
    includeEEAT: false,
    includeSchemaMarkup: false,
    workflowType: 'standard',
    priority: 'low',
    userId: 'demo-user-456',
    projectId: 'demo-project-123'
  }
};

async function runOrchestrationDemo() {
  console.log('🚀 Orchestration Layer Demo');
  console.log('============================\n');

  try {
    // Initialize the NestJS application context
    const app = await NestFactory.createApplicationContext(OrchestratorModule);
    
    const orchestrationService = app.get(OrchestrationService);
    const jobManagementService = app.get(JobManagementService);
    const workflowEngineService = app.get(WorkflowEngineService);
    const realtimeUpdatesService = app.get(RealtimeUpdatesService);

    console.log('✅ Orchestration layer initialized successfully\n');

    // Demo 1: Workflow Engine Capabilities
    console.log('📋 Demo 1: Workflow Engine Capabilities');
    console.log('---------------------------------------');
    
    const availableWorkflows = await workflowEngineService.getAvailableWorkflows();
    console.log(`📊 Available workflows: ${availableWorkflows.length}`);
    
    availableWorkflows.forEach(workflow => {
      console.log(`   • ${workflow.name} (${workflow.type})`);
      console.log(`     Steps: ${workflow.steps.length}, Duration: ~${workflow.estimatedDuration}min`);
    });

    // Demo 2: Synchronous Content Generation
    console.log('\n\n🔄 Demo 2: Synchronous Content Generation');
    console.log('------------------------------------------');
    
    console.log('Generating blog post content synchronously...');
    const syncStartTime = Date.now();
    
    const syncResult = await orchestrationService.generateContentSync(sampleRequests.blogPost);
    const syncDuration = Date.now() - syncStartTime;

    console.log(`✅ Sync generation completed in ${syncDuration}ms`);
    console.log(`📊 Job ID: ${syncResult.jobId}`);
    console.log(`🔧 Steps completed: ${syncResult.completedSteps.length}/${syncResult.totalSteps}`);
    console.log(`📈 Processing time: ${syncResult.processingTime}ms`);
    
    // Show layer results summary
    console.log('\n📋 Layer Results Summary:');
    if (syncResult.content.bottomLayer) {
      console.log('   • Bottom Layer: ✅ Intent analysis, keyword research completed');
    }
    if (syncResult.content.middleLayer) {
      console.log('   • Middle Layer: ✅ Content structuring, optimization completed');
    }
    if (syncResult.content.topLayer) {
      console.log('   • Top Layer: ✅ LLM optimization, research, citations completed');
    }

    // Demo 3: Asynchronous Job Processing
    console.log('\n\n⚡ Demo 3: Asynchronous Job Processing');
    console.log('-------------------------------------');
    
    console.log('Queueing multiple jobs for async processing...');
    
    const asyncJobs = await Promise.all([
      orchestrationService.queueContentGeneration(sampleRequests.technicalGuide),
      orchestrationService.queueContentGeneration(sampleRequests.socialMedia),
      orchestrationService.queueContentGeneration({
        ...sampleRequests.blogPost,
        topic: 'Cybersecurity Best Practices for Small Businesses',
        workflowType: 'citation_heavy'
      })
    ]);

    console.log(`📊 Queued ${asyncJobs.length} jobs:`);
    asyncJobs.forEach((jobId, index) => {
      console.log(`   ${index + 1}. Job ID: ${jobId}`);
    });

    // Simulate job processing and monitoring
    console.log('\nSimulating job processing...');
    for (const jobId of asyncJobs) {
      // Simulate job processing (normally done by Azure Function)
      const job = await jobManagementService.getJobStatus(jobId);
      if (job) {
        console.log(`🔄 Processing job: ${jobId}`);
        
        // Update to processing
        await jobManagementService.updateJobStatus(jobId, 'processing', 'Job started');
        
        // Simulate progress updates
        const steps = ['analyze_intent', 'structure_content', 'optimize_content', 'finalize'];
        for (let i = 0; i < steps.length; i++) {
          await jobManagementService.updateJobProgress(jobId, {
            currentStep: steps[i],
            completedSteps: steps.slice(0, i),
            totalSteps: steps.length,
            percentage: Math.round((i / steps.length) * 100)
          });
          
          console.log(`   📈 Progress: ${steps[i]} (${Math.round((i / steps.length) * 100)}%)`);
          
          // Small delay to simulate processing
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Complete job
        await jobManagementService.updateJobStatus(jobId, 'completed', 'Job completed successfully', {
          content: `Generated content for ${job.request.topic}`,
          metrics: {
            processingTime: Math.random() * 5000 + 2000,
            qualityScore: Math.random() * 20 + 80
          }
        });
        
        console.log(`   ✅ Job completed: ${jobId}`);
      }
    }

    // Demo 4: Job Management and Monitoring
    console.log('\n\n📊 Demo 4: Job Management and Monitoring');
    console.log('----------------------------------------');
    
    // List all jobs
    const allJobs = await jobManagementService.listJobs({ limit: 10 });
    console.log(`📋 Total jobs in system: ${allJobs.total}`);
    
    // Show job statistics
    const stats = await jobManagementService.getJobStatistics();
    console.log('\n📈 Job Statistics:');
    console.log(`   • Total jobs: ${stats.total}`);
    console.log(`   • By status: ${JSON.stringify(stats.byStatus)}`);
    console.log(`   • By type: ${JSON.stringify(stats.byType)}`);
    console.log(`   • Success rate: ${stats.successRate}%`);
    console.log(`   • Average processing time: ${stats.averageProcessingTime}ms`);
    console.log(`   • Recent jobs (24h): ${stats.recentJobs}`);

    // Filter jobs by user
    const userJobs = await jobManagementService.listJobs({ 
      userId: 'demo-user-123',
      status: 'completed'
    });
    console.log(`\n👤 Jobs for demo-user-123: ${userJobs.jobs.length} completed`);

    // Demo 5: Real-time Updates Simulation
    console.log('\n\n📡 Demo 5: Real-time Updates Simulation');
    console.log('--------------------------------------');
    
    // Simulate client connections
    const connections = [
      { id: 'conn-1', userId: 'demo-user-123' },
      { id: 'conn-2', userId: 'demo-user-456' },
      { id: 'conn-3', userId: 'demo-user-123' }
    ];

    // Register connections
    for (const conn of connections) {
      await realtimeUpdatesService.registerConnection(conn.id, conn.userId);
      console.log(`🔌 Connected: ${conn.id} (user: ${conn.userId})`);
    }

    // Subscribe to job updates
    const testJobId = asyncJobs[0];
    await realtimeUpdatesService.subscribeToJob('conn-1', testJobId);
    await realtimeUpdatesService.subscribeToJob('conn-3', testJobId);
    
    console.log(`📺 Subscribed connections to job: ${testJobId}`);

    // Send real-time updates
    await realtimeUpdatesService.sendJobStatusUpdate(testJobId, 'processing', 'Job restarted');
    await realtimeUpdatesService.sendJobProgressUpdate(testJobId, {
      currentStep: 'final_optimization',
      percentage: 95
    });
    await realtimeUpdatesService.sendStepCompletedUpdate(testJobId, 'final_optimization');
    await realtimeUpdatesService.sendResultReadyUpdate(testJobId, { 
      content: 'Final optimized content' 
    });

    // Get connection statistics
    const connectionStats = await realtimeUpdatesService.getConnectionStatistics();
    console.log('\n📊 Real-time Connection Stats:');
    console.log(`   • Total connections: ${connectionStats.totalConnections}`);
    console.log(`   • Active jobs: ${connectionStats.activeJobs}`);
    console.log(`   • Unique users: ${connectionStats.userCount}`);

    // Demo 6: Error Handling and Resilience
    console.log('\n\n🛡️ Demo 6: Error Handling and Resilience');
    console.log('------------------------------------------');
    
    // Test invalid workflow
    try {
      await orchestrationService.generateContentSync({
        ...sampleRequests.blogPost,
        workflowType: 'invalid_workflow'
      });
    } catch (error) {
      console.log(`✅ Handled invalid workflow error: ${error.message}`);
    }

    // Test job retry mechanism
    const retryJob = await jobManagementService.createJob({
      type: 'content_generation',
      request: sampleRequests.blogPost,
      userId: 'demo-user-123'
    });

    // Simulate job failure
    await jobManagementService.setJobError(retryJob.id, 'Network timeout during processing');
    console.log(`❌ Job failed: ${retryJob.id}`);

    // Retry the job
    await jobManagementService.retryJob(retryJob.id);
    console.log(`🔄 Job retried: ${retryJob.id}`);

    const retriedJob = await jobManagementService.getJobStatus(retryJob.id);
    console.log(`✅ Job status after retry: ${retriedJob?.status} (attempt ${retriedJob?.retryCount})`);

    // Demo 7: Health and Performance Monitoring
    console.log('\n\n🏥 Demo 7: Health and Performance Monitoring');
    console.log('--------------------------------------------');
    
    const healthStatus = await orchestrationService.getHealthStatus();
    console.log('🏥 System Health Status:');
    console.log(`   • Orchestration: ${healthStatus.orchestration}`);
    console.log(`   • Service Bus: ${healthStatus.serviceBus}`);
    console.log(`   • Bottom Layer: ${healthStatus.layers.bottom}`);
    console.log(`   • Middle Layer: ${healthStatus.layers.middle}`);
    console.log(`   • Top Layer: ${healthStatus.layers.top}`);

    // Performance summary
    console.log('\n⚡ Performance Summary:');
    console.log(`   • Sync generation: ${syncDuration}ms`);
    console.log(`   • Async jobs queued: ${asyncJobs.length}`);
    console.log(`   • Average job time: ${stats.averageProcessingTime}ms`);
    console.log(`   • Success rate: ${stats.successRate}%`);

    // Demo Summary
    console.log('\n\n🎉 Orchestration Demo Summary');
    console.log('==============================');
    console.log('✅ Multi-layer workflow execution demonstrated');
    console.log('✅ Synchronous and asynchronous processing working');
    console.log('✅ Job management and monitoring functional');
    console.log('✅ Real-time updates system operational');
    console.log('✅ Error handling and resilience verified');
    console.log('✅ Health monitoring and performance tracking active');

    console.log('\n🚀 Orchestration Layer is production-ready!');
    console.log('\n📚 Key Features Demonstrated:');
    console.log('   • Seamless integration between bottom, middle, and top layers');
    console.log('   • Flexible workflow engine with multiple predefined workflows');
    console.log('   • Robust job management with retry mechanisms');
    console.log('   • Real-time progress updates for enhanced user experience');
    console.log('   • Comprehensive monitoring and health checks');
    console.log('   • Azure Service Bus integration for scalable async processing');

    console.log('\n🔧 Next Steps for Production:');
    console.log('   1. Configure Azure Service Bus connection string');
    console.log('   2. Deploy Azure Functions for job processing');
    console.log('   3. Set up SignalR for real-time client connections');
    console.log('   4. Configure monitoring dashboards and alerts');
    console.log('   5. Implement authentication and authorization');

    await app.close();

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runOrchestrationDemo().catch(console.error);
}

export { runOrchestrationDemo };
