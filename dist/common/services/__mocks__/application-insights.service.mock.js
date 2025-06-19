"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockApplicationInsightsService = void 0;
exports.mockApplicationInsightsService = {
    trackEvent: jest.fn(),
    trackMetric: jest.fn(),
    trackException: jest.fn(),
    trackRequest: jest.fn(),
    trackDependency: jest.fn(),
    startOperation: jest.fn().mockReturnValue({
        operation: { id: 'mock-operation-id', name: 'mock-operation' },
        end: jest.fn()
    }),
    flush: jest.fn()
};
//# sourceMappingURL=application-insights.service.mock.js.map