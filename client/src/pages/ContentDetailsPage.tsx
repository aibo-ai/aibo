import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Progress from '../components/ui/Progress';

interface CommonFormData {
  title: string;
  keywords: string;
  targetWordCount: number;
}

interface BlogFormData extends CommonFormData {
  topic: string;
  tone: string;
  includeFacts: boolean;
}

interface ContentFormData {
  common: CommonFormData;
  [key: string]: any;
}

const ContentDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState('blog');
  const [formData, setFormData] = useState<ContentFormData>({
    common: {
      title: '',
      keywords: '',
      targetWordCount: 800
    },
    blog: {
      topic: '',
      tone: 'professional',
      includeFacts: true
    },
    whitepaper: {
      researchFocus: '',
      includeExecutiveSummary: true,
      includeDataVisualizations: true
    },
    product: {
      productName: '',
      features: '',
      benefits: '',
      targetAudience: ''
    },
    email: {
      subject: '',
      purpose: 'nurture',
      callToAction: ''
    },
    social: {
      platform: 'all',
      messageType: 'educational',
      callToAction: ''
    },
    website: {
      pageType: 'landing',
      conversionGoal: '',
      includeTestimonials: false
    },
    'case-study': {
      clientName: '',
      industry: '',
      challenge: '',
      solution: '',
      results: ''
    },
    review: {
      productName: '',
      pros: '',
      cons: '',
      rating: 4
    }
  });

  const [errors, setErrors] = useState<any>({});

  // Get the content type from localStorage
  useEffect(() => {
    const savedContentType = localStorage.getItem('contentArchitect_contentType');
    if (savedContentType) {
      setContentType(savedContentType);
    }
    
    // Try to load any saved form data
    const savedFormData = localStorage.getItem('contentArchitect_detailsData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Check if this is a common field or type-specific field
    if (name.startsWith('common.')) {
      const fieldName = name.replace('common.', '');
      setFormData(prev => ({
        ...prev,
        common: {
          ...prev.common,
          [fieldName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [contentType]: {
          ...prev[contentType],
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev: Record<string, string | undefined>) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    
    // Validate common fields
    if (!formData.common.title.trim()) {
      newErrors['common.title'] = 'Title is required';
    }
    
    if (!formData.common.keywords.trim()) {
      newErrors['common.keywords'] = 'Keywords are required';
    }
    
    if (formData.common.targetWordCount <= 0) {
      newErrors['common.targetWordCount'] = 'Word count must be greater than zero';
    }
    
    // Validate content-type specific fields
    switch (contentType) {
      case 'blog':
        if (!formData.blog.topic.trim()) {
          newErrors['topic'] = 'Topic is required';
        }
        break;
        
      case 'whitepaper':
        if (!formData.whitepaper.researchFocus.trim()) {
          newErrors['researchFocus'] = 'Research focus is required';
        }
        break;
        
      case 'product':
        if (!formData.product.productName.trim()) {
          newErrors['productName'] = 'Product name is required';
        }
        if (!formData.product.features.trim()) {
          newErrors['features'] = 'Features are required';
        }
        break;
        
      case 'email':
        if (!formData.email.subject.trim()) {
          newErrors['subject'] = 'Email subject is required';
        }
        if (!formData.email.callToAction.trim()) {
          newErrors['callToAction'] = 'Call to action is required';
        }
        break;
        
      case 'case-study':
        if (!formData['case-study'].clientName.trim()) {
          newErrors['clientName'] = 'Client name is required';
        }
        if (!formData['case-study'].challenge.trim()) {
          newErrors['challenge'] = 'Challenge description is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Store form data
      localStorage.setItem('contentArchitect_detailsData', JSON.stringify(formData));
      navigate('/advanced-options');
    }
  };

  const progressSteps = [
    { id: 'step1', label: 'Project', completed: true, current: false },
    { id: 'step2', label: 'Content Type', completed: true, current: false },
    { id: 'step3', label: 'Details', completed: false, current: true },
    { id: 'step4', label: 'Generate', completed: false, current: false },
    { id: 'step5', label: 'Review', completed: false, current: false },
    { id: 'step6', label: 'Deliver', completed: false, current: false }
  ];

  const renderBlogForm = () => (
    <div className="space-y-6">
      <div>
        <Input
          id="common.title"
          name="common.title"
          label="Blog Post Title"
          placeholder="Enter a title for your blog post"
          value={formData.common.title}
          onChange={handleChange}
          error={errors['common.title']}
          required
        />
      </div>
      
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-neutral-700 mb-1">
          Blog Topic
        </label>
        <textarea
          id="topic"
          name="topic"
          rows={3}
          placeholder="What is your blog post about?"
          className={`block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary ${errors.topic ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
          value={formData.blog.topic}
          onChange={handleChange}
          required
        />
        {errors.topic && (
          <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
        )}
      </div>
      
      <div>
        <Input
          id="common.keywords"
          name="common.keywords"
          label="Target Keywords"
          placeholder="Enter keywords separated by commas"
          helperText="These keywords will be used to optimize your content for search"
          value={formData.common.keywords}
          onChange={handleChange}
          error={errors['common.keywords']}
          required
        />
      </div>
      
      <div>
        <label htmlFor="tone" className="block text-sm font-medium text-neutral-700 mb-1">
          Content Tone
        </label>
        <select
          id="tone"
          name="tone"
          className="block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary"
          value={formData.blog.tone}
          onChange={handleChange}
        >
          <option value="professional">Professional</option>
          <option value="conversational">Conversational</option>
          <option value="educational">Educational</option>
          <option value="persuasive">Persuasive</option>
          <option value="humorous">Humorous</option>
        </select>
      </div>
      
      <div>
        <Input
          id="common.targetWordCount"
          name="common.targetWordCount"
          type="number"
          label="Target Word Count"
          value={formData.common.targetWordCount}
          onChange={handleChange}
          error={errors['common.targetWordCount']}
          min="100"
          required
        />
      </div>
      
      <div className="flex items-center">
        <input
          id="includeFacts"
          name="includeFacts"
          type="checkbox"
          className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
          checked={formData.blog.includeFacts}
          onChange={handleChange}
        />
        <label htmlFor="includeFacts" className="ml-2 block text-sm text-neutral-700">
          Include data and statistics to support claims
        </label>
      </div>
    </div>
  );

  const renderFormByContentType = () => {
    switch (contentType) {
      case 'blog':
        return renderBlogForm();
      default:
        return renderBlogForm(); // For now, use blog form as default
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Content Details</h1>
          <p className="text-neutral-600">Provide specific information to guide the content creation.</p>
        </div>
        
        <div className="mb-8">
          <Progress steps={progressSteps} />
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            {renderFormByContentType()}
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline" 
                to="/content-type"
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

export default ContentDetailsPage;
