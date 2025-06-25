const { CosmosClient } = require('@azure/cosmos');
const crypto = require('crypto');

class ABTestingService {
  constructor() {
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });
    this.database = this.cosmosClient.database('ContentArchitect');
    this.experimentsContainer = this.database.container('ABExperiments');
    this.metricsContainer = this.database.container('ABMetrics');
  }

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(config) {
    const experimentId = this.generateExperimentId();
    const timestamp = new Date().toISOString();

    const experiment = {
      id: experimentId,
      name: config.name,
      description: config.description,
      status: 'draft',
      createdAt: timestamp,
      createdBy: config.userId || 'system',
      
      // Test configuration
      testType: config.testType || 'content_variant', // content_variant, parameter_tuning, layer_comparison
      hypothesis: config.hypothesis,
      successMetrics: config.successMetrics || ['quality_score', 'eeat_score', 'user_engagement'],
      
      // Variants configuration
      variants: this.validateVariants(config.variants),
      trafficSplit: config.trafficSplit || this.generateEvenSplit(config.variants.length),
      
      // Test parameters
      duration: config.duration || 7, // days
      minSampleSize: config.minSampleSize || 100,
      confidenceLevel: config.confidenceLevel || 0.95,
      
      // Content parameters
      baseRequest: config.baseRequest, // The original content request
      testParameters: config.testParameters || {},
      
      // Results tracking
      results: {
        startDate: null,
        endDate: null,
        winner: null,
        confidence: null,
        statisticalSignificance: false,
        metrics: {}
      },
      
      // Metadata
      tags: config.tags || [],
      category: config.category || 'content_generation'
    };

    try {
      const { resource } = await this.experimentsContainer.items.create(experiment);
      console.log(`✅ A/B test experiment created: ${experiment.name}`);
      return resource;
    } catch (error) {
      console.error('❌ Error creating A/B test experiment:', error);
      throw error;
    }
  }

  /**
   * Start an A/B test experiment
   */
  async startExperiment(experimentId) {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      if (experiment.status !== 'draft') {
        throw new Error('Experiment must be in draft status to start');
      }

      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + experiment.duration * 24 * 60 * 60 * 1000).toISOString();

      await this.experimentsContainer.item(experimentId).patch([
        { op: 'replace', path: '/status', value: 'running' },
        { op: 'replace', path: '/results/startDate', value: startDate },
        { op: 'replace', path: '/results/endDate', value: endDate }
      ]);

      console.log(`✅ A/B test experiment started: ${experiment.name}`);
      return { experimentId, startDate, endDate };
    } catch (error) {
      console.error('❌ Error starting experiment:', error);
      throw error;
    }
  }

  /**
   * Generate content variant for A/B test
   */
  async generateVariant(experimentId, variantId, request) {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const variant = experiment.variants.find(v => v.id === variantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      // Modify request based on variant configuration
      const modifiedRequest = this.applyVariantModifications(request, variant, experiment);
      
      // Generate content using the 4-layer architecture
      const { LayeredContentProcessor } = require('./layered-content-processor');
      const processor = new LayeredContentProcessor();
      const result = await processor.processContent(modifiedRequest);

      // Track the generation
      await this.trackVariantGeneration(experimentId, variantId, {
        request: modifiedRequest,
        result,
        timestamp: new Date().toISOString()
      });

      // Add A/B test metadata to result
      result.abTestMetadata = {
        experimentId,
        variantId,
        variantName: variant.name,
        testType: experiment.testType,
        generatedAt: new Date().toISOString()
      };

      return result;
    } catch (error) {
      console.error('❌ Error generating variant:', error);
      throw error;
    }
  }

  /**
   * Record metrics for a variant
   */
  async recordMetrics(experimentId, variantId, metrics, sessionId = null) {
    try {
      const metricEntry = {
        id: `metric_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        experimentId,
        variantId,
        sessionId,
        metrics,
        timestamp: new Date().toISOString(),
        
        // Calculated scores
        qualityScore: metrics.qualityScore || 0,
        eeatScore: metrics.eeatScore || 0,
        userEngagement: metrics.userEngagement || 0,
        conversionRate: metrics.conversionRate || 0,
        
        // Performance metrics
        processingTime: metrics.processingTime || 0,
        layerPerformance: metrics.layerPerformance || {},
        
        // User feedback
        userRating: metrics.userRating || null,
        userFeedback: metrics.userFeedback || null
      };

      await this.metricsContainer.items.create(metricEntry);
      
      // Update experiment aggregated metrics
      await this.updateExperimentMetrics(experimentId);
      
      return metricEntry;
    } catch (error) {
      console.error('❌ Error recording metrics:', error);
      throw error;
    }
  }

  /**
   * Get experiment results and analysis
   */
  async getExperimentResults(experimentId) {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Get all metrics for this experiment
      const { resources: metrics } = await this.metricsContainer.items.query({
        query: 'SELECT * FROM c WHERE c.experimentId = @experimentId',
        parameters: [{ name: '@experimentId', value: experimentId }]
      }).fetchAll();

      // Calculate results for each variant
      const variantResults = {};
      for (const variant of experiment.variants) {
        const variantMetrics = metrics.filter(m => m.variantId === variant.id);
        variantResults[variant.id] = this.calculateVariantResults(variantMetrics, variant);
      }

      // Perform statistical analysis
      const statisticalAnalysis = this.performStatisticalAnalysis(variantResults, experiment);

      // Determine winner
      const winner = this.determineWinner(variantResults, experiment.successMetrics);

      const results = {
        experimentId,
        experimentName: experiment.name,
        status: experiment.status,
        duration: experiment.duration,
        startDate: experiment.results.startDate,
        endDate: experiment.results.endDate,
        
        // Variant results
        variants: variantResults,
        
        // Statistical analysis
        statisticalSignificance: statisticalAnalysis.isSignificant,
        confidence: statisticalAnalysis.confidence,
        pValue: statisticalAnalysis.pValue,
        
        // Winner determination
        winner: winner,
        improvement: winner ? this.calculateImprovement(variantResults, winner) : null,
        
        // Recommendations
        recommendations: this.generateRecommendations(variantResults, statisticalAnalysis, experiment),
        
        // Summary
        summary: this.generateResultsSummary(variantResults, winner, statisticalAnalysis)
      };

      return results;
    } catch (error) {
      console.error('❌ Error getting experiment results:', error);
      throw error;
    }
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentId, reason = 'completed') {
    try {
      const results = await this.getExperimentResults(experimentId);
      
      await this.experimentsContainer.item(experimentId).patch([
        { op: 'replace', path: '/status', value: 'completed' },
        { op: 'replace', path: '/results/endDate', value: new Date().toISOString() },
        { op: 'replace', path: '/results/winner', value: results.winner },
        { op: 'replace', path: '/results/confidence', value: results.confidence },
        { op: 'replace', path: '/results/statisticalSignificance', value: results.statisticalSignificance },
        { op: 'replace', path: '/results/metrics', value: results.variants }
      ]);

      console.log(`✅ A/B test experiment stopped: ${experimentId}`);
      return results;
    } catch (error) {
      console.error('❌ Error stopping experiment:', error);
      throw error;
    }
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId) {
    try {
      const { resource } = await this.experimentsContainer.item(experimentId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all experiments
   */
  async listExperiments(filters = {}) {
    try {
      let query = 'SELECT * FROM c';
      const parameters = [];

      if (filters.status) {
        query += ' WHERE c.status = @status';
        parameters.push({ name: '@status', value: filters.status });
      }

      if (filters.category) {
        const whereClause = parameters.length > 0 ? ' AND' : ' WHERE';
        query += `${whereClause} c.category = @category`;
        parameters.push({ name: '@category', value: filters.category });
      }

      query += ' ORDER BY c.createdAt DESC';

      const { resources } = await this.experimentsContainer.items.query({
        query,
        parameters
      }).fetchAll();

      return resources;
    } catch (error) {
      console.error('❌ Error listing experiments:', error);
      throw error;
    }
  }

  // Helper methods
  generateExperimentId() {
    return `exp_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  validateVariants(variants) {
    if (!variants || variants.length < 2) {
      throw new Error('At least 2 variants are required for A/B testing');
    }

    return variants.map((variant, index) => ({
      id: variant.id || `variant_${index}`,
      name: variant.name || `Variant ${index + 1}`,
      description: variant.description || '',
      modifications: variant.modifications || {},
      weight: variant.weight || 1
    }));
  }

  generateEvenSplit(variantCount) {
    const split = 100 / variantCount;
    return Array(variantCount).fill(split);
  }

  applyVariantModifications(request, variant, experiment) {
    const modifiedRequest = { ...request };

    // Apply variant-specific modifications
    if (variant.modifications) {
      Object.keys(variant.modifications).forEach(key => {
        modifiedRequest[key] = variant.modifications[key];
      });
    }

    // Apply experiment-level test parameters
    if (experiment.testParameters) {
      Object.keys(experiment.testParameters).forEach(key => {
        if (variant.modifications && !variant.modifications.hasOwnProperty(key)) {
          modifiedRequest[key] = experiment.testParameters[key];
        }
      });
    }

    return modifiedRequest;
  }

  async trackVariantGeneration(experimentId, variantId, data) {
    try {
      const trackingEntry = {
        id: `track_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        experimentId,
        variantId,
        type: 'generation',
        data,
        timestamp: new Date().toISOString()
      };

      await this.metricsContainer.items.create(trackingEntry);
    } catch (error) {
      console.error('❌ Error tracking variant generation:', error);
    }
  }

  calculateVariantResults(metrics, variant) {
    if (metrics.length === 0) {
      return {
        variantId: variant.id,
        variantName: variant.name,
        sampleSize: 0,
        averageQualityScore: 0,
        averageEEATScore: 0,
        averageUserEngagement: 0,
        conversionRate: 0,
        averageProcessingTime: 0
      };
    }

    const sampleSize = metrics.length;
    const qualityScores = metrics.map(m => m.qualityScore || 0);
    const eeatScores = metrics.map(m => m.eeatScore || 0);
    const engagementScores = metrics.map(m => m.userEngagement || 0);
    const processingTimes = metrics.map(m => m.processingTime || 0);
    const conversions = metrics.filter(m => m.conversionRate > 0).length;

    return {
      variantId: variant.id,
      variantName: variant.name,
      sampleSize,
      averageQualityScore: this.calculateMean(qualityScores),
      averageEEATScore: this.calculateMean(eeatScores),
      averageUserEngagement: this.calculateMean(engagementScores),
      conversionRate: (conversions / sampleSize) * 100,
      averageProcessingTime: this.calculateMean(processingTimes),
      standardDeviation: {
        qualityScore: this.calculateStandardDeviation(qualityScores),
        eeatScore: this.calculateStandardDeviation(eeatScores),
        userEngagement: this.calculateStandardDeviation(engagementScores)
      }
    };
  }

  performStatisticalAnalysis(variantResults, experiment) {
    const variants = Object.values(variantResults);
    if (variants.length < 2) {
      return { isSignificant: false, confidence: 0, pValue: 1 };
    }

    // Simple t-test for quality score comparison
    const control = variants[0];
    const treatment = variants[1];

    if (control.sampleSize < 30 || treatment.sampleSize < 30) {
      return { isSignificant: false, confidence: 0, pValue: 1, note: 'Insufficient sample size' };
    }

    // Calculate t-statistic
    const meanDiff = treatment.averageQualityScore - control.averageQualityScore;
    const pooledStdError = Math.sqrt(
      (Math.pow(control.standardDeviation.qualityScore, 2) / control.sampleSize) +
      (Math.pow(treatment.standardDeviation.qualityScore, 2) / treatment.sampleSize)
    );

    const tStatistic = meanDiff / pooledStdError;
    const degreesOfFreedom = control.sampleSize + treatment.sampleSize - 2;

    // Simplified p-value calculation (normally would use proper t-distribution)
    const pValue = this.calculatePValue(Math.abs(tStatistic), degreesOfFreedom);
    const isSignificant = pValue < (1 - experiment.confidenceLevel);

    return {
      isSignificant,
      confidence: experiment.confidenceLevel,
      pValue,
      tStatistic,
      degreesOfFreedom,
      meanDifference: meanDiff
    };
  }

  determineWinner(variantResults, successMetrics) {
    const variants = Object.values(variantResults);
    if (variants.length === 0) return null;

    // Score each variant based on success metrics
    let bestVariant = null;
    let bestScore = -Infinity;

    variants.forEach(variant => {
      let score = 0;
      successMetrics.forEach(metric => {
        switch (metric) {
          case 'quality_score':
            score += variant.averageQualityScore * 0.4;
            break;
          case 'eeat_score':
            score += variant.averageEEATScore * 0.3;
            break;
          case 'user_engagement':
            score += variant.averageUserEngagement * 0.2;
            break;
          case 'conversion_rate':
            score += variant.conversionRate * 0.1;
            break;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant;
      }
    });

    return bestVariant ? {
      variantId: bestVariant.variantId,
      variantName: bestVariant.variantName,
      score: bestScore
    } : null;
  }

  calculateImprovement(variantResults, winner) {
    const variants = Object.values(variantResults);
    const winnerData = variants.find(v => v.variantId === winner.variantId);
    const baseline = variants.find(v => v.variantId !== winner.variantId);

    if (!winnerData || !baseline) return null;

    return {
      qualityScoreImprovement: ((winnerData.averageQualityScore - baseline.averageQualityScore) / baseline.averageQualityScore * 100).toFixed(2),
      eeatScoreImprovement: ((winnerData.averageEEATScore - baseline.averageEEATScore) / baseline.averageEEATScore * 100).toFixed(2),
      engagementImprovement: ((winnerData.averageUserEngagement - baseline.averageUserEngagement) / baseline.averageUserEngagement * 100).toFixed(2)
    };
  }

  generateRecommendations(variantResults, statisticalAnalysis, experiment) {
    const recommendations = [];

    if (!statisticalAnalysis.isSignificant) {
      recommendations.push('Results are not statistically significant. Consider running the test longer or with larger sample sizes.');
    }

    if (statisticalAnalysis.pValue > 0.1) {
      recommendations.push('P-value is high, suggesting weak evidence against the null hypothesis.');
    }

    const variants = Object.values(variantResults);
    const maxSampleSize = Math.max(...variants.map(v => v.sampleSize));
    if (maxSampleSize < 100) {
      recommendations.push('Sample sizes are small. Consider collecting more data for reliable results.');
    }

    return recommendations;
  }

  generateResultsSummary(variantResults, winner, statisticalAnalysis) {
    const variants = Object.values(variantResults);
    const totalSamples = variants.reduce((sum, v) => sum + v.sampleSize, 0);

    return {
      totalSamples,
      variantCount: variants.length,
      hasWinner: !!winner,
      isStatisticallySignificant: statisticalAnalysis.isSignificant,
      confidence: statisticalAnalysis.confidence,
      recommendation: winner ? 
        `Implement ${winner.variantName} as it shows the best performance` :
        'No clear winner identified. Consider running additional tests.'
    };
  }

  async updateExperimentMetrics(experimentId) {
    // This would update aggregated metrics in the experiment document
    // Implementation depends on specific requirements
  }

  // Statistical helper methods
  calculateMean(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  calculatePValue(tStatistic, degreesOfFreedom) {
    // Simplified p-value calculation
    // In production, use a proper statistical library
    if (tStatistic > 2.576) return 0.01;
    if (tStatistic > 1.96) return 0.05;
    if (tStatistic > 1.645) return 0.1;
    return 0.2;
  }
}

module.exports = { ABTestingService };
