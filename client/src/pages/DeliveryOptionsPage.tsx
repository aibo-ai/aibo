import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Progress from '../components/ui/Progress';

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const DeliveryOptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [contentTitle, setContentTitle] = useState('');
  const [contentType, setContentType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get saved content details from localStorage
    const detailsData = localStorage.getItem('contentArchitect_detailsData');
    if (detailsData) {
      try {
        const parsedData = JSON.parse(detailsData);
        setContentTitle(parsedData.common.title || 'Untitled Content');
      } catch (e) {
        console.error('Failed to parse details data:', e);
      }
    }

    // Get content type
    const savedContentType = localStorage.getItem('contentArchitect_contentType');
    if (savedContentType) {
      setContentType(savedContentType);
    }

    // Get user email if previously saved
    const savedEmail = localStorage.getItem('contentArchitect_userEmail');
    if (savedEmail) {
      setEmailAddress(savedEmail);
    }
  }, []);

  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'download',
      name: 'Download as File',
      description: 'Download your content as a file to your device',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    },
    {
      id: 'email',
      name: 'Email to Me',
      description: 'Send the content to your email address',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'copy',
      name: 'Copy to Clipboard',
      description: 'Copy the content to your clipboard',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )
    },
    {
      id: 'cms',
      name: 'Send to CMS',
      description: 'Publish directly to your connected CMS',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailAddress(e.target.value);
    // Simple email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailPattern.test(e.target.value));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    
    // If email option is selected, store the email
    if (selectedOption === 'email' && isEmailValid) {
      localStorage.setItem('contentArchitect_userEmail', emailAddress);
    }

    // Simulate delivery process (in a real app, this would call an API)
    setTimeout(() => {
      setIsLoading(false);
      navigate('/success');
    }, 1500);
  };

  const isButtonDisabled = !selectedOption || (selectedOption === 'email' && (!emailAddress || !isEmailValid));

  const progressSteps = [
    { id: 'step1', label: 'Project', completed: true, current: false },
    { id: 'step2', label: 'Content Type', completed: true, current: false },
    { id: 'step3', label: 'Details', completed: true, current: false },
    { id: 'step4', label: 'Generate', completed: true, current: false },
    { id: 'step5', label: 'Review', completed: true, current: false },
    { id: 'step6', label: 'Deliver', completed: false, current: true }
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Delivery Options</h1>
          <p className="text-neutral-600">Choose how you'd like to receive your generated content.</p>
        </div>
        
        <div className="mb-8">
          <Progress steps={progressSteps} />
        </div>
        
        <Card className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{contentTitle}</h2>
            <p className="text-sm text-neutral-500">
              {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </p>
          </div>
          
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-lg font-medium mb-4">Select a delivery method</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deliveryOptions.map((option) => (
                <button
                  key={option.id}
                  className={`p-4 border rounded-lg flex items-center text-left transition-all ${
                    selectedOption === option.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  <div className={`flex-shrink-0 mr-3 ${selectedOption === option.id ? 'text-primary' : 'text-neutral-500'}`}>
                    {option.icon}
                  </div>
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-neutral-500">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
            
            {selectedOption === 'email' && (
              <div className="mt-6">
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                  Your Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={emailAddress}
                  onChange={handleEmailChange}
                  className={`block w-full rounded-md shadow-sm sm:text-sm ${
                    !isEmailValid && emailAddress
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-neutral-300 focus:ring-primary focus:border-primary'
                  }`}
                  placeholder="example@email.com"
                />
                {!isEmailValid && emailAddress && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
                )}
              </div>
            )}
            
            {selectedOption === 'cms' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-700">Connect a CMS first</h3>
                    <p className="text-sm text-yellow-600 mt-1">
                      You need to connect a CMS in your account settings before using this option.
                    </p>
                    <button
                      className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600"
                    >
                      Go to Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            to="/preview"
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isButtonDisabled || isLoading}
            isLoading={isLoading}
          >
            Deliver Content
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default DeliveryOptionsPage;
