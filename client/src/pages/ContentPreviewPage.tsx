import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Progress from '../components/ui/Progress';

// Import both existing and Azure services
import { useContent, useUpdateContent } from '../hooks/useContentQueries';
import { useAzureContent, useAzureUpdateContent } from '../hooks/useAzureQueries';
import { useAzureService } from '../context/AzureServiceContext';
import type { ContentSection, GeneratedContent } from '../services/contentService';
import type { AzureContentSection } from '../services/azureServices';

const ContentPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const contentId = localStorage.getItem('contentArchitect_contentId');
  
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);

  // Get Azure service context to check if Azure is enabled
  const { isEnabled: isAzureEnabled } = useAzureService();

  // Fetch content using appropriate React Query hook based on environment
  const { data: legacyContentResponse, isLoading: isLegacyLoading, isError: isLegacyError } = useContent(
    !isAzureEnabled && contentId ? contentId : ''
  );
  const { data: azureContentResponse, isLoading: isAzureLoading, isError: isAzureError } = useAzureContent(
    isAzureEnabled && contentId ? contentId : ''
  );
  
  // Use the appropriate update mutation
  const legacyUpdateContentMutation = useUpdateContent();
  const azureUpdateContentMutation = useAzureUpdateContent();
  
  // Determine which data source to use based on environment
  const contentResponse = isAzureEnabled ? azureContentResponse : legacyContentResponse;
  const isLoading = isAzureEnabled ? isAzureLoading : isLegacyLoading;
  const isError = isAzureEnabled ? isAzureError : isLegacyError;
  const updateContentMutation = isAzureEnabled ? azureUpdateContentMutation : legacyUpdateContentMutation;
  
  // Extract content data from the response - data is already at the top level from React Query
  const content = contentResponse?.data;
  // If the content is structured with a nested data property (for API responses), extract it
  const contentData = content && 'data' in content ? (content as any).data : content;

  // Redirect if no content ID is available
  useEffect(() => {
    if (!contentId) {
      toast.error('No content found. Starting over.');
      navigate('/welcome');
    }
  }, [contentId, navigate]);

  const handleEditSection = (id: string) => {
    if (!content?.sections) return;
    
    // Handle different section structures between legacy and Azure services
    if (isAzureEnabled) {
      const section = content.sections.find((s: any) => s.id === id);
      if (section) {
        setEditingSectionId(id);
        setEditedContent(section.content);
      }
    } else {
      const section = content.sections.find((s: ContentSection) => s.id === id);
      if (section) {
        setEditingSectionId(id);
        setEditedContent(section.content);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (content && editingSectionId && contentId) {
      try {
        // Create updated sections array
        const updatedSections = content.sections.map((section: any) => {
          if (section.id === editingSectionId) {
            return { ...section, content: editedContent };
          }
          return section;
        });

        // Send update to API using appropriate endpoint based on environment
        let result;
        if (isAzureEnabled) {
          result = await azureUpdateContentMutation.mutateAsync({
            id: contentId,
            sections: updatedSections
          });
        } else {
          result = await legacyUpdateContentMutation.mutateAsync({
            id: contentId,
            updates: { sections: updatedSections }
          });
        }

        if (result.error) {
          throw new Error(typeof result.error === 'string' ? result.error : 'Update failed');
        }

        toast.success('Section updated successfully');
        setEditingSectionId(null);
      } catch (error) {
        console.error('Failed to update content section:', error);
        toast.error('Failed to save changes. Please try again.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditedContent('');
  };

  const handleContinue = () => {
    // Save the edited content
    localStorage.setItem('contentArchitect_generatedContent', JSON.stringify({
      title: content?.title,
      sections: content?.sections
    }));
    navigate('/delivery');
  };

  const progressSteps = [
    { id: 'step1', label: 'Project', completed: true, current: false },
    { id: 'step2', label: 'Content Type', completed: true, current: false },
    { id: 'step3', label: 'Details', completed: true, current: false },
    { id: 'step4', label: 'Generate', completed: true, current: false },
    { id: 'step5', label: 'Review', completed: false, current: true },
    { id: 'step6', label: 'Deliver', completed: false, current: false }
  ];

  // Return loading state or error if needed
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (isError || !content) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="mt-2 text-lg font-medium text-gray-900">Error Loading Content</h2>
              <p className="mt-1 text-sm text-gray-500">We couldn't load your content. Please try again.</p>
              <div className="mt-6">
                <Button onClick={() => navigate('/welcome')}>Return to Home</Button>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Content Preview</h1>
          <p className="text-neutral-600">Review and edit your generated content.</p>
        </div>
        
        <div className="mb-8">
          <Progress steps={progressSteps} />
        </div>
        
        <Card className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{content?.title}</h2>
              <p className="text-sm text-neutral-500 mt-1">
                {content?.contentType === 'blog' ? 'Blog Post' : content?.contentType.charAt(0).toUpperCase() + content?.contentType.slice(1)}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                size="sm"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              >
                Edit Title
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-neutral-700 mb-1">Content Score</div>
              <div className="text-2xl font-bold text-primary">
                {(() => {
                  // Safely access score with type guards
                  const score = isAzureEnabled 
                    ? (contentData && 'authorityScore' in contentData) 
                      ? contentData.authorityScore 
                      : (contentData && 'score' in contentData && contentData.score && 'overall' in contentData.score) 
                        ? contentData.score.overall 
                        : 0
                    : (contentData && 'score' in contentData && contentData.score && 'overall' in contentData.score) 
                      ? contentData.score.overall 
                      : 0;
                  return `${score}/100`;
                })()}
              </div>
              <div className="mt-2 flex items-center">
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ 
                      width: `${(() => {
                        // Safely access score with type guards
                        const score = isAzureEnabled 
                          ? (contentData && 'authorityScore' in contentData) 
                            ? contentData.authorityScore 
                            : (contentData && 'score' in contentData && contentData.score && 'overall' in contentData.score) 
                              ? contentData.score.overall 
                              : 0
                          : (contentData && 'score' in contentData && contentData.score && 'overall' in contentData.score) 
                            ? contentData.score.overall 
                            : 0;
                        return score;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-neutral-50 p-2 rounded-lg">
                <div className="text-xs font-medium text-neutral-700">Readability</div>
                <div className="text-lg font-bold text-primary">
                  {(() => {
                    // Safely access readability score with type guards
                    const score = isAzureEnabled 
                      ? (contentData && 'metrics' in contentData && contentData.metrics && 'readabilityScore' in contentData.metrics) 
                        ? contentData.metrics.readabilityScore 
                        : (contentData && 'score' in contentData && contentData.score && 'readability' in contentData.score) 
                          ? contentData.score.readability 
                          : 0
                      : (contentData && 'score' in contentData && contentData.score && 'readability' in contentData.score) 
                        ? contentData.score.readability 
                        : 0;
                    return score;
                  })()}
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ 
                      width: `${(() => {
                        // Safely access readability score with type guards
                        const score = isAzureEnabled 
                          ? (contentData && 'metrics' in contentData && contentData.metrics && 'readabilityScore' in contentData.metrics) 
                            ? contentData.metrics.readabilityScore 
                            : (contentData && 'score' in contentData && contentData.score && 'readability' in contentData.score) 
                              ? contentData.score.readability 
                              : 0
                          : (contentData && 'score' in contentData && contentData.score && 'readability' in contentData.score) 
                            ? contentData.score.readability 
                            : 0;
                        return score;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-neutral-50 p-2 rounded-lg">
                <div className="text-xs font-medium text-neutral-700">SEO</div>
                <div className="text-lg font-bold text-primary">
                  {(() => {
                    // Safely access SEO score with type guards
                    const score = isAzureEnabled 
                      ? (contentData && 'metrics' in contentData && contentData.metrics && 'seoScore' in contentData.metrics) 
                        ? contentData.metrics.seoScore 
                        : (contentData && 'score' in contentData && contentData.score && 'seo' in contentData.score) 
                          ? contentData.score.seo 
                          : 0
                      : (contentData && 'score' in contentData && contentData.score && 'seo' in contentData.score) 
                        ? contentData.score.seo 
                        : 0;
                    return score;
                  })()}
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ 
                      width: `${(() => {
                        // Safely access SEO score with type guards
                        const score = isAzureEnabled 
                          ? (contentData && 'metrics' in contentData && contentData.metrics && 'seoScore' in contentData.metrics) 
                            ? contentData.metrics.seoScore 
                            : (contentData && 'score' in contentData && contentData.score && 'seo' in contentData.score) 
                              ? contentData.score.seo 
                              : 0
                          : (contentData && 'score' in contentData && contentData.score && 'seo' in contentData.score) 
                            ? contentData.score.seo 
                            : 0;
                        return score;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-neutral-50 p-2 rounded-lg">
                <div className="text-xs font-medium text-neutral-700">Engagement</div>
                <div className="text-lg font-bold text-primary">
                  {(() => {
                    // Safely access engagement score with type guards
                    const score = isAzureEnabled 
                      ? (contentData && 'metrics' in contentData && contentData.metrics && 'engagementScore' in contentData.metrics) 
                        ? contentData.metrics.engagementScore 
                        : (contentData && 'score' in contentData && contentData.score && 'engagement' in contentData.score) 
                          ? contentData.score.engagement 
                          : 0
                      : (contentData && 'score' in contentData && contentData.score && 'engagement' in contentData.score) 
                        ? contentData.score.engagement 
                        : 0;
                    return score;
                  })()}
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ 
                      width: `${(() => {
                        // Safely access engagement score with type guards
                        const score = isAzureEnabled 
                          ? (contentData && 'metrics' in contentData && contentData.metrics && 'engagementScore' in contentData.metrics) 
                            ? contentData.metrics.engagementScore 
                            : (contentData && 'score' in contentData && contentData.score && 'engagement' in contentData.score) 
                              ? contentData.score.engagement 
                              : 0
                          : (contentData && 'score' in contentData && contentData.score && 'engagement' in contentData.score) 
                            ? contentData.score.engagement 
                            : 0;
                        return score;
                      })()}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {editingSectionId ? (
          <Card className="mb-6">
            <h3 className="text-lg font-medium mb-3">Editing: {content?.sections.find((s: ContentSection) => s.id === editingSectionId)?.title}</h3>
            <textarea
              className="w-full h-64 p-3 border border-neutral-300 rounded-md focus:ring-primary focus:border-primary"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4 mb-8">
            {content?.sections.map((section: ContentSection) => (
              <div className="p-4 border border-neutral-200 rounded-lg" key={section.id}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{section.title}</h3>
                  <button
                    className="text-sm text-primary hover:text-primary-dark"
                    onClick={() => handleEditSection(section.id)}
                  >
                    Edit
                  </button>
                </div>
                <div className="prose max-w-none">
                  {section.content.split('\n\n').map((paragraph: string, idx: number) => (
                    <p key={idx} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/processing')}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            Back
          </Button>
          <Button 
            onClick={handleContinue}
            rightIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
          >
            Continue to Delivery
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContentPreviewPage;
