const { CosmosClient } = require('@azure/cosmos');
const crypto = require('crypto');

class ContentVersioningService {
  constructor() {
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });
    this.database = this.cosmosClient.database('ContentArchitect');
    this.versionsContainer = this.database.container('ContentVersions');
    this.historyContainer = this.database.container('ContentHistory');
  }

  /**
   * Create a new content version
   */
  async createVersion(contentData, metadata = {}) {
    const versionId = this.generateVersionId();
    const timestamp = new Date().toISOString();
    
    const version = {
      id: versionId,
      contentId: contentData.contentId,
      version: await this.getNextVersionNumber(contentData.contentId),
      content: contentData,
      metadata: {
        ...metadata,
        createdAt: timestamp,
        createdBy: metadata.userId || 'system',
        layerResults: contentData.layerResults,
        performanceMetrics: contentData.performanceMetrics,
        qualityScore: contentData.data?.metadata?.qualityScore || 0,
        eeatScore: contentData.data?.metadata?.eeatScore || 0,
        authorityRanking: contentData.data?.metadata?.authorityRanking || 'Unknown'
      },
      status: 'active',
      tags: metadata.tags || [],
      parentVersion: metadata.parentVersion || null,
      branchName: metadata.branchName || 'main',
      changeLog: metadata.changeLog || 'Initial version',
      hash: this.generateContentHash(contentData)
    };

    try {
      const { resource } = await this.versionsContainer.items.create(version);
      
      // Create history entry
      await this.createHistoryEntry({
        contentId: contentData.contentId,
        versionId: versionId,
        action: 'CREATE_VERSION',
        details: {
          version: version.version,
          changeLog: version.changeLog,
          qualityScore: version.metadata.qualityScore
        },
        timestamp,
        userId: metadata.userId || 'system'
      });

      console.log(`✅ Content version ${version.version} created for ${contentData.contentId}`);
      return resource;
    } catch (error) {
      console.error('❌ Error creating content version:', error);
      throw error;
    }
  }

  /**
   * Get all versions for a content ID
   */
  async getVersionHistory(contentId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      branchName = null,
      includeInactive = false
    } = options;

    try {
      let query = `
        SELECT * FROM c 
        WHERE c.contentId = @contentId
      `;
      
      const parameters = [{ name: '@contentId', value: contentId }];

      if (branchName) {
        query += ` AND c.branchName = @branchName`;
        parameters.push({ name: '@branchName', value: branchName });
      }

      if (!includeInactive) {
        query += ` AND c.status = 'active'`;
      }

      query += ` ORDER BY c.version DESC OFFSET @offset LIMIT @limit`;
      parameters.push(
        { name: '@offset', value: offset },
        { name: '@limit', value: limit }
      );

      const { resources } = await this.versionsContainer.items.query({
        query,
        parameters
      }).fetchAll();

      return {
        versions: resources,
        total: resources.length,
        hasMore: resources.length === limit
      };
    } catch (error) {
      console.error('❌ Error getting version history:', error);
      throw error;
    }
  }

  /**
   * Get specific version
   */
  async getVersion(versionId) {
    try {
      const { resource } = await this.versionsContainer.item(versionId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      console.error('❌ Error getting version:', error);
      throw error;
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1, versionId2) {
    try {
      const [version1, version2] = await Promise.all([
        this.getVersion(versionId1),
        this.getVersion(versionId2)
      ]);

      if (!version1 || !version2) {
        throw new Error('One or both versions not found');
      }

      const comparison = {
        version1: {
          id: version1.id,
          version: version1.version,
          createdAt: version1.metadata.createdAt,
          qualityScore: version1.metadata.qualityScore,
          eeatScore: version1.metadata.eeatScore
        },
        version2: {
          id: version2.id,
          version: version2.version,
          createdAt: version2.metadata.createdAt,
          qualityScore: version2.metadata.qualityScore,
          eeatScore: version2.metadata.eeatScore
        },
        differences: this.calculateDifferences(version1, version2),
        qualityImprovement: version2.metadata.qualityScore - version1.metadata.qualityScore,
        eeatImprovement: version2.metadata.eeatScore - version1.metadata.eeatScore,
        contentChanges: this.analyzeContentChanges(version1.content, version2.content)
      };

      return comparison;
    } catch (error) {
      console.error('❌ Error comparing versions:', error);
      throw error;
    }
  }

  /**
   * Restore a version (create new version from old one)
   */
  async restoreVersion(versionId, metadata = {}) {
    try {
      const version = await this.getVersion(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // Create new version based on the restored content
      const restoredContent = {
        ...version.content,
        contentId: version.contentId // Keep same content ID
      };

      const newVersion = await this.createVersion(restoredContent, {
        ...metadata,
        parentVersion: versionId,
        changeLog: `Restored from version ${version.version}`,
        tags: [...(metadata.tags || []), 'restored']
      });

      await this.createHistoryEntry({
        contentId: version.contentId,
        versionId: newVersion.id,
        action: 'RESTORE_VERSION',
        details: {
          restoredFromVersion: version.version,
          restoredToVersion: newVersion.version
        },
        timestamp: new Date().toISOString(),
        userId: metadata.userId || 'system'
      });

      return newVersion;
    } catch (error) {
      console.error('❌ Error restoring version:', error);
      throw error;
    }
  }

  /**
   * Create a branch from a version
   */
  async createBranch(versionId, branchName, metadata = {}) {
    try {
      const version = await this.getVersion(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      const branchedContent = {
        ...version.content,
        contentId: `${version.contentId}_${branchName}`
      };

      const newVersion = await this.createVersion(branchedContent, {
        ...metadata,
        parentVersion: versionId,
        branchName,
        changeLog: `Branched from version ${version.version}`,
        tags: [...(metadata.tags || []), 'branch']
      });

      await this.createHistoryEntry({
        contentId: version.contentId,
        versionId: newVersion.id,
        action: 'CREATE_BRANCH',
        details: {
          branchName,
          sourceVersion: version.version
        },
        timestamp: new Date().toISOString(),
        userId: metadata.userId || 'system'
      });

      return newVersion;
    } catch (error) {
      console.error('❌ Error creating branch:', error);
      throw error;
    }
  }

  /**
   * Get content history (all actions)
   */
  async getContentHistory(contentId, limit = 100) {
    try {
      const { resources } = await this.historyContainer.items.query({
        query: `
          SELECT * FROM c 
          WHERE c.contentId = @contentId 
          ORDER BY c.timestamp DESC 
          OFFSET 0 LIMIT @limit
        `,
        parameters: [
          { name: '@contentId', value: contentId },
          { name: '@limit', value: limit }
        ]
      }).fetchAll();

      return resources;
    } catch (error) {
      console.error('❌ Error getting content history:', error);
      throw error;
    }
  }

  /**
   * Archive old versions
   */
  async archiveOldVersions(contentId, keepVersions = 10) {
    try {
      const versions = await this.getVersionHistory(contentId, { 
        limit: 1000, 
        includeInactive: false 
      });

      if (versions.versions.length <= keepVersions) {
        return { archived: 0, message: 'No versions to archive' };
      }

      const versionsToArchive = versions.versions.slice(keepVersions);
      let archivedCount = 0;

      for (const version of versionsToArchive) {
        await this.versionsContainer.item(version.id).patch([
          { op: 'replace', path: '/status', value: 'archived' }
        ]);
        archivedCount++;
      }

      await this.createHistoryEntry({
        contentId,
        action: 'ARCHIVE_VERSIONS',
        details: {
          archivedCount,
          keepVersions
        },
        timestamp: new Date().toISOString(),
        userId: 'system'
      });

      return { archived: archivedCount, message: `Archived ${archivedCount} old versions` };
    } catch (error) {
      console.error('❌ Error archiving versions:', error);
      throw error;
    }
  }

  // Helper methods
  generateVersionId() {
    return `version_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  async getNextVersionNumber(contentId) {
    try {
      const { resources } = await this.versionsContainer.items.query({
        query: `
          SELECT VALUE MAX(c.version) FROM c 
          WHERE c.contentId = @contentId AND c.status = 'active'
        `,
        parameters: [{ name: '@contentId', value: contentId }]
      }).fetchAll();

      return (resources[0] || 0) + 1;
    } catch (error) {
      return 1;
    }
  }

  generateContentHash(content) {
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  async createHistoryEntry(entry) {
    try {
      const historyEntry = {
        id: `history_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        ...entry
      };
      await this.historyContainer.items.create(historyEntry);
    } catch (error) {
      console.error('❌ Error creating history entry:', error);
    }
  }

  calculateDifferences(version1, version2) {
    return {
      contentChanged: version1.hash !== version2.hash,
      metadataChanged: JSON.stringify(version1.metadata) !== JSON.stringify(version2.metadata),
      qualityDelta: version2.metadata.qualityScore - version1.metadata.qualityScore,
      eeatDelta: version2.metadata.eeatScore - version1.metadata.eeatScore,
      timeDifference: new Date(version2.metadata.createdAt) - new Date(version1.metadata.createdAt)
    };
  }

  analyzeContentChanges(content1, content2) {
    const changes = {
      titleChanged: content1.data?.title !== content2.data?.title,
      sectionsChanged: content1.data?.sections?.length !== content2.data?.sections?.length,
      metadataChanged: JSON.stringify(content1.data?.metadata) !== JSON.stringify(content2.data?.metadata),
      layerResultsChanged: JSON.stringify(content1.layerResults) !== JSON.stringify(content2.layerResults)
    };

    return changes;
  }
}

module.exports = { ContentVersioningService };
