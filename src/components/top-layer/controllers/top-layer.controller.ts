import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EeatSignalGeneratorService } from '../services/eeat-signal-generator.service';
import { OriginalResearchEngineService } from '../services/original-research-engine.service';
import { CitationAuthorityVerifierService } from '../services/citation-authority-verifier.service';
import { SchemaMarkupGeneratorService } from '../services/schema-markup-generator.service';

@ApiTags('top-layer')
@Controller('top-layer')
export class TopLayerController {
  constructor(
    private readonly eeatSignalGeneratorService: EeatSignalGeneratorService,
    private readonly originalResearchEngineService: OriginalResearchEngineService,
    private readonly citationAuthorityVerifierService: CitationAuthorityVerifierService,
    private readonly schemaMarkupGeneratorService: SchemaMarkupGeneratorService,
  ) {}

  @Post('analyze-eeat-signals')
  @ApiOperation({ summary: 'Analyze E-E-A-T signals in content' })
  @ApiBody({ 
    schema: {
      type: 'object', 
      properties: {
        content: { type: 'object', description: 'Content to analyze' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'E-E-A-T signals analyzed successfully' })
  async analyzeEeatSignals(@Body() data: any) {
    return this.eeatSignalGeneratorService.analyzeEeatSignals(
      data.content, 
      data.segment
    );
  }

  @Post('enhance-eeat-signals')
  @ApiOperation({ summary: 'Enhance content with E-E-A-T signals' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to enhance' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'E-E-A-T signals enhanced successfully' })
  async enhanceEeatSignals(@Body() data: any) {
    return this.eeatSignalGeneratorService.enhanceEeatSignals(
      data.content,
      data.segment
    );
  }

  @Post('generate-original-research')
  @ApiOperation({ summary: 'Generate original research for a topic' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic to research' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['topic', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Original research generated successfully' })
  async generateOriginalResearch(@Body() data: any) {
    return this.originalResearchEngineService.generateOriginalResearch(
      data.topic,
      data.contentType || 'blog_post',
      data.segment
    );
  }

  @Post('generate-research')
  @ApiOperation({ summary: 'Generate research (orchestration alias)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic to research' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
        contentType: { type: 'string', description: 'Type of content' },
      },
      required: ['topic', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Research generated successfully' })
  async generateResearch(@Body() data: any) {
    return this.originalResearchEngineService.generateOriginalResearch(
      data.topic,
      data.contentType || 'blog_post',
      data.segment
    );
  }

  @Post('integrate-research')
  @ApiOperation({ summary: 'Integrate research into content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to enhance' },
        researchData: { type: 'object', description: 'Research data to integrate' },
      },
      required: ['content', 'researchData'],
    },
  })
  @ApiResponse({ status: 201, description: 'Research integrated successfully' })
  async integrateResearch(@Body() data: any) {
    return this.originalResearchEngineService.integrateResearchIntoContent(
      data.content,
      data.researchData
    );
  }

  @Post('identify-research-gaps')
  @ApiOperation({ summary: 'Identify research gap opportunities' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to analyze' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Research gaps identified' })
  async identifyResearchGaps(@Body() data: any) {
    return this.originalResearchEngineService.identifyResearchGaps(
      data.content,
      data.segment
    );
  }

  @Post('verify-citations')
  @ApiOperation({ summary: 'Verify citations in content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content with citations' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Citations verified successfully' })
  async verifyCitations(@Body() data: any) {
    return this.citationAuthorityVerifierService.verifyCitations(
      data.content,
      data.segment
    );
  }

  @Post('enhance-citation-authority')
  @ApiOperation({ summary: 'Enhance citations with more authoritative sources' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to enhance' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Citation authority enhanced successfully' })
  async enhanceCitations(@Body() data: any) {
    return this.citationAuthorityVerifierService.enhanceCitationAuthority(
      data.content,
      data.segment
    );
  }

  @Post('citation-strategy')
  @ApiOperation({ summary: 'Generate citation strategy' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Content topic' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['topic', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Citation strategy generated successfully' })
  async generateCitationStrategy(@Body() data: any) {
    return this.citationAuthorityVerifierService.generateCitationStrategy(
      data.topic,
      data.segment
    );
  }

  @Post('generate-schema')
  @ApiOperation({ summary: 'Generate schema markup for content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to generate schema for' },
        contentType: { type: 'string', description: 'Type of content (article, faq, etc.)' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'contentType', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Schema markup generated successfully' })
  async generateSchema(@Body() data: any) {
    return this.schemaMarkupGeneratorService.generateSchemaMarkup(
      data.content,
      data.contentType,
      data.segment
    );
  }

  @Post('analyze-for-schema')
  @ApiOperation({ summary: 'Analyze content for schema recommendations' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'object', description: 'Content to analyze' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Schema recommendations provided' })
  async analyzeForSchema(@Body() data: any) {
    return this.schemaMarkupGeneratorService.analyzeContentForSchemaRecommendations(
      data.content,
      data.segment
    );
  }

  @Post('enhance-schema')
  @ApiOperation({ summary: 'Enhance existing schema markup' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        existingSchema: { type: 'object', description: 'Existing schema markup' },
        content: { type: 'object', description: 'Content to derive properties from' },
        segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
      },
      required: ['existingSchema', 'content', 'segment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Schema enhanced successfully' })
  async enhanceSchema(@Body() data: any) {
    return this.schemaMarkupGeneratorService.enhanceSchemaMarkup(
      data.existingSchema,
      data.content,
      data.segment
    );
  }
}
