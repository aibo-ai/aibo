import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import AzureServices, { 
  ApiResponse,
  ContentGenerationRequest, 
  ContentOptimizationRequest,
  AuthorityAnalysisRequest,
  VectorSearchRequest,
  QueryIntentRequest
} from '../services/azureServices';
import { GeneratedContent, ContentStatus, ContentSection } from '../services/contentService';

/**
 * Hook to analyze query intent using Azure AI Foundry
 */
export const useQueryIntentAnalysis = (query: string) => {
  return useQuery<ApiResponse<any>, Error>({
    queryKey: ['queryIntent', query],
    queryFn: () => AzureServices.analyzeQueryIntent(query),
    enabled: !!query,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (formerly cacheTime)
  });
};

/**
 * Hook to generate content through the Azure Logic App workflow
 */
export const useAzureContentGeneration = () => {
  return useMutation<ApiResponse<GeneratedContent>, Error, ContentGenerationRequest>({
    mutationFn: (request: ContentGenerationRequest) => AzureServices.generateContent(request)
  });
};

/**
 * Hook to optimize existing content using Azure AI Foundry
 */
export const useContentOptimization = () => {
  return useMutation<ApiResponse<any>, Error, ContentOptimizationRequest>({
    mutationFn: (request: ContentOptimizationRequest) => AzureServices.optimizeContent(request)
  });
};

/**
 * Hook to analyze content authority and trust signals
 */
export const useAuthorityAnalysis = () => {
  return useMutation<ApiResponse<any>, Error, AuthorityAnalysisRequest>({
    mutationFn: (request: AuthorityAnalysisRequest) => AzureServices.analyzeAuthority(request)
  });
};

/**
 * Hook to search the vector store for relevant content
 */
export const useVectorSearch = () => {
  return useMutation<ApiResponse<any>, Error, VectorSearchRequest>({
    mutationFn: (request: VectorSearchRequest) => AzureServices.searchVectorStore(request)
  });
};

/**
 * Hook to check the status of a content generation job
 * This maintains compatibility with the existing useGenerationStatus hook
 */
export const useAzureGenerationStatus = (contentId?: string) => {
  return useQuery<ApiResponse<ContentStatus>, Error>({
    queryKey: ['generationStatus', contentId],
    queryFn: () => AzureServices.getContentStatus(contentId || ''),
    enabled: !!contentId,
    refetchInterval: (query) => {
      // Stop polling when generation is complete or errored
      const data = query.state.data;
      if (!data) return 3000; // Initial polling interval
      if (data.error) return false; // Stop polling on error
      if (data.data?.status === 'completed' || data.data?.status === 'failed') return false;
      return 3000; // Continue polling every 3 seconds
    },
  });
};

/**
 * Hook to get generated content by ID
 * This maintains compatibility with the existing useContent hook
 */
export const useAzureContent = (id?: string, options?: UseQueryOptions<ApiResponse<GeneratedContent>, Error>) => {
  return useQuery<ApiResponse<GeneratedContent>, Error>({
    queryKey: ['content', id],
    queryFn: async () => {
      if (!id) {
        return { error: 'No content ID provided' };
      }
      
      // Get content from Azure service
      return await AzureServices.getContent(id);
    },
    enabled: !!id,
    ...options
  });
};

/**
 * Hook to update content sections via Azure Functions
 * This maintains compatibility with the existing useUpdateContent hook
 */
export const useAzureUpdateContent = () => {
  return useMutation<
    ApiResponse<GeneratedContent>, 
    Error, 
    {
      id: string;
      sections: Array<{id: string; title: string; content: string;}>
    }
  >({
    mutationFn: (params) => AzureServices.updateContent(params.id, params.sections)
  });
};

/**
 * Hook for executing complete content generation workflows
 * This combines multiple steps and provides a unified interface
 */
export const useContentWorkflow = () => {
  const generateMutation = useAzureContentGeneration();
  const optimizeMutation = useContentOptimization();
  const authorityMutation = useAuthorityAnalysis();
  
  const executeFullWorkflow = async (request: ContentGenerationRequest) => {
    try {
      // Step 1: Generate the initial content
      const generatedContent = await generateMutation.mutateAsync(request);
      
      if (generatedContent.error || !generatedContent.data) {
        return { error: generatedContent.error || 'Failed to generate content' };
      }
      
      // Step 2: Optimize the content if available
      const contentText = generatedContent.data.sections[0]?.content || '';
      const contentId = generatedContent.data.id;
      
      if (contentText && contentId) {
        // Further optimization if needed
        const optimizedContent = await optimizeMutation.mutateAsync({
          content: contentText,
          contentId,
          optimizationGoals: ['readability', 'seo', 'engagement'],
          keywords: request.keywords
        });
        
        // Step 3: Analyze authority signals
        if (!optimizedContent.error && optimizedContent.data) {
          const finalContent = optimizedContent.data.optimizedContent || contentText;
          
          const authorityResult = await authorityMutation.mutateAsync({
            content: finalContent,
            contentId,
            title: request.title
          });
          
          // Return the final result with all scores
          if (generatedContent.data.sections[0]) {
            generatedContent.data.sections[0].content = finalContent;
          }
          
          return {
            data: {
              ...generatedContent.data,
              authorityScore: authorityResult.data?.overallScore || 0
            }
          };
        }
        
        return optimizedContent;
      }
      
      // If optimization steps couldn't be performed, return the initial content
      return generatedContent;
      
    } catch (error) {
      console.error('Content workflow error:', error);
      return {
        error: error instanceof Error ? error.message : 'An error occurred in content generation workflow'
      };
    }
  };
  
  return {
    executeWorkflow: executeFullWorkflow,
    isLoading: generateMutation.isPending || optimizeMutation.isPending || authorityMutation.isPending,
    isError: generateMutation.isError || optimizeMutation.isError || authorityMutation.isError,
    error: generateMutation.error || optimizeMutation.error || authorityMutation.error,
    reset: () => {
      generateMutation.reset();
      optimizeMutation.reset();
      authorityMutation.reset();
    }
  };
};

export default {
  useQueryIntentAnalysis,
  useAzureContentGeneration,
  useContentOptimization,
  useAuthorityAnalysis,
  useVectorSearch,
  useAzureGenerationStatus,
  useAzureContent,
  useAzureUpdateContent,
  useContentWorkflow
};
