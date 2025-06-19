import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Progress from '../components/ui/Progress';

interface AdvancedOptions {
  useOriginalResearch: boolean;
  optimizeForSemanticSearch: boolean;
  includeOutlineFirst: boolean;
  preferredStyle: string;
  citationStyle: string;
  excludedTerms: string;
  seoOptimizationLevel: string;
  contentFormat: string;
}

const AdvancedOptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'b2b' | 'b2c'>('b2b');
  const [contentType, setContentType] = useState('blog');
  const [options, setOptions] = useState<AdvancedOptions>({
    useOriginalResearch: false,
    optimizeForSemanticSearch: true,
    includeOutlineFirst: true,
    preferredStyle: 'standard',
    citationStyle: 'none',
    excludedTerms: '',
    seoOptimizationLevel: 'balanced',
    contentFormat: 'markdown'
  });

  // Get user type and content type from localStorage
  useEffect(() => {
    const savedUserType = localStorage.getItem('contentArchitect_userType');
    if (savedUserType === 'b2b' || savedUserType === 'b2c') {
      setUserType(savedUserType);
    }

    const savedContentType = localStorage.getItem('contentArchitect_contentType');
    if (savedContentType) {
      setContentType(savedContentType);
    }

    // Load any saved options
    const savedOptions = localStorage.getItem('contentArchitect_advancedOptions');
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions);
        setOptions(parsedOptions);
      } catch (e) {
        console.error('Failed to parse saved options:', e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store advanced options
    localStorage.setItem('contentArchitect_advancedOptions', JSON.stringify(options));
    navigate('/processing');
  };

  const progressSteps = [
    { id: 'step1', label: 'Project', completed: true, current: false },
    { id: 'step2', label: 'Content Type', completed: true, current: false },
    { id: 'step3', label: 'Details', completed: true, current: false },
    { id: 'step4', label: 'Generate', completed: false, current: true },
    { id: 'step5', label: 'Review', completed: false, current: false },
    { id: 'step6', label: 'Deliver', completed: false, current: false }
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Advanced Options</h1>
          <p className="text-neutral-600">Configure additional settings for your content (optional).</p>
        </div>
        
        <div className="mb-8">
          <Progress steps={progressSteps} />
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="useOriginalResearch"
                    name="useOriginalResearch"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                    checked={options.useOriginalResearch}
                    onChange={handleChange}
                  />
                  <label htmlFor="useOriginalResearch" className="ml-2 block text-sm font-medium text-neutral-700">
                    Use Original Research
                  </label>
                </div>
                <div className="text-sm text-neutral-500">
                  {options.useOriginalResearch ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              {options.useOriginalResearch && (
                <div className="ml-6 pl-2 border-l-2 border-neutral-200">
                  <p className="text-sm text-neutral-600 mb-3">
                    AI will generate unique research data, statistics, and insights for your content.
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="optimizeForSemanticSearch"
                    name="optimizeForSemanticSearch"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                    checked={options.optimizeForSemanticSearch}
                    onChange={handleChange}
                  />
                  <label htmlFor="optimizeForSemanticSearch" className="ml-2 block text-sm font-medium text-neutral-700">
                    Optimize for LLM Semantic Search
                  </label>
                </div>
                <div className="text-sm text-neutral-500">
                  {options.optimizeForSemanticSearch ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="includeOutlineFirst"
                    name="includeOutlineFirst"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                    checked={options.includeOutlineFirst}
                    onChange={handleChange}
                  />
                  <label htmlFor="includeOutlineFirst" className="ml-2 block text-sm font-medium text-neutral-700">
                    Generate Outline First
                  </label>
                </div>
                <div className="text-sm text-neutral-500">
                  {options.includeOutlineFirst ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div>
                <label htmlFor="preferredStyle" className="block text-sm font-medium text-neutral-700 mb-1">
                  Writing Style
                </label>
                <select
                  id="preferredStyle"
                  name="preferredStyle"
                  className="block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary"
                  value={options.preferredStyle}
                  onChange={handleChange}
                >
                  <option value="standard">Standard</option>
                  <option value="creative">Creative</option>
                  <option value="technical">Technical</option>
                  <option value="academic">Academic</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="seoOptimizationLevel" className="block text-sm font-medium text-neutral-700 mb-1">
                  SEO Optimization Level
                </label>
                <select
                  id="seoOptimizationLevel"
                  name="seoOptimizationLevel"
                  className="block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary"
                  value={options.seoOptimizationLevel}
                  onChange={handleChange}
                >
                  <option value="light">Light - Focus more on readability</option>
                  <option value="balanced">Balanced - Equal focus on readability and SEO</option>
                  <option value="aggressive">Aggressive - Maximize keyword optimization</option>
                </select>
              </div>
              
              {(contentType === 'whitepaper' || contentType === 'blog' || contentType === 'case-study') && (
                <div>
                  <label htmlFor="citationStyle" className="block text-sm font-medium text-neutral-700 mb-1">
                    Citation Style
                  </label>
                  <select
                    id="citationStyle"
                    name="citationStyle"
                    className="block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary"
                    value={options.citationStyle}
                    onChange={handleChange}
                  >
                    <option value="none">None</option>
                    <option value="apa">APA</option>
                    <option value="mla">MLA</option>
                    <option value="chicago">Chicago</option>
                    <option value="harvard">Harvard</option>
                  </select>
                </div>
              )}
              
              <div>
                <label htmlFor="contentFormat" className="block text-sm font-medium text-neutral-700 mb-1">
                  Output Format
                </label>
                <select
                  id="contentFormat"
                  name="contentFormat"
                  className="block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary"
                  value={options.contentFormat}
                  onChange={handleChange}
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="plaintext">Plain Text</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="excludedTerms" className="block text-sm font-medium text-neutral-700 mb-1">
                  Terms to Exclude (Optional)
                </label>
                <textarea
                  id="excludedTerms"
                  name="excludedTerms"
                  rows={2}
                  placeholder="Enter terms to exclude, separated by commas"
                  className="block w-full rounded border-neutral-300 shadow-sm focus:ring-primary focus:border-primary"
                  value={options.excludedTerms}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-neutral-500">
                  These terms will be excluded from the generated content
                </p>
              </div>
              
              {userType === 'b2b' && (
                <div className="bg-b2b/5 p-4 rounded border border-b2b/20">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-b2b" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-b2b">B2B Original Research</h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        Original research for B2B content will include industry-specific data, market trends, and comparative analysis between solutions.
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
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-b2c">B2C Original Research</h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        Original research for B2C content will focus on consumer preferences, usage patterns, and emotional impact of products and services.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline" 
                to="/content-details"
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
                Generate Content
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdvancedOptionsPage;
