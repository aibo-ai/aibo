import React, { useState } from 'react';
import Card from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MozSeoAnalyzerProps {
  onAnalyze: (analysisData: MozSeoAnalysisData) => void;
  loading?: boolean;
}

export interface MozSeoAnalysisData {
  websiteUrl: string;
  name: string;
  location?: string;
  targetAudience?: string;
  keywords?: string[];
  competitors?: string[];
}

const LOCATION_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'IN', label: 'India' }
];

const TARGET_AUDIENCE_OPTIONS = [
  'B2B Decision Makers',
  'Small Business Owners',
  'Enterprise Customers',
  'Consumers',
  'Millennials',
  'Gen Z',
  'Baby Boomers',
  'Tech Professionals',
  'Marketing Professionals',
  'Students',
  'Parents',
  'Seniors'
];

export const MozSeoAnalyzer: React.FC<MozSeoAnalyzerProps> = ({
  onAnalyze,
  loading = false
}) => {
  const [analysisData, setAnalysisData] = useState<MozSeoAnalysisData>({
    websiteUrl: '',
    name: '',
    location: 'US',
    targetAudience: '',
    keywords: [],
    competitors: []
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (analysisData.websiteUrl.trim() && analysisData.name.trim()) {
      onAnalyze(analysisData);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !analysisData.keywords?.includes(keywordInput.trim())) {
      setAnalysisData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setAnalysisData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const addCompetitor = () => {
    if (competitorInput.trim() && !analysisData.competitors?.includes(competitorInput.trim())) {
      setAnalysisData(prev => ({
        ...prev,
        competitors: [...(prev.competitors || []), competitorInput.trim()]
      }));
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setAnalysisData(prev => ({
      ...prev,
      competitors: prev.competitors?.filter(c => c !== competitor) || []
    }));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleCompetitorKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompetitor();
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 MOZ SEO Analysis
        </h2>
        <p className="text-gray-600">
          Analyze your website's SEO performance with MOZ's Domain Authority, keyword difficulty, and competitor insights
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL *
            </label>
            <Input
              type="url"
              value={analysisData.websiteUrl}
              onChange={(e) => setAnalysisData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              placeholder="https://example.com"
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website Name *
            </label>
            <Input
              type="text"
              value={analysisData.name}
              onChange={(e) => setAnalysisData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Company"
              className="w-full"
              required
            />
          </div>
        </div>

        {/* Location and Target Audience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Location
            </label>
            <select
              value={analysisData.location}
              onChange={(e) => setAnalysisData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {LOCATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <select
              value={analysisData.targetAudience}
              onChange={(e) => setAnalysisData(prev => ({ ...prev, targetAudience: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select target audience...</option>
              {TARGET_AUDIENCE_OPTIONS.map(audience => (
                <option key={audience} value={audience}>
                  {audience}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            {showAdvanced ? '▼ Hide Advanced Options' : '▶ Show Advanced Options'}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Keywords
              </label>
              <div className="flex space-x-2 mb-3">
                <Input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeywordKeyPress}
                  placeholder="Enter a keyword..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addKeyword}
                  disabled={!keywordInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </Button>
              </div>
              {analysisData.keywords && analysisData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analysisData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Competitors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competitor Domains
              </label>
              <div className="flex space-x-2 mb-3">
                <Input
                  type="text"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyPress={handleCompetitorKeyPress}
                  placeholder="competitor.com"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addCompetitor}
                  disabled={!competitorInput.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Add
                </Button>
              </div>
              {analysisData.competitors && analysisData.competitors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analysisData.competitors.map((competitor, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {competitor}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(competitor)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || !analysisData.websiteUrl.trim() || !analysisData.name.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              '🔍 Analyze SEO'
            )}
          </Button>
        </div>
      </form>

      {/* Quick Analysis Options */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Analysis Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900">Domain Authority Check</h4>
              <p className="text-sm text-gray-600 mt-1">Quick DA/PA analysis</p>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-medium text-gray-900">Keyword Difficulty</h4>
              <p className="text-sm text-gray-600 mt-1">Analyze keyword competition</p>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">🏆</div>
              <h4 className="font-medium text-gray-900">Competitor Analysis</h4>
              <p className="text-sm text-gray-600 mt-1">Compare with competitors</p>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
