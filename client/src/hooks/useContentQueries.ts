import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProject,
  getProjects,
  getProjectById,
  generateContent,
  getGenerationStatus,
  getContentById,
  getAllContent,
  updateContent,
  deleteContent,
  Project,
  ContentRequest,
  GeneratedContent,
  ContentListResponse
} from '../services/contentService';

// Project related hooks
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => 
      createProject(project),
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    select: (response) => response.data
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
    select: (response) => response.data,
    enabled: !!id // Only run if id is provided
  });
};

// Content generation hooks
export const useGenerateContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: ContentRequest) => generateContent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    }
  });
};

export interface StatusResponse {
  status: string;
  progress: number;
  message: string;
  contentId?: string;
}

export const useGenerationStatus = (taskId: string) => {
  return useQuery<ApiResponse<StatusResponse>, Error, ApiResponse<StatusResponse>>({
    queryKey: ['contentStatus', taskId],
    queryFn: () => getGenerationStatus(taskId),
    enabled: !!taskId,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const useContent = (id: string) => {
  return useQuery<ApiResponse<GeneratedContent>, Error, ApiResponse<GeneratedContent>>({
    queryKey: ['content', id],
    queryFn: () => getContentById(id),
    enabled: !!id
  });
};

export const useAllContent = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['content', 'list', page, limit],
    queryFn: () => getAllContent(page, limit),
    select: (response) => response.data
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GeneratedContent> }) => 
      updateContent(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['content', 'list'] });
    }
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'list'] });
    }
  });
};
