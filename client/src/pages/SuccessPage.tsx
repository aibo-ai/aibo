import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [contentTitle, setContentTitle] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('download');
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    // Get content title from localStorage
    const detailsData = localStorage.getItem('contentArchitect_detailsData');
    if (detailsData) {
      try {
        const parsedData = JSON.parse(detailsData);
        setContentTitle(parsedData.common.title || 'Your content');
      } catch (e) {
        console.error('Failed to parse details data:', e);
        setContentTitle('Your content');
      }
    }

    // Clear confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartNew = () => {
    // Clear specific localStorage items related to the current project
    localStorage.removeItem('contentArchitect_detailsData');
    localStorage.removeItem('contentArchitect_contentType');
    localStorage.removeItem('contentArchitect_advancedOptions');
    localStorage.removeItem('contentArchitect_generatedContent');
    
    // Navigate to project setup page
    navigate('/project-setup');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {showConfetti && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="confetti-container">
              {[...Array(50)].map((_, i) => {
                const size = Math.floor(Math.random() * 10) + 5;
                const left = Math.floor(Math.random() * 100);
                const animationDuration = Math.floor(Math.random() * 3) + 2;
                const color = [`#FF6B6B`, `#4ECDC4`, `#FFE66D`, `#1A535C`, `#F7FFF7`][
                  Math.floor(Math.random() * 5)
                ];
                
                return (
                  <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color,
                      left: `${left}%`,
                      top: '-20px',
                      animationDuration: `${animationDuration}s`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
        
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Success!</h1>
          <p className="text-xl text-neutral-600">
            Your content has been successfully delivered.
          </p>
        </div>
        
        <Card className="mb-8 relative z-10">
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold mb-2">{contentTitle}</h2>
            <p className="text-neutral-500 mb-6">
              Your content is now ready to use. You can find it in your content library.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                variant="outline"
                onClick={handleStartNew}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Create New Content
              </Button>
              
              <Button 
                onClick={handleGoToDashboard}
                rightIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                }
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Card>
        
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 relative z-10">
          <h3 className="text-lg font-medium mb-3">What's next?</h3>
          <ul className="space-y-3">
            <li className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-neutral-700">View all your content in the dashboard and track performance metrics.</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-neutral-700">Customize your content further with our advanced editing tools.</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-neutral-700">Set up content publishing schedules and automated delivery options.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default SuccessPage;
