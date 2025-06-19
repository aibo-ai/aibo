import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('contentArchitect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle session expiration
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('contentArchitect_token');
      // In a real app, you might want to redirect to login here
    }
    return Promise.reject(error);
  }
);

// Generic API request function with error handling
export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const response = await api(config);
    return { data: response.data, error: null };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      data: null,
      error: error instanceof Error 
        ? error 
        : new Error('An unknown error occurred')
    };
  }
};

export default api;
