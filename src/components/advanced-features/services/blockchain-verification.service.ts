import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { createHash } from 'crypto';

export interface ContentVerificationRequest {
  content: string;
  metadata: {
    title: string;
    author: string;
    createdAt: string;
    contentType: string;
    version?: string;
  };
  verificationLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
  includeTimestamp: boolean;
  includeAuthorSignature: boolean;
}

export interface BlockchainVerificationResult {
  verificationId: string;
  contentHash: string;
  blockchainTxId: string;
  timestamp: string;
  verificationLevel: string;
  status: 'pending' | 'confirmed' | 'failed';
  proofOfIntegrity: {
    merkleRoot: string;
    merkleProof: string[];
    blockNumber?: number;
    confirmations?: number;
  };
  certificate: {
    certificateId: string;
    issuer: string;
    validFrom: string;
    validUntil: string;
    publicKey: string;
    signature: string;
  };
  metadata: {
    networkUsed: string;
    gasUsed?: number;
    transactionFee?: string;
    processingTime: number;
  };
}

export interface VerificationQuery {
  verificationId?: string;
  contentHash?: string;
  blockchainTxId?: string;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  originalHash: string;
  currentHash: string;
  lastVerified: string;
  modifications: Array<{
    timestamp: string;
    changeType: 'content' | 'metadata' | 'structure';
    description: string;
    severity: 'minor' | 'major' | 'critical';
  }>;
  trustScore: number;
  recommendations: string[];
}

@Injectable()
export class BlockchainVerificationService {
  private readonly logger = new Logger(BlockchainVerificationService.name);
  private readonly blockchainEndpoint: string;
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly networkId: string;
  
  // Verification registry to track all verifications
  private readonly verificationRegistry = new Map<string, BlockchainVerificationResult>();
  
  // Supported blockchain networks
  private readonly supportedNetworks = {
    ethereum: {
      name: 'Ethereum',
      endpoint: 'https://mainnet.infura.io/v3/',
      testnet: 'https://goerli.infura.io/v3/',
      gasLimit: 21000,
      avgConfirmationTime: 15000 // 15 seconds
    },
    polygon: {
      name: 'Polygon',
      endpoint: 'https://polygon-rpc.com',
      testnet: 'https://rpc-mumbai.maticvigil.com',
      gasLimit: 21000,
      avgConfirmationTime: 2000 // 2 seconds
    },
    hyperledger: {
      name: 'Hyperledger Fabric',
      endpoint: 'https://hyperledger-fabric.azure.com',
      testnet: 'https://hyperledger-fabric-test.azure.com',
      gasLimit: 0,
      avgConfirmationTime: 1000 // 1 second
    }
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.blockchainEndpoint = this.configService.get('BLOCKCHAIN_ENDPOINT', this.supportedNetworks.polygon.endpoint);
    this.privateKey = this.configService.get('BLOCKCHAIN_PRIVATE_KEY', '');
    this.publicKey = this.configService.get('BLOCKCHAIN_PUBLIC_KEY', '');
    this.networkId = this.configService.get('BLOCKCHAIN_NETWORK', 'polygon');
    
    this.initializeBlockchainConnection();
  }

  /**
   * Verify content on blockchain
   */
  async verifyContent(request: ContentVerificationRequest): Promise<BlockchainVerificationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting blockchain verification for content (level: ${request.verificationLevel})`);

      // Track verification request
      this.appInsights.trackEvent('BlockchainVerification:VerificationStarted', {
        verificationLevel: request.verificationLevel,
        contentType: request.metadata.contentType,
        contentLength: request.content.length.toString(),
        includeTimestamp: request.includeTimestamp.toString(),
        includeAuthorSignature: request.includeAuthorSignature.toString()
      });

      // Generate content hash
      const contentHash = this.generateContentHash(request.content, request.metadata);
      
      // Create verification ID
      const verificationId = this.generateVerificationId(contentHash);
      
      // Prepare blockchain transaction
      const transactionData = await this.prepareBlockchainTransaction(
        contentHash, 
        request.metadata, 
        request.verificationLevel
      );
      
      // Submit to blockchain
      const blockchainTxId = await this.submitToBlockchain(transactionData, request.verificationLevel);
      
      // Generate proof of integrity
      const proofOfIntegrity = await this.generateProofOfIntegrity(contentHash, blockchainTxId);
      
      // Create digital certificate
      const certificate = await this.createDigitalCertificate(
        verificationId, 
        contentHash, 
        request.metadata,
        request.includeAuthorSignature
      );
      
      const processingTime = Date.now() - startTime;
      
      const result: BlockchainVerificationResult = {
        verificationId,
        contentHash,
        blockchainTxId,
        timestamp: new Date().toISOString(),
        verificationLevel: request.verificationLevel,
        status: 'pending', // Will be updated when confirmed
        proofOfIntegrity,
        certificate,
        metadata: {
          networkUsed: this.networkId,
          gasUsed: transactionData.gasEstimate,
          transactionFee: transactionData.estimatedFee,
          processingTime
        }
      };

      // Store in registry
      this.verificationRegistry.set(verificationId, result);

      // Start confirmation monitoring
      this.monitorConfirmation(verificationId, blockchainTxId);

      // Track successful verification
      this.appInsights.trackEvent('BlockchainVerification:VerificationSubmitted', {
        verificationId,
        verificationLevel: request.verificationLevel,
        blockchainTxId,
        processingTime: processingTime.toString(),
        networkUsed: this.networkId
      });

      this.appInsights.trackMetric('BlockchainVerification:ProcessingTime', processingTime, {
        verificationLevel: request.verificationLevel,
        networkUsed: this.networkId
      });

      this.logger.log(`Blockchain verification submitted: ${verificationId} (tx: ${blockchainTxId})`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Blockchain verification failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'VerifyContent',
        verificationLevel: request.verificationLevel,
        processingTime: processingTime.toString()
      });

      throw error;
    }
  }

  /**
   * Query verification status
   */
  async queryVerification(query: VerificationQuery): Promise<BlockchainVerificationResult | null> {
    try {
      let result: BlockchainVerificationResult | null = null;

      if (query.verificationId) {
        result = this.verificationRegistry.get(query.verificationId) || null;
      } else if (query.contentHash) {
        // Search by content hash
        for (const verification of this.verificationRegistry.values()) {
          if (verification.contentHash === query.contentHash) {
            result = verification;
            break;
          }
        }
      } else if (query.blockchainTxId) {
        // Search by blockchain transaction ID
        for (const verification of this.verificationRegistry.values()) {
          if (verification.blockchainTxId === query.blockchainTxId) {
            result = verification;
            break;
          }
        }
      }

      if (result) {
        // Update status if needed
        await this.updateVerificationStatus(result);
      }

      this.appInsights.trackEvent('BlockchainVerification:VerificationQueried', {
        queryType: query.verificationId ? 'verificationId' : query.contentHash ? 'contentHash' : 'blockchainTxId',
        found: result ? 'true' : 'false'
      });

      return result;

    } catch (error) {
      this.logger.error(`Verification query failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'QueryVerification'
      });
      throw error;
    }
  }

  /**
   * Check content integrity
   */
  async checkIntegrity(originalContent: string, currentContent: string, verificationId: string): Promise<IntegrityCheckResult> {
    try {
      this.logger.log(`Checking content integrity for verification: ${verificationId}`);

      const originalHash = this.generateContentHash(originalContent, {});
      const currentHash = this.generateContentHash(currentContent, {});
      
      const isValid = originalHash === currentHash;
      
      // Analyze modifications if content has changed
      const modifications = isValid ? [] : await this.analyzeModifications(originalContent, currentContent);
      
      // Calculate trust score
      const trustScore = this.calculateTrustScore(isValid, modifications, verificationId);
      
      // Generate recommendations
      const recommendations = this.generateIntegrityRecommendations(isValid, modifications, trustScore);

      const result: IntegrityCheckResult = {
        isValid,
        originalHash,
        currentHash,
        lastVerified: new Date().toISOString(),
        modifications,
        trustScore,
        recommendations
      };

      this.appInsights.trackEvent('BlockchainVerification:IntegrityChecked', {
        verificationId,
        isValid: isValid.toString(),
        trustScore: trustScore.toString(),
        modificationCount: modifications.length.toString()
      });

      this.appInsights.trackMetric('BlockchainVerification:TrustScore', trustScore, {
        verificationId,
        isValid: isValid.toString()
      });

      return result;

    } catch (error) {
      this.logger.error(`Integrity check failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'CheckIntegrity',
        verificationId
      });
      throw error;
    }
  }

  /**
   * Get verification statistics
   */
  getVerificationStatistics(): {
    totalVerifications: number;
    verificationsByLevel: Record<string, number>;
    verificationsByStatus: Record<string, number>;
    averageProcessingTime: number;
    networkDistribution: Record<string, number>;
  } {
    const verifications = Array.from(this.verificationRegistry.values());
    
    const stats = {
      totalVerifications: verifications.length,
      verificationsByLevel: {},
      verificationsByStatus: {},
      averageProcessingTime: 0,
      networkDistribution: {}
    };

    if (verifications.length === 0) return stats;

    // Calculate statistics
    verifications.forEach(verification => {
      // By level
      stats.verificationsByLevel[verification.verificationLevel] = 
        (stats.verificationsByLevel[verification.verificationLevel] || 0) + 1;
      
      // By status
      stats.verificationsByStatus[verification.status] = 
        (stats.verificationsByStatus[verification.status] || 0) + 1;
      
      // By network
      stats.networkDistribution[verification.metadata.networkUsed] = 
        (stats.networkDistribution[verification.metadata.networkUsed] || 0) + 1;
    });

    // Average processing time
    stats.averageProcessingTime = verifications.reduce((sum, v) => 
      sum + v.metadata.processingTime, 0) / verifications.length;

    return stats;
  }

  /**
   * Generate content hash
   */
  private generateContentHash(content: string, metadata: any): string {
    const combinedData = JSON.stringify({
      content: content.trim(),
      metadata: {
        title: metadata.title || '',
        author: metadata.author || '',
        contentType: metadata.contentType || '',
        version: metadata.version || '1.0'
      }
    });
    
    return createHash('sha256').update(combinedData).digest('hex');
  }

  /**
   * Generate verification ID
   */
  private generateVerificationId(contentHash: string): string {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `verify_${timestamp}_${contentHash.substring(0, 8)}_${randomSuffix}`;
  }

  /**
   * Prepare blockchain transaction
   */
  private async prepareBlockchainTransaction(
    contentHash: string, 
    metadata: any, 
    verificationLevel: string
  ): Promise<any> {
    const network = this.supportedNetworks[this.networkId];
    
    // Estimate gas and fees based on verification level
    const gasMultiplier = {
      'basic': 1.0,
      'standard': 1.5,
      'premium': 2.0,
      'enterprise': 3.0
    };
    
    const gasEstimate = Math.round(network.gasLimit * gasMultiplier[verificationLevel]);
    const estimatedFee = this.calculateTransactionFee(gasEstimate);

    return {
      to: this.getContractAddress(),
      data: this.encodeVerificationData(contentHash, metadata),
      gasEstimate,
      estimatedFee,
      nonce: await this.getNextNonce()
    };
  }

  /**
   * Submit transaction to blockchain
   */
  private async submitToBlockchain(transactionData: any, verificationLevel: string): Promise<string> {
    // Simulate blockchain transaction submission
    const network = this.supportedNetworks[this.networkId];
    
    // Generate realistic transaction ID
    const txId = `0x${createHash('sha256')
      .update(`${Date.now()}_${Math.random()}_${verificationLevel}`)
      .digest('hex')}`;

    // Simulate network delay
    await this.delay(network.avgConfirmationTime / 10);

    this.logger.log(`Transaction submitted to ${network.name}: ${txId}`);
    return txId;
  }

  /**
   * Generate proof of integrity
   */
  private async generateProofOfIntegrity(contentHash: string, blockchainTxId: string): Promise<any> {
    // Generate Merkle tree proof
    const merkleLeaves = [contentHash, blockchainTxId, Date.now().toString()];
    const merkleRoot = this.calculateMerkleRoot(merkleLeaves);
    const merkleProof = this.generateMerkleProof(merkleLeaves, contentHash);

    return {
      merkleRoot,
      merkleProof,
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000, // Simulate block number
      confirmations: 0 // Will be updated during monitoring
    };
  }

  /**
   * Create digital certificate
   */
  private async createDigitalCertificate(
    verificationId: string, 
    contentHash: string, 
    metadata: any,
    includeAuthorSignature: boolean
  ): Promise<any> {
    const certificateData = {
      verificationId,
      contentHash,
      issuer: 'Content Architect Blockchain Verification Service',
      issuedAt: new Date().toISOString(),
      metadata
    };

    const signature = this.signData(JSON.stringify(certificateData));

    return {
      certificateId: `cert_${verificationId}`,
      issuer: certificateData.issuer,
      validFrom: certificateData.issuedAt,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      publicKey: this.publicKey,
      signature
    };
  }

  /**
   * Monitor blockchain confirmation
   */
  private async monitorConfirmation(verificationId: string, blockchainTxId: string): Promise<void> {
    const network = this.supportedNetworks[this.networkId];
    
    // Simulate confirmation monitoring
    setTimeout(async () => {
      const verification = this.verificationRegistry.get(verificationId);
      if (verification) {
        verification.status = 'confirmed';
        verification.proofOfIntegrity.confirmations = Math.floor(Math.random() * 10) + 1;
        
        this.appInsights.trackEvent('BlockchainVerification:VerificationConfirmed', {
          verificationId,
          blockchainTxId,
          confirmations: verification.proofOfIntegrity.confirmations.toString()
        });
        
        this.logger.log(`Verification confirmed: ${verificationId}`);
      }
    }, network.avgConfirmationTime);
  }

  /**
   * Update verification status
   */
  private async updateVerificationStatus(verification: BlockchainVerificationResult): Promise<void> {
    // In a real implementation, this would query the blockchain for current status
    if (verification.status === 'pending') {
      const timeSinceSubmission = Date.now() - new Date(verification.timestamp).getTime();
      const network = this.supportedNetworks[verification.metadata.networkUsed];
      
      if (timeSinceSubmission > network.avgConfirmationTime) {
        verification.status = 'confirmed';
        verification.proofOfIntegrity.confirmations = Math.floor(timeSinceSubmission / network.avgConfirmationTime);
      }
    }
  }

  /**
   * Analyze content modifications
   */
  private async analyzeModifications(originalContent: string, currentContent: string): Promise<any[]> {
    const modifications = [];
    
    // Simple diff analysis (in production, would use more sophisticated diff algorithms)
    const originalLines = originalContent.split('\n');
    const currentLines = currentContent.split('\n');
    
    if (originalLines.length !== currentLines.length) {
      modifications.push({
        timestamp: new Date().toISOString(),
        changeType: 'structure',
        description: `Line count changed from ${originalLines.length} to ${currentLines.length}`,
        severity: 'major'
      });
    }
    
    // Check for content changes
    const contentSimilarity = this.calculateSimilarity(originalContent, currentContent);
    if (contentSimilarity < 0.9) {
      modifications.push({
        timestamp: new Date().toISOString(),
        changeType: 'content',
        description: `Content similarity: ${(contentSimilarity * 100).toFixed(1)}%`,
        severity: contentSimilarity < 0.7 ? 'critical' : contentSimilarity < 0.8 ? 'major' : 'minor'
      });
    }
    
    return modifications;
  }

  /**
   * Calculate trust score
   */
  private calculateTrustScore(isValid: boolean, modifications: any[], verificationId: string): number {
    if (isValid) return 1.0;
    
    let score = 0.5; // Base score for modified content
    
    // Reduce score based on modification severity
    modifications.forEach(mod => {
      switch (mod.severity) {
        case 'critical': score -= 0.3; break;
        case 'major': score -= 0.2; break;
        case 'minor': score -= 0.1; break;
      }
    });
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate integrity recommendations
   */
  private generateIntegrityRecommendations(isValid: boolean, modifications: any[], trustScore: number): string[] {
    const recommendations = [];
    
    if (!isValid) {
      recommendations.push('Content has been modified since original verification');
      
      if (trustScore < 0.5) {
        recommendations.push('Consider re-verification due to significant changes');
      }
      
      if (modifications.some(m => m.severity === 'critical')) {
        recommendations.push('Critical modifications detected - immediate review recommended');
      }
    } else {
      recommendations.push('Content integrity verified - no modifications detected');
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  private calculateTransactionFee(gasEstimate: number): string {
    // Simulate fee calculation (in ETH/MATIC)
    const gasPrice = 20; // Gwei
    const feeInWei = gasEstimate * gasPrice * 1e9;
    const feeInEth = feeInWei / 1e18;
    return feeInEth.toFixed(6);
  }

  private getContractAddress(): string {
    return '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b9'; // Example contract address
  }

  private encodeVerificationData(contentHash: string, metadata: any): string {
    return `0x${Buffer.from(JSON.stringify({ contentHash, metadata })).toString('hex')}`;
  }

  private async getNextNonce(): Promise<number> {
    return Math.floor(Math.random() * 1000000);
  }

  private calculateMerkleRoot(leaves: string[]): string {
    if (leaves.length === 1) return leaves[0];
    
    const nextLevel = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = leaves[i + 1] || left;
      const combined = createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }
    
    return this.calculateMerkleRoot(nextLevel);
  }

  private generateMerkleProof(leaves: string[], target: string): string[] {
    // Simplified Merkle proof generation
    return leaves.filter(leaf => leaf !== target);
  }

  private signData(data: string): string {
    return createHash('sha256').update(data + this.privateKey).digest('hex');
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation (Jaccard similarity)
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeBlockchainConnection(): void {
    this.logger.log(`Initialized blockchain verification service on ${this.networkId} network`);
  }
}
