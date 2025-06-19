import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosClient, Container } from '@azure/cosmos';
import { QDFScore } from '../interfaces/freshness.interfaces';

/**
 * QDF (Query Deserves Freshness) Algorithm Service
 * Implements algorithms to determine how much freshness matters for a given topic
 */
@Injectable()
export class QDFAlgorithmService {
  private readonly logger = new Logger(QDFAlgorithmService.name);
  private qdfScoresContainer: Container;
  
  constructor(private configService: ConfigService) {
    // Initialize Cosmos DB client for QDF scores
    const endpoint = this.configService.get<string>('AZURE_COSMOS_ENDPOINT');
    const key = this.configService.get<string>('AZURE_COSMOS_KEY');
    const databaseId = this.configService.get<string>('AZURE_COSMOS_DATABASE');
    
    if (endpoint && key && databaseId) {
      const client = new CosmosClient({ endpoint, key });
      const database = client.database(databaseId);
      this.qdfScoresContainer = database.container('qdfScores');
      
      this.logger.log('QDF Algorithm Service initialized with Cosmos DB connection');
    } else {
      this.logger.warn('Cosmos DB configuration missing, QDF scores will not be persisted');
    }
  }
  
  /**
   * Calculate QDF score for a topic
   * Higher scores indicate topics that deserve more freshness
   * @param topic The topic to evaluate
   * @returns QDF score between 0-1
   */
  async calculateQDFScore(topic: string): Promise<number> {
    try {
      // First check if we have a recent QDF score for this topic
      const existingScore = await this.getStoredQDFScore(topic);
      if (existingScore) {
        // If score is less than 7 days old, use it
        const scoreAge = (new Date().getTime() - new Date(existingScore.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
        if (scoreAge < 7) {
          return existingScore.score;
        }
      }
      
      // Calculate new QDF score based on multiple factors
      const trendingFactor = await this.calculateTrendingFactor(topic);
      const volatilityFactor = await this.calculateVolatilityFactor(topic);
      const seasonalityFactor = await this.calculateSeasonalityFactor(topic);
      
      // Combine factors with different weights
      const qdfScore = (
        0.5 * trendingFactor +  // Trending topics deserve more freshness
        0.3 * volatilityFactor + // Volatile topics deserve more freshness
        0.2 * seasonalityFactor  // Seasonal topics deserve more freshness during their season
      );
      
      // Store the calculated score
      await this.storeQDFScore({
        topic,
        score: qdfScore,
        lastUpdated: new Date().toISOString(),
        trendingFactor,
        volatilityFactor,
        seasonalityFactor
      });
      
      return qdfScore;
    } catch (error) {
      this.logger.error(`Error calculating QDF score: ${error.message}`);
      // Return a moderate default score on error
      return 0.5;
    }
  }
  
  /**
   * Get stored QDF score for a topic
   * @param topic The topic to get score for
   * @returns Stored QDF score or null if not found
   */
  private async getStoredQDFScore(topic: string): Promise<QDFScore | null> {
    if (!this.qdfScoresContainer) {
      return null;
    }
    
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.topic = @topic",
        parameters: [{ name: "@topic", value: topic.toLowerCase() }]
      };
      
      const { resources } = await this.qdfScoresContainer.items.query(querySpec).fetchAll();
      
      if (resources && resources.length > 0) {
        return resources[0] as QDFScore;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error retrieving QDF score: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Store QDF score in Cosmos DB
   * @param qdfScore The QDF score to store
   */
  private async storeQDFScore(qdfScore: QDFScore): Promise<void> {
    if (!this.qdfScoresContainer) {
      return;
    }
    
    try {
      const existingScore = await this.getStoredQDFScore(qdfScore.topic);
      
      if (existingScore) {
        // Update existing score
        await this.qdfScoresContainer.item(existingScore.topic, existingScore.topic).replace({
          ...qdfScore,
          id: existingScore.topic // Ensure ID is set for Cosmos DB
        });
      } else {
        // Create new score
        await this.qdfScoresContainer.items.create({
          ...qdfScore,
          id: qdfScore.topic // Use topic as ID
        });
      }
    } catch (error) {
      this.logger.error(`Error storing QDF score: ${error.message}`);
    }
  }
  
  /**
   * Calculate trending factor for a topic
   * @param topic The topic to evaluate
   * @returns Trending factor between 0-1
   */
  private async calculateTrendingFactor(topic: string): Promise<number> {
    // In a real implementation, this would use data from search trends, social media, etc.
    // For now, we'll use a random value between 0.3 and 0.9 for simulation
    return 0.3 + (Math.random() * 0.6);
  }
  
  /**
   * Calculate volatility factor for a topic
   * @param topic The topic to evaluate
   * @returns Volatility factor between 0-1
   */
  private async calculateVolatilityFactor(topic: string): Promise<number> {
    // In a real implementation, this would analyze how quickly content about this topic becomes outdated
    // For now, we'll use a random value between 0.2 and 0.8 for simulation
    return 0.2 + (Math.random() * 0.6);
  }
  
  /**
   * Calculate seasonality factor for a topic
   * @param topic The topic to evaluate
   * @returns Seasonality factor between 0-1
   */
  private async calculateSeasonalityFactor(topic: string): Promise<number> {
    // In a real implementation, this would check if the topic is seasonal and if we're in that season
    // For now, we'll use a random value between 0.1 and 0.7 for simulation
    return 0.1 + (Math.random() * 0.6);
  }
}
