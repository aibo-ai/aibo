import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Progress from '../components/ui/Progress';

interface ContentTypeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ContentTypePage: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'b2b' | 'b2c'>('b2b');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Get user type from localStorage
  useEffect(() => {
    const savedUserType = localStorage.getItem('contentArchitect_userType');
    if (savedUserType === 'b2b' || savedUserType === 'b2c') {
      setUserType(savedUserType);
    }

    // Check for existing selection
    const savedContentType = localStorage.getItem('contentArchitect_contentType');
    if (savedContentType) {
      setSelectedType(savedContentType);
    }
  }, []);

  const handleSelectContentType = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleContinue = () => {
    if (selectedType) {
      localStorage.setItem('contentArchitect_contentType', selectedType);
      navigate('/content-details');
    }
  };

  const contentTypes: ContentTypeOption[] = [
    {
      id: 'blog',
      title: 'Blog Post',
      description: 'Engaging articles optimized for search visibility',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    {
      id: 'whitepaper',
      title: 'Whitepaper',
      description: 'In-depth research papers with original insights',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'product',
      title: 'Product Description',
      description: 'Compelling product content that drives conversions',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'email',
      title: 'Email Campaign',
      description: 'Engaging email sequences that nurture leads',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'social',
      title: 'Social Media Content',
      description: 'Shareable posts optimized for various platforms',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      )
    },
    {
      id: 'website',
      title: 'Website Copy',
      description: 'Conversion-focused copy for landing pages and websites',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    },
  ];

  // Add a B2B-specific content type
  if (userType === 'b2b') {
    contentTypes.push({
      id: 'case-study',
      title: 'Case Study',
      description: 'Detailed analysis of successful client implementations',
      icon: (
        <svg className="h-8 w-8 text-b2b" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    });
  }

  // Add a B2C-specific content type
  if (userType === 'b2c') {
    contentTypes.push({
      id: 'review',
      title: 'Product Review',
      description: 'Balanced and engaging product reviews that build trust',
      icon: (
        <svg className="h-8 w-8 text-b2c" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    });
  }

  const progressSteps = [
    { id: 'step1', label: 'Project', completed: true, current: false },
    { id: 'step2', label: 'Content Type', completed: false, current: true },
    { id: 'step3', label: 'Details', completed: false, current: false },
    { id: 'step4', label: 'Generate', completed: false, current: false },
    { id: 'step5', label: 'Review', completed: false, current: false },
    { id: 'step6', label: 'Deliver', completed: false, current: false }
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Select Content Type</h1>
          <p className="text-neutral-600">Choose the type of content you want to create.</p>
        </div>
        
        <div className="mb-8">
          <Progress steps={progressSteps} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {contentTypes.map((type) => (
            <div 
              key={type.id}
              className={`
                cursor-pointer rounded-lg border p-5 transition-all duration-200
                ${selectedType === type.id 
                  ? 'border-primary bg-primary/5 shadow-medium' 
                  : 'border-neutral-200 bg-white shadow-subtle hover:border-primary/30 hover:bg-primary/5'}
              `}
              onClick={() => handleSelectContentType(type.id)}
            >
              <div className={`mb-4 text-${selectedType === type.id ? 'primary' : 'neutral-600'}`}>
                {type.icon}
              </div>
              <h3 className="font-semibold text-lg mb-1">{type.title}</h3>
              <p className="text-neutral-600 text-sm">{type.description}</p>
              {selectedType === type.id && (
                <div className="mt-4 flex justify-end">
                  <div className="rounded-full bg-primary/10 p-1">
                    <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {userType === 'b2b' && (
          <div className="bg-b2b/5 p-4 rounded border border-b2b/20 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-b2b" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-b2b">B2B content optimization</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Content will be optimized for business decision-makers, with a focus on ROI, implementation, and competitive advantages.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {userType === 'b2c' && (
          <div className="bg-b2c/5 p-4 rounded border border-b2c/20 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-b2c" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-b2c">B2C content optimization</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Content will be optimized for individual consumers, with a focus on benefits, personal value, and emotional connection.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            to="/project-setup"
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
            disabled={!selectedType}
            rightIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            }
          >
            Continue
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContentTypePage;
