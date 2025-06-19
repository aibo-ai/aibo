// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Feature flags
export const ENABLE_LLM_FEATURES = process.env.REACT_APP_ENABLE_LLM_FEATURES === 'true';
export const ENABLE_CONTENT_METRICS = process.env.REACT_APP_ENABLE_CONTENT_METRICS === 'true';

// Content configuration
export const DEFAULT_PAGINATION_LIMIT = 10;
