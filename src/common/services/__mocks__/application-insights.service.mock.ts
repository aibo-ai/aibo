export const mockApplicationInsightsService = {
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
