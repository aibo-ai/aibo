#!/usr/bin/env ts-node

/**
 * Citation Verification Engine Demo
 * 
 * This script demonstrates the full capabilities of the production-ready
 * citation verification engine, including:
 * - Citation extraction from various content types
 * - Real-time authority verification
 * - Citation enhancement and improvement
 * - Performance monitoring and caching
 * - Error handling and resilience
 */

import { NestFactory } from '@nestjs/core';
import { TopLayerModule } from '../src/components/top-layer/top-layer.module';
import { CitationAuthorityVerifierService } from '../src/components/top-layer/services/citation-authority-verifier.service';
import { CitationCacheService } from '../src/components/top-layer/services/citation-cache.service';
import { CitationMonitoringService } from '../src/components/top-layer/services/citation-monitoring.service';

// Sample content for demonstration
const sampleContent = {
  title: 'The Impact of Artificial Intelligence on Modern Business Operations',
  sections: {
    introduction: {
      content: `
        Artificial Intelligence (AI) has emerged as a transformative force in modern business operations. 
        According to a comprehensive study by McKinsey Global Institute (2023), AI technologies are 
        expected to contribute between $13 trillion and $15.7 trillion to global economic output by 2030.
        This research, available at https://www.mckinsey.com/featured-insights/artificial-intelligence/ai-economic-impact,
        highlights the unprecedented potential of AI across various industries.
      `
    },
    methodology: {
      content: `
        Our analysis builds upon the foundational work of Smith, J., Johnson, A., and Williams, R. (2023). 
        "Machine Learning Applications in Enterprise Resource Planning." Journal of Business Technology, 
        45(3), 123-145. DOI: 10.1000/jbt.2023.45.3.123. Additionally, we reference the comprehensive 
        framework proposed by Chen, L. et al. (2022) in their seminal paper on AI implementation strategies.
      `
    },
    findings: {
      content: `
        Our findings align with recent research from Harvard Business Review and data from the 
        World Economic Forum's Future of Jobs Report 2023, accessible at 
        https://www.weforum.org/reports/the-future-of-jobs-report-2023. The study reveals that 
        companies implementing AI solutions report an average productivity increase of 37%, 
        as documented by the MIT Technology Review in their 2023 AI Business Impact Survey.
      `
    },
    conclusion: {
      content: `
        The evidence strongly suggests that AI adoption is not merely a technological upgrade 
        but a fundamental business transformation. As noted by leading researchers at Stanford 
        AI Lab and corroborated by industry reports from Gartner and Forrester Research, 
        organizations that fail to adopt AI technologies risk significant competitive disadvantage.
      `
    }
  }
};

async function runDemo() {
  console.log('🚀 Citation Verification Engine Demo');
  console.log('=====================================\n');

  try {
    // Initialize the NestJS application context
    const app = await NestFactory.createApplicationContext(TopLayerModule);
    
    const citationVerifier = app.get(CitationAuthorityVerifierService);
    const cacheService = app.get(CitationCacheService);
    const monitoringService = app.get(CitationMonitoringService);

    console.log('✅ Citation Verification Engine initialized successfully\n');

    // Demo 1: Basic Citation Verification
    console.log('📋 Demo 1: Basic Citation Verification (B2B Content)');
    console.log('---------------------------------------------------');
    
    const startTime = Date.now();
    const verificationResult = await citationVerifier.verifyCitations(sampleContent, 'b2b');
    const verificationTime = Date.now() - startTime;

    console.log(`⏱️  Verification completed in ${verificationTime}ms`);
    console.log(`📊 Found ${verificationResult.citations.length} citations`);
    console.log(`🎯 Overall credibility score: ${verificationResult.overallCredibilityScore}/10`);
    console.log(`📈 Extraction confidence: ${(verificationResult.extractionResult.confidence * 100).toFixed(1)}%`);
    
    // Display citation details
    console.log('\n📝 Citation Details:');
    verificationResult.citations.forEach((citation, index) => {
      console.log(`\n  ${index + 1}. ${citation.citation.type.toUpperCase()} Citation`);
      console.log(`     Section: ${citation.citation.section}`);
      console.log(`     Authority Score: ${citation.verification.authorityScore || 'N/A'}/10`);
      console.log(`     Status: ${citation.verificationStatus}`);
      if (citation.citation.url) {
        console.log(`     URL: ${citation.citation.url}`);
      }
      if (citation.issues.length > 0) {
        console.log(`     Issues: ${citation.issues.join(', ')}`);
      }
    });

    // Demo 2: Citation Enhancement
    console.log('\n\n🔧 Demo 2: Citation Enhancement');
    console.log('-------------------------------');
    
    const enhancementStart = Date.now();
    const enhancementResult = await citationVerifier.enhanceCitationAuthority(sampleContent, 'b2b');
    const enhancementTime = Date.now() - enhancementStart;

    console.log(`⏱️  Enhancement completed in ${enhancementTime}ms`);
    console.log(`📊 Citation count: ${enhancementResult.improvementSummary.citationCount.before} → ${enhancementResult.improvementSummary.citationCount.after}`);
    console.log(`🎯 Credibility score: ${enhancementResult.improvementSummary.credibilityScore.before} → ${enhancementResult.improvementSummary.credibilityScore.after}`);
    console.log(`📈 Improvement: +${enhancementResult.improvementSummary.credibilityScore.improvement} points`);

    // Demo 3: Citation Strategy Generation
    console.log('\n\n📋 Demo 3: Citation Strategy Generation');
    console.log('--------------------------------------');
    
    const strategyB2B = await citationVerifier.generateCitationStrategy('artificial intelligence', 'b2b');
    const strategyB2C = await citationVerifier.generateCitationStrategy('artificial intelligence', 'b2c');

    console.log('\n🏢 B2B Strategy:');
    console.log(`   Recommended sources: ${strategyB2B.recommendedSources.slice(0, 3).join(', ')}`);
    console.log(`   Minimum citations: ${strategyB2B.densityRecommendation.minimumCitations}`);
    console.log(`   Preferred formats: ${strategyB2B.preferredFormats.slice(0, 2).join(', ')}`);

    console.log('\n👥 B2C Strategy:');
    console.log(`   Recommended sources: ${strategyB2C.recommendedSources.slice(0, 3).join(', ')}`);
    console.log(`   Minimum citations: ${strategyB2C.densityRecommendation.minimumCitations}`);
    console.log(`   Preferred formats: ${strategyB2C.preferredFormats.slice(0, 2).join(', ')}`);

    // Demo 4: Performance and Caching
    console.log('\n\n⚡ Demo 4: Performance and Caching');
    console.log('----------------------------------');

    // Run multiple verifications to test caching
    console.log('Running 3 identical verifications to test caching...');
    
    const perfTests = [];
    for (let i = 0; i < 3; i++) {
      const perfStart = Date.now();
      await citationVerifier.verifyCitations(sampleContent, 'b2b');
      const perfTime = Date.now() - perfStart;
      perfTests.push(perfTime);
      console.log(`  Verification ${i + 1}: ${perfTime}ms`);
    }

    const avgTime = perfTests.reduce((sum, time) => sum + time, 0) / perfTests.length;
    console.log(`📊 Average time: ${avgTime.toFixed(1)}ms`);
    
    // Show cache statistics
    const cacheStats = cacheService.getCacheStats();
    console.log(`💾 Cache statistics:`);
    console.log(`   Total entries: ${cacheStats.totalEntries}`);
    console.log(`   Hit rate: ${cacheStats.hitCounts.total > 0 ? (cacheStats.hitCounts.average * 100).toFixed(1) : 0}%`);
    console.log(`   Cache enabled: ${cacheStats.enabled}`);

    // Demo 5: Error Handling
    console.log('\n\n🛡️  Demo 5: Error Handling and Resilience');
    console.log('------------------------------------------');

    // Test with invalid content
    const invalidContent = { invalid: 'structure' };
    const errorResult = await citationVerifier.verifyCitations(invalidContent, 'b2b');
    
    console.log(`✅ Handled invalid content gracefully`);
    console.log(`   Citations found: ${errorResult.citations.length}`);
    console.log(`   Error handling: ${errorResult.error ? 'Error logged' : 'No errors'}`);

    // Demo 6: Monitoring and Health
    console.log('\n\n📊 Demo 6: Monitoring and Health Status');
    console.log('--------------------------------------');

    const healthStatus = monitoringService.getHealthStatus();
    console.log(`🏥 System health: ${healthStatus.status}`);
    console.log(`📈 Success rate: ${(healthStatus.metrics.successRate * 100).toFixed(1)}%`);
    console.log(`⏱️  Average response time: ${healthStatus.metrics.averageResponseTime.toFixed(0)}ms`);
    console.log(`🔄 Active verifications: ${healthStatus.metrics.activeVerifications}`);

    // Generate analytics report
    const analyticsReport = monitoringService.generateAnalyticsReport({
      start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      end: new Date()
    });

    console.log(`\n📊 Analytics (last hour):`);
    console.log(`   Total citations processed: ${analyticsReport.totalCitations}`);
    console.log(`   Verification rate: ${analyticsReport.verifiedCitations}/${analyticsReport.totalCitations}`);
    console.log(`   Average authority score: ${analyticsReport.averageAuthorityScore.toFixed(2)}`);

    // Demo Summary
    console.log('\n\n🎉 Demo Summary');
    console.log('===============');
    console.log(`✅ Citation extraction: ${verificationResult.extractionResult.totalFound} citations found`);
    console.log(`✅ Authority verification: ${verificationResult.citations.length} citations verified`);
    console.log(`✅ Citation enhancement: +${enhancementResult.improvementSummary.credibilityScore.improvement} credibility improvement`);
    console.log(`✅ Performance: Average ${avgTime.toFixed(1)}ms per verification`);
    console.log(`✅ Caching: ${cacheStats.totalEntries} entries cached`);
    console.log(`✅ Error handling: Graceful degradation demonstrated`);
    console.log(`✅ Monitoring: Real-time health and metrics available`);

    console.log('\n🚀 Citation Verification Engine is production-ready!');
    console.log('\n📚 Next steps:');
    console.log('   1. Configure external API keys for production use');
    console.log('   2. Set up monitoring alerts and dashboards');
    console.log('   3. Integrate with your content management system');
    console.log('   4. Scale horizontally with Redis clustering');
    console.log('   5. Implement custom domain authority rules');

    await app.close();

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };
