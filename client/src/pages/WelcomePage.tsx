import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'b2b' | 'b2c' | null>(null);

  const handleUserTypeSelect = (type: 'b2b' | 'b2c') => {
    setUserType(type);
  };

  const handleContinue = () => {
    // Store user type in local storage or context for future reference
    if (userType) {
      localStorage.setItem('contentArchitect_userType', userType);
      navigate('/project-setup');
    }
  };

  return (
    <AppLayout showFooter={true}>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Welcome to ContentArchitect</h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            AI-powered content creation optimized for LLM search visibility. Start crafting engaging,
            discoverable content in minutes.
          </p>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-6 text-center">Tell us how you'll use ContentArchitect</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className={`cursor-pointer transition ${userType === 'b2b' ? 'ring-2 ring-b2b' : ''}`}
              hoverEffect
              onClick={() => handleUserTypeSelect('b2b')}
            >
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-b2b/10 p-3 mr-4">
                  <svg className="h-6 w-6 text-b2b" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800">Business</h3>
              </div>
              <p className="text-neutral-600">
                For companies looking to create content at scale. Advanced workflows, team collaboration,
                and enterprise features.
              </p>
              <div className="mt-4">
                <div className="text-sm text-b2b font-medium">Features include:</div>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center text-sm text-neutral-600">
                    <svg className="h-4 w-4 text-b2b mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Team collaboration
                  </li>
                  <li className="flex items-center text-sm text-neutral-600">
                    <svg className="h-4 w-4 text-b2b mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Advanced analytics
                  </li>
                  <li className="flex items-center text-sm text-neutral-600">
                    <svg className="h-4 w-4 text-b2b mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    API access & integrations
                  </li>
                </ul>
              </div>
            </Card>
            
            <Card 
              className={`cursor-pointer transition ${userType === 'b2c' ? 'ring-2 ring-b2c' : ''}`}
              hoverEffect
              onClick={() => handleUserTypeSelect('b2c')}
            >
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-b2c/10 p-3 mr-4">
                  <svg className="h-6 w-6 text-b2c" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800">Individual</h3>
              </div>
              <p className="text-neutral-600">
                For creators, marketers, and individuals looking to enhance their content creation process with AI.
              </p>
              <div className="mt-4">
                <div className="text-sm text-b2c font-medium">Features include:</div>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center text-sm text-neutral-600">
                    <svg className="h-4 w-4 text-b2c mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Personal dashboard
                  </li>
                  <li className="flex items-center text-sm text-neutral-600">
                    <svg className="h-4 w-4 text-b2c mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Streamlined workflows
                  </li>
                  <li className="flex items-center text-sm text-neutral-600">
                    <svg className="h-4 w-4 text-b2c mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Easy content export
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            disabled={!userType} 
            onClick={handleContinue}
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

export default WelcomePage;
