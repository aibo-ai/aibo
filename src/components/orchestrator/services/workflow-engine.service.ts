import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

export interface WorkflowStep {
  name: string;
  layer: 'bottom' | 'middle' | 'top';
  service: string;
  required: boolean;
  dependsOn?: string[];
  timeout?: number;
  retryable?: boolean;
  condition?: string; // Conditional execution
  parameters?: any;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'standard' | 'research_heavy' | 'seo_focused' | 'citation_heavy' | 'custom';
  steps: WorkflowStep[];
  estimatedDuration: number; // in minutes
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private readonly workflows = new Map<string, Workflow>();

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.initializeDefaultWorkflows();
  }

  /**
   * Get workflow by type
   */
  async getWorkflow(type: string): Promise<Workflow> {
    const workflow = Array.from(this.workflows.values()).find(w => w.type === type && w.isActive);
    
    if (!workflow) {
      throw new Error(`Workflow not found for type: ${type}`);
    }

    this.appInsights.trackEvent('WorkflowEngine:WorkflowRequested', {
      workflowId: workflow.id,
      type: workflow.type
    });

    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  /**
   * Get all available workflows
   */
  async getAvailableWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(w => w.isActive);
  }

  /**
   * Create custom workflow
   */
  async createWorkflow(workflowData: Partial<Workflow>): Promise<Workflow> {
    const workflow: Workflow = {
      id: workflowData.id || this.generateWorkflowId(),
      name: workflowData.name || 'Custom Workflow',
      description: workflowData.description || 'Custom content generation workflow',
      version: workflowData.version || '1.0.0',
      type: 'custom',
      steps: workflowData.steps || [],
      estimatedDuration: workflowData.estimatedDuration || this.calculateEstimatedDuration(workflowData.steps || []),
      tags: workflowData.tags || ['custom'],
      isActive: workflowData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate workflow
    this.validateWorkflow(workflow);

    this.workflows.set(workflow.id, workflow);

    this.logger.log(`Custom workflow created: ${workflow.id}`);
    
    this.appInsights.trackEvent('WorkflowEngine:WorkflowCreated', {
      workflowId: workflow.id,
      type: workflow.type,
      stepCount: workflow.steps.length
    });

    return workflow;
  }

  /**
   * Update existing workflow
   */
  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(id);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`);
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // Validate updated workflow
    this.validateWorkflow(updatedWorkflow);

    this.workflows.set(id, updatedWorkflow);

    this.logger.log(`Workflow updated: ${id}`);
    
    this.appInsights.trackEvent('WorkflowEngine:WorkflowUpdated', {
      workflowId: id,
      type: updatedWorkflow.type
    });

    return updatedWorkflow;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`);
    }

    this.workflows.delete(id);

    this.logger.log(`Workflow deleted: ${id}`);
    
    this.appInsights.trackEvent('WorkflowEngine:WorkflowDeleted', {
      workflowId: id,
      type: workflow.type
    });
  }

  /**
   * Validate workflow dependencies
   */
  async validateWorkflowDependencies(workflow: Workflow): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stepNames = new Set(workflow.steps.map(step => step.name));

    // Check dependencies
    for (const step of workflow.steps) {
      if (step.dependsOn) {
        for (const dependency of step.dependsOn) {
          if (!stepNames.has(dependency)) {
            errors.push(`Step '${step.name}' depends on non-existent step '${dependency}'`);
          }
        }
      }

      // Check for circular dependencies
      if (this.hasCircularDependency(workflow.steps, step.name)) {
        errors.push(`Circular dependency detected involving step '${step.name}'`);
      }
    }

    // Check for required services
    const requiredSteps = workflow.steps.filter(step => step.required);
    if (requiredSteps.length === 0) {
      warnings.push('No required steps defined in workflow');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get workflow execution order
   */
  async getExecutionOrder(workflow: Workflow): Promise<WorkflowStep[]> {
    const steps = [...workflow.steps];
    const ordered: WorkflowStep[] = [];
    const processed = new Set<string>();

    // Topological sort to handle dependencies
    while (ordered.length < steps.length) {
      const readySteps = steps.filter(step => 
        !processed.has(step.name) &&
        (!step.dependsOn || step.dependsOn.every(dep => processed.has(dep)))
      );

      if (readySteps.length === 0) {
        throw new Error('Circular dependency or unresolvable dependencies detected');
      }

      // Sort by layer order (bottom -> middle -> top)
      readySteps.sort((a, b) => {
        const layerOrder = { bottom: 0, middle: 1, top: 2 };
        return layerOrder[a.layer] - layerOrder[b.layer];
      });

      for (const step of readySteps) {
        ordered.push(step);
        processed.add(step.name);
      }
    }

    return ordered;
  }

  /**
   * Initialize default workflows
   */
  private initializeDefaultWorkflows(): void {
    // Standard workflow
    this.workflows.set('standard', {
      id: 'standard',
      name: 'Standard Content Generation',
      description: 'Standard workflow for general content generation',
      version: '1.0.0',
      type: 'standard',
      steps: [
        // Bottom layer
        {
          name: 'analyze_intent',
          layer: 'bottom',
          service: 'queryIntentAnalyzer',
          required: true,
          timeout: 30000
        },
        {
          name: 'analyze_keywords',
          layer: 'bottom',
          service: 'keywordTopicAnalyzer',
          required: true,
          timeout: 30000
        },
        // Middle layer
        {
          name: 'structure_content',
          layer: 'middle',
          service: 'blufContentStructurer',
          required: true,
          dependsOn: ['analyze_intent'],
          timeout: 45000
        },
        {
          name: 'optimize_queries',
          layer: 'middle',
          service: 'conversationalQueryOptimizer',
          required: false,
          dependsOn: ['analyze_keywords'],
          timeout: 30000
        },
        // Top layer
        {
          name: 'optimize_content',
          layer: 'top',
          service: 'llmContentOptimizer',
          required: true,
          dependsOn: ['structure_content'],
          timeout: 120000
        }
      ],
      estimatedDuration: 5,
      tags: ['standard', 'general'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Research-heavy workflow
    this.workflows.set('research_heavy', {
      id: 'research_heavy',
      name: 'Research-Heavy Content Generation',
      description: 'Workflow with extensive research and citation verification',
      version: '1.0.0',
      type: 'research_heavy',
      steps: [
        // Bottom layer
        {
          name: 'analyze_intent',
          layer: 'bottom',
          service: 'queryIntentAnalyzer',
          required: true,
          timeout: 30000
        },
        {
          name: 'analyze_keywords',
          layer: 'bottom',
          service: 'keywordTopicAnalyzer',
          required: true,
          timeout: 30000
        },
        {
          name: 'aggregate_freshness',
          layer: 'bottom',
          service: 'freshnessAggregator',
          required: true,
          timeout: 60000
        },
        // Middle layer
        {
          name: 'structure_content',
          layer: 'middle',
          service: 'blufContentStructurer',
          required: true,
          dependsOn: ['analyze_intent'],
          timeout: 45000
        },
        {
          name: 'map_relationships',
          layer: 'middle',
          service: 'semanticRelationshipMapper',
          required: true,
          dependsOn: ['analyze_keywords'],
          timeout: 60000
        },
        // Top layer
        {
          name: 'generate_research',
          layer: 'top',
          service: 'originalResearchEngine',
          required: true,
          dependsOn: ['aggregate_freshness'],
          timeout: 180000
        },
        {
          name: 'optimize_content',
          layer: 'top',
          service: 'llmContentOptimizer',
          required: true,
          dependsOn: ['structure_content', 'generate_research'],
          timeout: 120000
        },
        {
          name: 'verify_citations',
          layer: 'top',
          service: 'citationAuthorityVerifier',
          required: true,
          dependsOn: ['optimize_content'],
          timeout: 90000
        },
        {
          name: 'generate_eeat',
          layer: 'top',
          service: 'eeatSignalGenerator',
          required: true,
          dependsOn: ['verify_citations'],
          timeout: 60000
        }
      ],
      estimatedDuration: 12,
      tags: ['research', 'citations', 'authority'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // SEO-focused workflow
    this.workflows.set('seo_focused', {
      id: 'seo_focused',
      name: 'SEO-Focused Content Generation',
      description: 'Workflow optimized for search engine optimization',
      version: '1.0.0',
      type: 'seo_focused',
      steps: [
        // Bottom layer
        {
          name: 'analyze_intent',
          layer: 'bottom',
          service: 'queryIntentAnalyzer',
          required: true,
          timeout: 30000
        },
        {
          name: 'analyze_keywords',
          layer: 'bottom',
          service: 'keywordTopicAnalyzer',
          required: true,
          timeout: 30000
        },
        // Middle layer
        {
          name: 'optimize_queries',
          layer: 'middle',
          service: 'conversationalQueryOptimizer',
          required: true,
          dependsOn: ['analyze_keywords'],
          timeout: 30000
        },
        {
          name: 'tune_platform',
          layer: 'middle',
          service: 'platformSpecificTuner',
          required: true,
          dependsOn: ['analyze_intent'],
          timeout: 45000
        },
        {
          name: 'structure_content',
          layer: 'middle',
          service: 'blufContentStructurer',
          required: true,
          dependsOn: ['optimize_queries'],
          timeout: 45000
        },
        // Top layer
        {
          name: 'optimize_content',
          layer: 'top',
          service: 'llmContentOptimizer',
          required: true,
          dependsOn: ['structure_content', 'tune_platform'],
          timeout: 120000
        },
        {
          name: 'generate_schema',
          layer: 'top',
          service: 'schemaMarkupGenerator',
          required: true,
          dependsOn: ['optimize_content'],
          timeout: 30000
        }
      ],
      estimatedDuration: 8,
      tags: ['seo', 'optimization', 'schema'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Citation-heavy workflow
    this.workflows.set('citation_heavy', {
      id: 'citation_heavy',
      name: 'Citation-Heavy Content Generation',
      description: 'Workflow with extensive citation verification and authority building',
      version: '1.0.0',
      type: 'citation_heavy',
      steps: [
        // Bottom layer
        {
          name: 'analyze_intent',
          layer: 'bottom',
          service: 'queryIntentAnalyzer',
          required: true,
          timeout: 30000
        },
        {
          name: 'analyze_keywords',
          layer: 'bottom',
          service: 'keywordTopicAnalyzer',
          required: true,
          timeout: 30000
        },
        // Middle layer
        {
          name: 'structure_content',
          layer: 'middle',
          service: 'blufContentStructurer',
          required: true,
          dependsOn: ['analyze_intent'],
          timeout: 45000
        },
        // Top layer
        {
          name: 'optimize_content',
          layer: 'top',
          service: 'llmContentOptimizer',
          required: true,
          dependsOn: ['structure_content'],
          timeout: 120000
        },
        {
          name: 'verify_citations',
          layer: 'top',
          service: 'citationAuthorityVerifier',
          required: true,
          dependsOn: ['optimize_content'],
          timeout: 90000
        },
        {
          name: 'generate_eeat',
          layer: 'top',
          service: 'eeatSignalGenerator',
          required: true,
          dependsOn: ['verify_citations'],
          timeout: 60000
        }
      ],
      estimatedDuration: 10,
      tags: ['citations', 'authority', 'verification'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.logger.log(`Initialized ${this.workflows.size} default workflows`);
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflow(workflow: Workflow): void {
    if (!workflow.name || workflow.name.trim().length === 0) {
      throw new Error('Workflow name is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate step names are unique
    const stepNames = workflow.steps.map(step => step.name);
    const uniqueNames = new Set(stepNames);
    if (stepNames.length !== uniqueNames.size) {
      throw new Error('Step names must be unique');
    }

    // Validate layers
    const validLayers = ['bottom', 'middle', 'top'];
    for (const step of workflow.steps) {
      if (!validLayers.includes(step.layer)) {
        throw new Error(`Invalid layer '${step.layer}' in step '${step.name}'`);
      }
    }
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependency(steps: WorkflowStep[], stepName: string, visited = new Set<string>()): boolean {
    if (visited.has(stepName)) {
      return true;
    }

    visited.add(stepName);

    const step = steps.find(s => s.name === stepName);
    if (step && step.dependsOn) {
      for (const dependency of step.dependsOn) {
        if (this.hasCircularDependency(steps, dependency, new Set(visited))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate estimated duration
   */
  private calculateEstimatedDuration(steps: WorkflowStep[]): number {
    // Base time per layer
    const layerTimes = { bottom: 1, middle: 2, top: 3 };
    
    let totalMinutes = 0;
    for (const step of steps) {
      totalMinutes += layerTimes[step.layer] || 1;
    }

    return Math.max(totalMinutes, 2); // Minimum 2 minutes
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}
