import React from 'react';

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressProps {
  steps: ProgressStep[];
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ steps, className = '' }) => {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li key={step.id} className={`relative ${index !== 0 ? 'ml-5 sm:ml-10' : ''} ${index !== steps.length - 1 ? 'flex-1' : ''}`}>
            {index !== 0 && (
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className={`h-0.5 w-full ${step.completed ? 'bg-primary' : 'bg-neutral-200'}`} />
              </div>
            )}
            <div className="relative flex items-center justify-center">
              {step.completed ? (
                <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              ) : step.current ? (
                <span className="h-8 w-8 rounded-full border-2 border-primary bg-white flex items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
              ) : (
                <span className="h-8 w-8 rounded-full border-2 border-neutral-300 bg-white flex items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                </span>
              )}
            </div>
            <div className="hidden sm:block absolute top-10 -left-3 transform -translate-x-1/2">
              <div className={`mt-2 text-sm font-medium ${step.completed || step.current ? 'text-primary' : 'text-neutral-500'}`}>
                {step.label}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Progress;
