"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentChunkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ContentChunkerService = class ContentChunkerService {
    constructor(configService) {
        this.configService = configService;
    }
    async chunkContent(content, chunkType) {
        console.log(`Chunking content using ${chunkType} approach`);
        let chunks = [];
        switch (chunkType) {
            case 'semantic':
                chunks = this.semanticChunking(content);
                break;
            case 'fixed':
                chunks = this.fixedSizeChunking(content);
                break;
            case 'hybrid':
                chunks = this.hybridChunking(content);
                break;
            default:
                chunks = this.semanticChunking(content);
        }
        return {
            originalContentLength: content.length,
            chunkCount: chunks.length,
            chunkType,
            chunks,
            timestamp: new Date().toISOString(),
        };
    }
    async mergeChunksWithOverlap(chunks, overlapPercentage) {
        console.log(`Merging chunks with ${overlapPercentage}% overlap`);
        const mergedChunks = [];
        if (chunks.length <= 1) {
            return chunks;
        }
        for (let i = 0; i < chunks.length - 1; i++) {
            const currentChunk = chunks[i];
            const nextChunk = chunks[i + 1];
            const overlapSize = Math.floor(currentChunk.content.length * (overlapPercentage / 100));
            const mergedContent = currentChunk.content + ' ' + nextChunk.content;
            mergedChunks.push({
                id: `merged-${currentChunk.id}-${nextChunk.id}`,
                content: mergedContent,
                startPosition: currentChunk.startPosition,
                endPosition: nextChunk.endPosition,
                hasOverlap: true,
                overlapSize,
            });
        }
        return mergedChunks;
    }
    async optimizeChunksForLLM(chunks, targetTokenCount) {
        console.log(`Optimizing chunks for LLM with target token count: ${targetTokenCount}`);
        return chunks.map(chunk => {
            const wordCount = chunk.content.split(' ').length;
            const estimatedTokenCount = Math.floor(wordCount / 0.75);
            const needsOptimization = estimatedTokenCount > targetTokenCount;
            return Object.assign(Object.assign({}, chunk), { estimatedTokenCount,
                needsOptimization, optimizationStrategy: needsOptimization ? 'truncation' : 'none', optimizedContent: needsOptimization
                    ? this.truncateToTokenLimit(chunk.content, targetTokenCount)
                    : chunk.content });
        });
    }
    semanticChunking(content) {
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        let position = 0;
        return paragraphs.map((paragraph, index) => {
            const chunk = {
                id: `chunk-${index}`,
                content: paragraph,
                startPosition: position,
                endPosition: position + paragraph.length,
                type: 'semantic_paragraph',
            };
            position += paragraph.length + 2;
            return chunk;
        });
    }
    fixedSizeChunking(content) {
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < content.length; i += chunkSize) {
            const end = Math.min(i + chunkSize, content.length);
            chunks.push({
                id: `chunk-${i}`,
                content: content.substring(i, end),
                startPosition: i,
                endPosition: end,
                type: 'fixed_size',
            });
        }
        return chunks;
    }
    hybridChunking(content) {
        const semanticChunks = this.semanticChunking(content);
        const maxSize = 1500;
        const finalChunks = [];
        for (const chunk of semanticChunks) {
            if (chunk.content.length <= maxSize) {
                finalChunks.push(chunk);
            }
            else {
                const subChunks = [];
                const chunkContent = chunk.content;
                for (let i = 0; i < chunkContent.length; i += maxSize) {
                    const end = Math.min(i + maxSize, chunkContent.length);
                    subChunks.push({
                        id: `${chunk.id}-sub-${i}`,
                        content: chunkContent.substring(i, end),
                        startPosition: chunk.startPosition + i,
                        endPosition: chunk.startPosition + end,
                        type: 'hybrid_subchunk',
                        parentChunkId: chunk.id,
                    });
                }
                finalChunks.push(...subChunks);
            }
        }
        return finalChunks;
    }
    truncateToTokenLimit(content, targetTokenCount) {
        const targetCharCount = targetTokenCount * 4;
        if (content.length <= targetCharCount) {
            return content;
        }
        return content.substring(0, targetCharCount - 3) + '...';
    }
};
exports.ContentChunkerService = ContentChunkerService;
exports.ContentChunkerService = ContentChunkerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ContentChunkerService);
//# sourceMappingURL=content-chunker.service.js.map