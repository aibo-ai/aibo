import { apiRequest } from './api';

export interface Project {
  id: string;
  name: string;
  description: string;
  industry: string;
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
  userType: 'b2b' | 'b2c';
}

export interface ContentDetails {
  title: string;
  keywords: string;
  targetWordCount: number;
  [key: string]: any; // For dynamic content type-specific fields
}

export interface AdvancedOptions {
  useOriginalResearch: boolean;
  optimizeForSemanticSearch: boolean;
  includeOutlineFirst: boolean;
  preferredStyle: string;
  citationStyle: string;
  excludedTerms: string;
  seoOptimizationLevel: string;
  contentFormat: string;
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
}

export interface GeneratedContent {
  id: string;
  projectId: string;
  title: string;
  contentType: string;
  summary: string;
  sections: ContentSection[];
  keywords: string[];
  // Using score as the standard property for content metrics
  score: {
    overall: number;
    readability: number;
    seo: number;
    engagement: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContentRequest {
  projectId?: string;
  contentType: string;
  details: ContentDetails;
  options: AdvancedOptions;
}

export interface ContentListResponse {
  contents: GeneratedContent[];
  total: number;
  page: number;
  limit: number;
}

export interface ContentStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedCompletionTime?: string;
  error?: string;
}

// Create a new project
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  return apiRequest<Project>({
    method: 'POST',
    url: '/projects',
    data: project,
  });
};

// Get all projects
export const getProjects = async () => {
  return apiRequest<Project[]>({
    method: 'GET',
    url: '/projects',
  });
};

// Get project by ID
export const getProjectById = async (id: string) => {
  return apiRequest<Project>({
    method: 'GET',
    url: `/projects/${id}`,
  });
};

// Generate content based on content type, details, and options
export const generateContent = async (request: ContentRequest) => {
  return apiRequest<{ taskId: string }>({
    method: 'POST',
    url: '/content/generate',
    data: request,
  });
};

// Get content generation status
export const getGenerationStatus = async (taskId: string) => {
  return apiRequest<{ status: string; progress: number; message: string }>({
    method: 'GET',
    url: `/content/status/${taskId}`,
  });
};

// Get generated content by ID
export const getContentById = async (id: string) => {
  return apiRequest<GeneratedContent>({
    method: 'GET',
    url: `/content/${id}`,
  });
};

// Get all content entries with pagination
export const getAllContent = async (page = 1, limit = 10) => {
  return apiRequest<ContentListResponse>({
    method: 'GET',
    url: '/content',
    params: { page, limit },
  });
};

// Update generated content
export const updateContent = async (id: string, updates: Partial<GeneratedContent>) => {
  return apiRequest<GeneratedContent>({
    method: 'PATCH',
    url: `/content/${id}`,
    data: updates,
  });
};

// Delete content
export const deleteContent = async (id: string) => {
  return apiRequest<{ success: boolean }>({
    method: 'DELETE',
    url: `/content/${id}`,
  });
};
