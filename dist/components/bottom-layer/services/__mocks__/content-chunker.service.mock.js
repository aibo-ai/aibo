"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockContentChunkerService = void 0;
exports.mockContentChunkerService = {
    chunkContent: jest.fn(),
    optimizeChunksForLLM: jest.fn(),
    mergeChunksWithOverlap: jest.fn(),
    estimateTokenCount: jest.fn()
};
//# sourceMappingURL=content-chunker.service.mock.js.map