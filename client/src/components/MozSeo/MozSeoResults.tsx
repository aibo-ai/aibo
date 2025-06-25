import React, { useState } from 'react';
import Card from '../ui/Card';

interface MozSeoResultsProps {
  results: MozSeoAnalysisResults | null;
  loading?: boolean;
}

export interface MozSeoAnalysisResults {
  website: {
    url: string;
    name: string;
    metrics: {
      domainAuthority: number;
      pageAuthority: number;
      spamScore: number;
      linkingRootDomains: number;
      totalLinks: number;
      mozRank: number;
      mozTrust: number;
    };
  };
  keywords: {
    primary: Array<{
      keyword: string;
      difficulty: number;
      volume: number;
      opportunity: number;
    }>;
    opportunities: Array<{
      keyword: string;
      difficulty: number;
      volume: number;
      opportunity: number;
    }>;
    competitive: Array<{
      keyword: string;
      difficulty: number;
      volume: number;
      opportunity: number;
    }>;
  };
  competitors: Array<{
    domain: string;
    competitors: Array<{
      domain: string;
      domainAuthority: number;
      commonKeywords: number;
      overlapScore: number;
    }>;
  }>;
  recommendations: {
    technical: string[];
    content: string[];
    linkBuilding: string[];
    keywords: string[];
  };
  scores: {
    overall: number;
    technical: number;
    content: number;
    authority: number;
  };
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 30) return 'text-green-600 bg-green-50';
  if (difficulty <= 60) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

export const MozSeoResults: React.FC<MozSeoResultsProps> = ({
  results,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'competitors' | 'recommendations'>('overview');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing SEO metrics with MOZ...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready for SEO Analysis
          </h3>
          <p className="text-gray-600">
            Enter your website details above to get comprehensive SEO insights powered by MOZ
          </p>
        </div>
      </Card>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'keywords', label: 'Keywords', icon: '🎯' },
    { id: 'competitors', label: 'Competitors', icon: '🏆' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Scores */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            📈 SEO Analysis for {results.website.name}
          </h3>
          <p className="text-sm text-gray-600">
            {results.website.url}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(results.scores.overall)}`}>
              {results.scores.overall}
            </div>
            <div className="text-sm text-blue-700">Overall Score</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {results.website.metrics.domainAuthority}
            </div>
            <div className="text-sm text-green-700">Domain Authority</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {results.website.metrics.pageAuthority}
            </div>
            <div className="text-sm text-purple-700">Page Authority</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {results.website.metrics.spamScore}%
            </div>
            <div className="text-sm text-orange-700">Spam Score</div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="p-0">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Technical Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Technical Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Domain Authority</span>
                      <span className="font-medium">{results.website.metrics.domainAuthority}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Page Authority</span>
                      <span className="font-medium">{results.website.metrics.pageAuthority}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Linking Root Domains</span>
                      <span className="font-medium">{results.website.metrics.linkingRootDomains.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Links</span>
                      <span className="font-medium">{results.website.metrics.totalLinks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">MozRank</span>
                      <span className="font-medium">{results.website.metrics.mozRank.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">MozTrust</span>
                      <span className="font-medium">{results.website.metrics.mozTrust.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Score Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Technical Score</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(results.scores.technical)}`}>
                        {results.scores.technical}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Content Score</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(results.scores.content)}`}>
                        {results.scores.content}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Authority Score</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(results.scores.authority)}`}>
                        {results.scores.authority}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keywords Tab */}
          {activeTab === 'keywords' && (
            <div className="space-y-6">
              {/* Primary Keywords */}
              {results.keywords.primary.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">🎯 Primary Target Keywords (Easy)</h4>
                  <div className="grid gap-3">
                    {results.keywords.primary.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{keyword.keyword}</span>
                          <div className="text-sm text-gray-600">
                            Volume: {keyword.volume.toLocaleString()} • Opportunity: {keyword.opportunity}%
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                          {keyword.difficulty}% difficulty
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunity Keywords */}
              {results.keywords.opportunities.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">💡 Opportunity Keywords (Medium)</h4>
                  <div className="grid gap-3">
                    {results.keywords.opportunities.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{keyword.keyword}</span>
                          <div className="text-sm text-gray-600">
                            Volume: {keyword.volume.toLocaleString()} • Opportunity: {keyword.opportunity}%
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                          {keyword.difficulty}% difficulty
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitive Keywords */}
              {results.keywords.competitive.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">🏆 Competitive Keywords (Hard)</h4>
                  <div className="grid gap-3">
                    {results.keywords.competitive.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{keyword.keyword}</span>
                          <div className="text-sm text-gray-600">
                            Volume: {keyword.volume.toLocaleString()} • Opportunity: {keyword.opportunity}%
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                          {keyword.difficulty}% difficulty
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Competitors Tab */}
          {activeTab === 'competitors' && (
            <div className="space-y-6">
              {results.competitors.map((analysis, index) => (
                <div key={index}>
                  <h4 className="font-medium text-gray-900 mb-4">
                    🏆 Competitors for {analysis.domain}
                  </h4>
                  <div className="grid gap-3">
                    {analysis.competitors.map((competitor, compIndex) => (
                      <div key={compIndex} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{competitor.domain}</span>
                          <div className="text-sm text-gray-600">
                            Common Keywords: {competitor.commonKeywords} • Overlap: {competitor.overlapScore}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{competitor.domainAuthority}</div>
                          <div className="text-xs text-gray-500">Domain Authority</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* Technical Recommendations */}
              {results.recommendations.technical.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">🔧 Technical Recommendations</h4>
                  <div className="space-y-2">
                    {results.recommendations.technical.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span className="text-gray-900">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Recommendations */}
              {results.recommendations.content.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">📝 Content Recommendations</h4>
                  <div className="space-y-2">
                    {results.recommendations.content.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span className="text-gray-900">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link Building Recommendations */}
              {results.recommendations.linkBuilding.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">🔗 Link Building Recommendations</h4>
                  <div className="space-y-2">
                    {results.recommendations.linkBuilding.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span className="text-gray-900">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyword Recommendations */}
              {results.recommendations.keywords.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">🎯 Keyword Recommendations</h4>
                  <div className="space-y-2">
                    {results.recommendations.keywords.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        <span className="text-gray-900">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
