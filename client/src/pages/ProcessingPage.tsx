import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Progress from '../components/ui/Progress';

// Import both existing and Azure services
import { useGenerateContent, useGenerationStatus } from '../hooks/useContentQueries';
import { useAzureContentGeneration, useAzureGenerationStatus } from '../hooks/useAzureQueries';
import { useAzureService } from '../context/AzureServiceContext';

const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing content generation...');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [contentId, setContentId] = useState<string | null>(null);
  
  // Get Azure service context to check if Azure is enabled
  const { isEnabled: isAzureEnabled } = useAzureService();

  // Get stored project and content data
  const projectId = localStorage.getItem('contentArchitect_projectId');
  const contentTypeData = localStorage.getItem('contentArchitect_contentType');
  const contentDetailsData = localStorage.getItem('contentArchitect_contentDetails');
  const advancedOptionsData = localStorage.getItem('contentArchitect_advancedOptions');
  
  // Select the appropriate service based on environment configuration
  const generateContent = useGenerateContent();
  const generateAzureContent = useAzureContentGeneration();
  
  // Use the appropriate status hook based on whether Azure is enabled
  const { data: legacyStatusData, isError: isLegacyStatusError } = useGenerationStatus(taskId || '');
  const { data: azureStatusData, isError: isAzureStatusError } = useAzureGenerationStatus(contentId || '');
  
  // Combine status data based on which service is active
  const statusData = isAzureEnabled ? azureStatusData : legacyStatusData;
  const isStatusError = isAzureEnabled ? isAzureStatusError : isLegacyStatusError;
  
  const progressSteps = [
    { id: 'step1', label: 'Project', completed: true, current: false },
    { id: 'step2', label: 'Content Type', completed: true, current: false },
    { id: 'step3', label: 'Details', completed: true, current: false },
    { id: 'step4', label: 'Generate', completed: false, current: true },
    { id: 'step5', label: 'Review', completed: false, current: false },
    { id: 'step6', label: 'Deliver', completed: false, current: false }
  ];

  // Trigger content generation on page load
  useEffect(() => {
    const startContentGeneration = async () => {
      // Check if all required data exists
      if (!projectId || !contentTypeData || !contentDetailsData || !advancedOptionsData) {
        toast.error('Required data is missing. Please start over.');
        navigate('/welcome');
        return;
      }

      try {
        // Parse stored data
        const contentType = JSON.parse(contentTypeData);
        const contentDetails = JSON.parse(contentDetailsData);
        const advancedOptions = JSON.parse(advancedOptionsData);

        // Determine if we should use Azure services or legacy services
        if (isAzureEnabled) {
          // Create Azure content generation request format
          const azureContentRequest = {
            title: contentDetails.title,
            keywords: contentDetails.keywords,
            contentType: contentType.type,
            style: advancedOptions.tone,
            targetAudience: advancedOptions.audience,
            maxLength: advancedOptions.wordCount,
            topics: contentDetails.topics,
            searchIntent: advancedOptions.searchIntent || ''
          };
          
          // Send request to Azure services
          const result = await generateAzureContent.mutateAsync(azureContentRequest);
          
          if (result.error) {
            throw new Error(typeof result.error === 'string' ? result.error : 'Failed to generate content');
          }
          
          if (result.data?.id) {
            setContentId(result.data.id);
            localStorage.setItem('contentArchitect_contentId', result.data.id);
            setStatusText('Content generation started in Azure...');
            setProgress(10);
          } else {
            throw new Error('No content ID received from Azure service');
          }
        } else {
          // Legacy content generation format
          const contentRequest = {
            projectId,
            contentType: contentType.type,
            details: contentDetails,
            options: advancedOptions
          };

          // Send content generation request to legacy API
          const result = await generateContent.mutateAsync(contentRequest);
          
          if (result.error) {
            throw new Error(typeof result.error === 'string' ? result.error : 'Failed to generate content');
          }
          
          if (result.data?.taskId) {
            setTaskId(result.data.taskId);
            setStatusText('Content generation started...');
            setProgress(10);
          } else {
            throw new Error('No task ID received from server');
          }
        }
      } catch (error) {
        console.error('Failed to start content generation:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to start content generation. Please try again.');
      }
    };

    startContentGeneration();
  }, [navigate, generateContent, projectId, contentTypeData, contentDetailsData, advancedOptionsData]);

  // Handle status updates
  useEffect(() => {
    if (!statusData) return;
    
    // For Azure services, the status data has a nested structure
    if (isAzureEnabled && statusData.data) {
      // Use type assertion to access properties properly
      const statusResponseData = statusData.data as { 
        status: string; 
        progress: number; 
        estimatedCompletionTime?: string;
        error?: string;
      };
      const { status, progress: apiProgress, estimatedCompletionTime } = statusResponseData;
      
      // Update UI based on generation status
      setProgress(apiProgress || 0);
      setStatusText(status === 'processing' ? 
        `Processing... (Est. completion: ${estimatedCompletionTime ? new Date(estimatedCompletionTime).toLocaleTimeString() : 'calculating'})` : 
        status);
      
      // When complete, navigate to preview
      if (status === 'completed') {
        // Content ID is already set earlier when we started the generation
        toast.success('Content generated successfully!');
        
        // Navigate to preview page after a brief delay
        setTimeout(() => {
          navigate('/preview');
        }, 1000);
      } else if (status === 'failed') {
        const errorMessage = statusResponseData.error || 'Content generation failed. Please try again.';
        toast.error(errorMessage);
        setTimeout(() => {
          navigate('/advanced-options');
        }, 3000);
      }
    }
    // For legacy services
    else if (!isAzureEnabled && statusData.data) {
      // Ensure we're properly extracting properties from the nested data structure
      const { status, progress: apiProgress, message } = statusData.data as { status: string; progress: number; message?: string };
      
      // Update UI based on generation status
      setProgress(apiProgress || 0);
      setStatusText(message || 'Processing...');
      
      // When complete, store content ID and navigate to preview
      if (status === 'completed' && message) {
        try {
          // The message should contain the content ID
          const contentIdMatch = message.match(/content_id:([a-zA-Z0-9-]+)/);
          if (contentIdMatch && contentIdMatch[1]) {
            const extractedContentId = contentIdMatch[1];
            setContentId(extractedContentId);
            localStorage.setItem('contentArchitect_contentId', extractedContentId);
            
            // Navigate to preview page after a brief delay
            setTimeout(() => {
              navigate('/preview');
            }, 1000);
          } else {
            throw new Error('Content ID not found in response');
          }
        } catch (error) {
          console.error('Error processing completion message:', error);
          toast.error('Error retrieving generated content.');
        }
      } else if (status === 'failed') {
        toast.error('Content generation failed. Please try again.');
        setTimeout(() => {
          navigate('/advanced-options');
        }, 3000);
      }
    }
  }, [statusData, navigate, isAzureEnabled]);

  // Handle status API errors
  useEffect(() => {
    if (isStatusError) {
      toast.error(`Error checking generation status${isAzureEnabled ? ' in Azure' : ''}. Please try again.`);
      setTimeout(() => {
        navigate('/advanced-options');
      }, 3000);
    }
  }, [isStatusError, navigate, isAzureEnabled]);

  return (
    <AppLayout showFooter={false}>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Generating Content</h1>
          <p className="text-neutral-600">Our AI is crafting your content, optimized for search visibility.</p>
        </div>
        
        <div className="mb-8">
          <Progress steps={progressSteps} />
        </div>
        
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium">{statusText}</h3>
              </div>
              <div>
                <span className="text-sm font-medium text-neutral-700">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <div className="w-full bg-neutral-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Processing Status</h4>
              <div className="bg-neutral-50 rounded border border-neutral-200 p-3 h-64 overflow-y-auto">
                <div className="space-y-1">
                  {/* Animated cursor */}
                  <div className="text-sm font-mono flex items-center">
                    <span className="mr-2">&gt;</span>
                    <div className="h-4 w-2 bg-neutral-800 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Please wait while we generate your content...</span>
              </div>
            </div>
            {(statusData?.data?.status === 'failed' || (isAzureEnabled && statusData?.error)) && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">An error occurred during content generation</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{(statusData && 'error' in statusData ? statusData.error : (statusData?.data && typeof statusData.data === 'object' && 'message' in statusData.data ? (statusData.data as any).message : '')) || 'There was a problem generating your content. Please go back and try again.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProcessingPage;
