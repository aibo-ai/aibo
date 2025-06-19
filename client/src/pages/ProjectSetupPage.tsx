import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Progress from '../components/ui/Progress';
import { useCreateProject } from '../hooks/useContentQueries';
import { toast } from 'react-hot-toast';

interface FormData {
  name: string;
  description: string;
  industry: string;
  targetAudience: string;
}

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
  'Entertainment', 'Food & Beverage', 'Travel', 'Real Estate', 'Other'
];

const ProjectSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'b2b' | 'b2c'>('b2b');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    industry: '',
    targetAudience: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Get user type from localStorage
  useEffect(() => {
    const savedUserType = localStorage.getItem('contentArchitect_userType');
    if (savedUserType === 'b2b' || savedUserType === 'b2c') {
      setUserType(savedUserType);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }
    
    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Use the createProject mutation
  const createProjectMutation = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Store project data in localStorage for now (as backup)
        localStorage.setItem('contentArchitect_projectData', JSON.stringify(formData));
        
        // Create project via API
        const result = await createProjectMutation.mutateAsync({
          ...formData,
          userType
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        // If project creation was successful, store the project ID
        if (result.data) {
          localStorage.setItem('contentArchitect_projectId', result.data.id);
          // Navigate to the next step
          navigate('/content-type');
        }
      } catch (error) {
        toast.error('Failed to create project. Please try again.');
        console.error('Project creation error:', error);
      }
    }
  };

  const progressSteps = [
    { id: 'step1', label: 'Project', completed: false, current: true },
    { id: 'step2', label: 'Content Type', completed: false, current: false },
    { id: 'step3', label: 'Details', completed: false, current: false },
    { id: 'step4', label: 'Generate', completed: false, current: false },
    { id: 'step5', label: 'Review', completed: false, current: false },
    { id: 'step6', label: 'Deliver', completed: false, current: false }
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Project Setup</h1>
          <p className="text-neutral-600">Define your project to help us generate more relevant content.</p>
        </div>
        
        <div className="mb-8">
          <Progress steps={progressSteps} />
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Input
                  id="name"
                  name="name"
                  label="Project Name"
                  placeholder="Enter a name for your project"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  helperText="This will help you identify this project in your dashboard"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                  Project Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Briefly describe your project goals"
                  className="block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary"
                  value={formData.description}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-neutral-500">
                  Provide additional details to help guide the content creation
                </p>
              </div>
              
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-neutral-700 mb-1">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  className={`
                    block w-full rounded border-neutral-300 shadow-sm
                    focus:ring-primary focus:border-primary
                    ${errors.industry ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                  `}
                  value={formData.industry}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select an industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                )}
              </div>
              
              <div>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  label="Target Audience"
                  placeholder="Who will be reading your content?"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  error={errors.targetAudience}
                  helperText="E.g., Marketing professionals, Small business owners, Tech enthusiasts"
                  required
                />
              </div>
              
              {userType === 'b2b' && (
                <div className="bg-b2b/5 p-4 rounded border border-b2b/20">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-b2b" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-b2b">B2B-specific features enabled</h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        Advanced analytics, team collaboration, and enterprise integrations are available for your project.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {userType === 'b2c' && (
                <div className="bg-b2c/5 p-4 rounded border border-b2c/20">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-b2c" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-b2c">B2C-specific features enabled</h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        Streamlined workflows, personal dashboard, and easy content export are available for your project.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {createProjectMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                There was an error saving your project. Please try again.
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                to="/"
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                }
              >
                Back
              </Button>
              <Button 
                type="submit"
                disabled={createProjectMutation.isPending}
                rightIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              >
                Continue
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProjectSetupPage;
