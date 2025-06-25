import React, { useState } from 'react';
import Card from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MentionlyticsSearchProps {
  onSearch: (searchData: MentionlyticsSearchData) => void;
  loading?: boolean;
}

export interface MentionlyticsSearchData {
  keyword: string;
  platforms: string[];
  languages: string[];
  countries: string[];
  startDate?: string;
  endDate?: string;
  limit: number;
  sentimentFilter?: 'positive' | 'negative' | 'neutral';
  includeInfluencers: boolean;
}

const AVAILABLE_PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'reddit', name: 'Reddit', icon: '🤖' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' }
];

const AVAILABLE_LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'it', name: 'Italian' },
  { id: 'pt', name: 'Portuguese' },
  { id: 'ja', name: 'Japanese' },
  { id: 'ko', name: 'Korean' },
  { id: 'zh', name: 'Chinese' }
];

const AVAILABLE_COUNTRIES = [
  { id: 'US', name: 'United States' },
  { id: 'GB', name: 'United Kingdom' },
  { id: 'CA', name: 'Canada' },
  { id: 'AU', name: 'Australia' },
  { id: 'DE', name: 'Germany' },
  { id: 'FR', name: 'France' },
  { id: 'ES', name: 'Spain' },
  { id: 'IT', name: 'Italy' },
  { id: 'JP', name: 'Japan' },
  { id: 'KR', name: 'South Korea' },
  { id: 'IN', name: 'India' },
  { id: 'BR', name: 'Brazil' }
];

export const MentionlyticsSearch: React.FC<MentionlyticsSearchProps> = ({
  onSearch,
  loading = false
}) => {
  const [searchData, setSearchData] = useState<MentionlyticsSearchData>({
    keyword: '',
    platforms: ['twitter', 'facebook', 'instagram'],
    languages: ['en'],
    countries: ['US'],
    limit: 100,
    includeInfluencers: true
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchData.keyword.trim()) {
      onSearch(searchData);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSearchData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const toggleLanguage = (languageId: string) => {
    setSearchData(prev => ({
      ...prev,
      languages: prev.languages.includes(languageId)
        ? prev.languages.filter(l => l !== languageId)
        : [...prev.languages, languageId]
    }));
  };

  const toggleCountry = (countryId: string) => {
    setSearchData(prev => ({
      ...prev,
      countries: prev.countries.includes(countryId)
        ? prev.countries.filter(c => c !== countryId)
        : [...prev.countries, countryId]
    }));
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 Social Media Listening
        </h2>
        <p className="text-gray-600">
          Search and analyze mentions across social platforms using Mentionlytics
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Keyword Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Keyword or Brand Name *
          </label>
          <Input
            type="text"
            value={searchData.keyword}
            onChange={(e) => setSearchData(prev => ({ ...prev, keyword: e.target.value }))}
            placeholder="Enter brand name, product, or keyword..."
            className="w-full"
            required
          />
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Social Platforms
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AVAILABLE_PLATFORMS.map(platform => (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  searchData.platforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{platform.icon}</div>
                <div className="text-xs font-medium">{platform.name}</div>
              </button>
            ))}
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
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={searchData.startDate || ''}
                  onChange={(e) => setSearchData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={searchData.endDate || ''}
                  onChange={(e) => setSearchData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Languages
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {AVAILABLE_LANGUAGES.map(language => (
                  <button
                    key={language.id}
                    type="button"
                    onClick={() => toggleLanguage(language.id)}
                    className={`p-2 rounded border text-xs ${
                      searchData.languages.includes(language.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {language.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Countries
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {AVAILABLE_COUNTRIES.map(country => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => toggleCountry(country.id)}
                    className={`p-2 rounded border text-xs ${
                      searchData.countries.includes(country.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result Limit
                </label>
                <select
                  value={searchData.limit}
                  onChange={(e) => setSearchData(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={50}>50 mentions</option>
                  <option value={100}>100 mentions</option>
                  <option value={250}>250 mentions</option>
                  <option value={500}>500 mentions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentiment Filter
                </label>
                <select
                  value={searchData.sentimentFilter || ''}
                  onChange={(e) => setSearchData(prev => ({ 
                    ...prev, 
                    sentimentFilter: e.target.value as 'positive' | 'negative' | 'neutral' | undefined 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Sentiments</option>
                  <option value="positive">Positive Only</option>
                  <option value="negative">Negative Only</option>
                  <option value="neutral">Neutral Only</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchData.includeInfluencers}
                    onChange={(e) => setSearchData(prev => ({ ...prev, includeInfluencers: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include Influencers
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || !searchData.keyword.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </div>
            ) : (
              '🔍 Search Mentions'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
