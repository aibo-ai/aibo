// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';

// Feature flags
export const ENABLE_LLM_FEATURES = process.env.REACT_APP_ENABLE_LLM_FEATURES !== 'false'; // Default to true
export const ENABLE_CONTENT_METRICS = process.env.REACT_APP_ENABLE_CONTENT_METRICS !== 'false'; // Default to true
export const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true'; // Default to false - use real API

// Content configuration
export const DEFAULT_PAGINATION_LIMIT = 10;
