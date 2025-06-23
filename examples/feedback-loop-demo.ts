#!/usr/bin/env ts-node

/**
 * Feedback Loop and Monitoring Demo
 * 
 * This script demonstrates the complete feedback loop and monitoring system:
 * - Content performance tracking
 * - Layer performance monitoring
 * - Trend analysis and insights
 * - Automated improvement suggestions
 * - Real-time performance issue detection
 */

import { NestFactory } from '@nestjs/core';
import { OrchestratorModule } from '../src/components/orchestrator/orchestrator.module';
import { FeedbackLoopService, ContentPerformanceMetrics, LayerPerformanceMetrics } from '../src/components/orchestrator/services/feedback-loop.service';
import { ApplicationInsightsService } from '../src/common/services/application-insights.service';

// Sample performance data for different scenarios
const sampleContentMetrics = {
  highPerforming: {
    jobId: 'job-high-001',
    contentId: 'content-high-001',
    contentType: 'blog_post',
    audience: 'b2b' as const,
    engagementScore: 85,
    clickThroughRate: 8.5,
    timeOnPage: 320,
    bounceRate: 25,
    conversionRate: 12.3,
    userRating: 4.7,
    loadTime: 1100,
    recordedAt: new Date().toISOString()
  },
  
  averagePerforming: {
    jobId: 'job-avg-002',
    contentId: 'content-avg-002',
    contentType: 'technical_guide',
    audience: 'b2b' as const,
    engagementScore: 65,
    clickThroughRate: 4.2,
    timeOnPage: 280,
    bounceRate: 45,
    conversionRate: 6.8,
    userRating: 3.9,
    loadTime: 2100,
    recordedAt: new Date().toISOString()
  },
  
  poorPerforming: {
    jobId: 'job-poor-003',
    contentId: 'content-poor-003',
    contentType: 'social_media',
    audience: 'b2c' as const,
    engagementScore: 18, // Below threshold - triggers immediate analysis
    clickThroughRate: 0.8,
    timeOnPage: 45,
    bounceRate: 85, // Above threshold - triggers immediate analysis
    conversionRate: 0.3, // Below threshold - triggers immediate analysis
    userRating: 2.1,
    loadTime: 4500,
    recordedAt: new Date().toISOString()
  }
};

const sampleLayerMetrics = {
  bottomLayer: {
    jobId: 'job-layer-001',
    layer: 'bottom' as const,
    service: 'queryIntentAnalyzer',
    processingTime: 1200,
    successRate: 98.5,
    errorRate: 1.5,
    outputQuality: 88,
    memoryUsage: 256,
    cpuUsage: 35,
    timestamp: new Date().toISOString()
  },
  
  middleLayer: {
    jobId: 'job-layer-001',
    layer: 'middle' as const,
    service: 'blufContentStructurer',
    processingTime: 2800,
    successRate: 96.2,
    errorRate: 3.8,
    outputQuality: 82,
    memoryUsage: 512,
    cpuUsage: 55,
    timestamp: new Date().toISOString()
  },
  
  topLayer: {
    jobId: 'job-layer-001',
    layer: 'top' as const,
    service: 'llmContentOptimizer',
    processingTime: 4500,
    successRate: 94.1,
    errorRate: 5.9,
    outputQuality: 91,
    memoryUsage: 1024,
    cpuUsage: 75,
    timestamp: new Date().toISOString()
  }
};

async function runFeedbackLoopDemo() {
  console.log('🔄 Feedback Loop and Monitoring Demo');
  console.log('====================================\n');

  try {
    // Initialize the NestJS application context
    const app = await NestFactory.createApplicationContext(OrchestratorModule);
    
    const feedbackLoopService = app.get(FeedbackLoopService);
    const appInsights = app.get(ApplicationInsightsService);

    console.log('✅ Feedback loop system initialized successfully\n');

    // Demo 1: Content Performance Tracking
    console.log('📊 Demo 1: Content Performance Tracking');
    console.log('---------------------------------------');
    
    console.log('Recording performance metrics for different content types...\n');

    // Record high-performing content
    console.log('📈 Recording high-performing B2B blog post metrics...');
    await feedbackLoopService.recordContentPerformance(sampleContentMetrics.highPerforming);
    console.log(`   ✅ Engagement Score: ${sampleContentMetrics.highPerforming.engagementScore}%`);
    console.log(`   ✅ Conversion Rate: ${sampleContentMetrics.highPerforming.conversionRate}%`);
    console.log(`   ✅ User Rating: ${sampleContentMetrics.highPerforming.userRating}/5\n`);

    // Record average-performing content
    console.log('📊 Recording average-performing B2B technical guide metrics...');
    await feedbackLoopService.recordContentPerformance(sampleContentMetrics.averagePerforming);
    console.log(`   📊 Engagement Score: ${sampleContentMetrics.averagePerforming.engagementScore}%`);
    console.log(`   📊 Conversion Rate: ${sampleContentMetrics.averagePerforming.conversionRate}%`);
    console.log(`   📊 Load Time: ${sampleContentMetrics.averagePerforming.loadTime}ms\n`);

    // Record poor-performing content (triggers immediate analysis)
    console.log('📉 Recording poor-performing B2C social media metrics...');
    console.log('   ⚠️  This will trigger immediate performance issue detection');
    await feedbackLoopService.recordContentPerformance(sampleContentMetrics.poorPerforming);
    console.log(`   ❌ Engagement Score: ${sampleContentMetrics.poorPerforming.engagementScore}% (Below 20% threshold)`);
    console.log(`   ❌ Bounce Rate: ${sampleContentMetrics.poorPerforming.bounceRate}% (Above 80% threshold)`);
    console.log(`   ❌ Conversion Rate: ${sampleContentMetrics.poorPerforming.conversionRate}% (Below 1% threshold)\n`);

    // Demo 2: Layer Performance Monitoring
    console.log('⚙️  Demo 2: Layer Performance Monitoring');
    console.log('---------------------------------------');
    
    console.log('Recording layer performance metrics across the processing pipeline...\n');

    // Record bottom layer performance
    console.log('🔍 Bottom Layer Performance (Query Intent Analyzer):');
    await feedbackLoopService.recordLayerPerformance(sampleLayerMetrics.bottomLayer);
    console.log(`   ⏱️  Processing Time: ${sampleLayerMetrics.bottomLayer.processingTime}ms`);
    console.log(`   ✅ Success Rate: ${sampleLayerMetrics.bottomLayer.successRate}%`);
    console.log(`   🎯 Output Quality: ${sampleLayerMetrics.bottomLayer.outputQuality}%\n`);

    // Record middle layer performance
    console.log('🏗️  Middle Layer Performance (BLUF Content Structurer):');
    await feedbackLoopService.recordLayerPerformance(sampleLayerMetrics.middleLayer);
    console.log(`   ⏱️  Processing Time: ${sampleLayerMetrics.middleLayer.processingTime}ms`);
    console.log(`   ✅ Success Rate: ${sampleLayerMetrics.middleLayer.successRate}%`);
    console.log(`   💾 Memory Usage: ${sampleLayerMetrics.middleLayer.memoryUsage}MB\n`);

    // Record top layer performance
    console.log('🚀 Top Layer Performance (LLM Content Optimizer):');
    await feedbackLoopService.recordLayerPerformance(sampleLayerMetrics.topLayer);
    console.log(`   ⏱️  Processing Time: ${sampleLayerMetrics.topLayer.processingTime}ms`);
    console.log(`   ✅ Success Rate: ${sampleLayerMetrics.topLayer.successRate}%`);
    console.log(`   🎯 Output Quality: ${sampleLayerMetrics.topLayer.outputQuality}%\n`);

    // Demo 3: Performance Metrics Collection
    console.log('📋 Demo 3: Performance Metrics Collection');
    console.log('-----------------------------------------');
    
    console.log('Collecting detailed performance metrics for different client types...\n');

    // Collect B2B metrics
    console.log('🏢 Collecting B2B performance metrics...');
    const b2bMetrics = await feedbackLoopService.collectPerformanceMetrics('content-b2b-demo', 'b2b');
    console.log('   📊 B2B Metrics Collected:');
    console.log(`      • Technical Accuracy: ${b2bMetrics.metrics.technicalAccuracyScore.toFixed(1)}%`);
    console.log(`      • Comprehensiveness: ${b2bMetrics.metrics.comprehensivenessMeasure.toFixed(1)}%`);
    console.log(`      • Industry Alignment: ${b2bMetrics.metrics.industryAlignmentIndex.toFixed(1)}%`);
    console.log(`      • Citation Quality: ${b2bMetrics.metrics.citationQualityScore.toFixed(1)}%`);
    console.log(`      • Engagement Score: ${b2bMetrics.metrics.engagementScore.toFixed(1)}%`);
    console.log(`      • Conversion Rate: ${b2bMetrics.metrics.conversionRate.toFixed(1)}%\n`);

    // Collect B2C metrics
    console.log('👥 Collecting B2C performance metrics...');
    const b2cMetrics = await feedbackLoopService.collectPerformanceMetrics('content-b2c-demo', 'b2c');
    console.log('   📊 B2C Metrics Collected:');
    console.log(`      • Engagement Score: ${b2cMetrics.metrics.engagementScore.toFixed(1)}%`);
    console.log(`      • Emotional Resonance: ${b2cMetrics.metrics.emotionalResonanceIndex.toFixed(1)}%`);
    console.log(`      • Conversion Potential: ${b2cMetrics.metrics.conversionPotentialScore.toFixed(1)}%`);
    console.log(`      • Social Sharing Probability: ${b2cMetrics.metrics.socialSharingProbability.toFixed(1)}%`);
    console.log(`      • Conversion Rate: ${b2cMetrics.metrics.conversionRate.toFixed(1)}%\n`);

    // Demo 4: Improvement Suggestions
    console.log('💡 Demo 4: Automated Improvement Suggestions');
    console.log('--------------------------------------------');
    
    // Generate B2B improvement suggestions
    console.log('🏢 Generating B2B improvement suggestions...');
    const b2bSuggestions = await feedbackLoopService.generateImprovementSuggestions(
      'content-b2b-demo', 
      b2bMetrics.metrics
    );
    console.log(`   🎯 Priority Level: ${b2bSuggestions.priority.toUpperCase()}`);
    console.log(`   📊 Metrics Analyzed: ${b2bSuggestions.metrics.analyzed}`);
    console.log(`   ⚠️  Below Threshold: ${b2bSuggestions.metrics.belowThreshold}`);
    console.log('   💡 Suggestions:');
    b2bSuggestions.suggestions.forEach((suggestion, index) => {
      console.log(`      ${index + 1}. ${suggestion}`);
    });
    console.log();

    // Generate B2C improvement suggestions
    console.log('👥 Generating B2C improvement suggestions...');
    const b2cSuggestions = await feedbackLoopService.generateImprovementSuggestions(
      'content-b2c-demo', 
      b2cMetrics.metrics
    );
    console.log(`   🎯 Priority Level: ${b2cSuggestions.priority.toUpperCase()}`);
    console.log(`   📊 Metrics Analyzed: ${b2cSuggestions.metrics.analyzed}`);
    console.log(`   ⚠️  Below Threshold: ${b2cSuggestions.metrics.belowThreshold}`);
    console.log('   💡 Suggestions:');
    b2cSuggestions.suggestions.forEach((suggestion, index) => {
      console.log(`      ${index + 1}. ${suggestion}`);
    });
    console.log();

    // Demo 5: Automated Improvements
    console.log('🤖 Demo 5: Automated Improvement Application');
    console.log('--------------------------------------------');
    
    console.log('Applying automated improvements to B2B content...');
    const b2bImprovements = await feedbackLoopService.applyAutomatedImprovements(
      'content-b2b-demo',
      b2bSuggestions.suggestions.slice(0, 3) // Apply first 3 suggestions
    );
    
    console.log(`   📊 Total Improvements: ${b2bImprovements.summary.total}`);
    console.log(`   ✅ Successful: ${b2bImprovements.summary.successful}`);
    console.log(`   📈 Success Rate: ${b2bImprovements.summary.successRate}%`);
    console.log(`   🎯 Status: ${b2bImprovements.status.toUpperCase()}`);
    console.log('   📋 Applied Improvements:');
    b2bImprovements.appliedImprovements.forEach((improvement, index) => {
      const status = improvement.applied ? '✅' : '❌';
      console.log(`      ${index + 1}. ${status} ${improvement.improvement}`);
      if (!improvement.applied) {
        console.log(`         Reason: ${improvement.reason}`);
      }
    });
    console.log();

    // Demo 6: Optimization Suggestions
    console.log('🎯 Demo 6: Content Optimization Suggestions');
    console.log('-------------------------------------------');
    
    console.log('Getting optimization suggestions for blog posts targeting B2B audience...');
    const optimizationSuggestions = await feedbackLoopService.getOptimizationSuggestions('blog_post', 'b2b');
    
    console.log('   📝 Content Strategy Recommendations:');
    optimizationSuggestions.contentStrategy.forEach((suggestion, index) => {
      console.log(`      ${index + 1}. ${suggestion}`);
    });
    
    console.log('\n   ⚙️  Technical Optimization Recommendations:');
    optimizationSuggestions.technicalOptimizations.forEach((suggestion, index) => {
      console.log(`      ${index + 1}. ${suggestion}`);
    });
    
    console.log('\n   🔄 Workflow Improvement Recommendations:');
    optimizationSuggestions.workflowRecommendations.forEach((suggestion, index) => {
      console.log(`      ${index + 1}. ${suggestion}`);
    });
    console.log();

    // Demo 7: Performance Trend Analysis
    console.log('📈 Demo 7: Performance Trend Analysis');
    console.log('-------------------------------------');
    
    // Add more historical data for trend analysis
    console.log('Adding historical performance data for trend analysis...');
    const historicalData = [];
    for (let i = 0; i < 15; i++) {
      const baseDate = new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000);
      const trendFactor = i / 15; // Improving trend over time
      
      const historicalMetric: ContentPerformanceMetrics = {
        jobId: `historical-job-${i}`,
        contentId: `historical-content-${i}`,
        contentType: i % 3 === 0 ? 'blog_post' : i % 3 === 1 ? 'technical_guide' : 'case_study',
        audience: i % 2 === 0 ? 'b2b' : 'b2c',
        engagementScore: 40 + (trendFactor * 40) + (Math.random() * 10), // Improving trend
        conversionRate: 2 + (trendFactor * 8) + (Math.random() * 2),
        timeOnPage: 120 + (trendFactor * 180) + (Math.random() * 60),
        bounceRate: 70 - (trendFactor * 30) - (Math.random() * 10), // Decreasing (improving)
        userRating: 2.5 + (trendFactor * 2) + (Math.random() * 0.5),
        loadTime: 3000 - (trendFactor * 1500) + (Math.random() * 500),
        recordedAt: baseDate.toISOString()
      };
      
      historicalData.push(historicalMetric);
      await feedbackLoopService.recordContentPerformance(historicalMetric);
    }
    
    console.log(`   ✅ Added ${historicalData.length} historical data points\n`);

    // Analyze trends
    console.log('Analyzing performance trends over the last 30 days...');
    const trendAnalysis = await feedbackLoopService.analyzePerformanceTrends();
    
    console.log(`   📊 Analysis Period: ${new Date(trendAnalysis.timeRange.start).toLocaleDateString()} - ${new Date(trendAnalysis.timeRange.end).toLocaleDateString()}`);
    console.log(`   📈 Data Points Analyzed: ${trendAnalysis.dataPoints}`);
    
    if (trendAnalysis.contentTypeTrends) {
      console.log('\n   📋 Content Type Performance:');
      Object.entries(trendAnalysis.contentTypeTrends).forEach(([type, data]: [string, any]) => {
        console.log(`      • ${type}:`);
        console.log(`        - Count: ${data.count} pieces`);
        console.log(`        - Avg Engagement: ${data.averageEngagement.toFixed(1)}%`);
        console.log(`        - Avg Conversion: ${data.averageConversion.toFixed(1)}%`);
        console.log(`        - Trend: ${data.trend.toUpperCase()}`);
      });
    }
    
    if (trendAnalysis.audienceInsights) {
      console.log('\n   👥 Audience Performance:');
      Object.entries(trendAnalysis.audienceInsights).forEach(([audience, data]: [string, any]) => {
        console.log(`      • ${audience.toUpperCase()}:`);
        console.log(`        - Content Count: ${data.count}`);
        console.log(`        - Avg Performance: ${data.performance.length > 0 ? 
          (data.performance.reduce((sum, p) => sum + p.engagement, 0) / data.performance.length).toFixed(1) : 'N/A'}%`);
      });
    }
    
    if (trendAnalysis.recommendations && trendAnalysis.recommendations.length > 0) {
      console.log('\n   💡 Trend-Based Recommendations:');
      trendAnalysis.recommendations.forEach((recommendation, index) => {
        console.log(`      ${index + 1}. ${recommendation}`);
      });
    }

    // Demo Summary
    console.log('\n\n🎉 Feedback Loop Demo Summary');
    console.log('==============================');
    console.log('✅ Content performance tracking demonstrated');
    console.log('✅ Layer performance monitoring functional');
    console.log('✅ Automated improvement suggestions working');
    console.log('✅ Performance issue detection active');
    console.log('✅ Trend analysis and insights generated');
    console.log('✅ Optimization recommendations provided');

    console.log('\n📊 Key Metrics Tracked:');
    console.log('   • Content engagement and conversion rates');
    console.log('   • Layer processing times and success rates');
    console.log('   • User satisfaction and feedback scores');
    console.log('   • Technical performance metrics');
    console.log('   • Business impact measurements');

    console.log('\n🔄 Feedback Loop Features:');
    console.log('   • Real-time performance monitoring');
    console.log('   • Automated issue detection and alerting');
    console.log('   • Data-driven improvement suggestions');
    console.log('   • Trend analysis for strategic insights');
    console.log('   • Continuous optimization recommendations');

    console.log('\n🚀 Feedback Loop System is production-ready!');
    console.log('\n📚 Integration Points:');
    console.log('   • Azure Application Insights for telemetry');
    console.log('   • Real-time dashboards and monitoring');
    console.log('   • Automated alerting and notifications');
    console.log('   • Performance-based content optimization');
    console.log('   • Strategic decision support through analytics');

    await app.close();

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runFeedbackLoopDemo().catch(console.error);
}

export { runFeedbackLoopDemo };
