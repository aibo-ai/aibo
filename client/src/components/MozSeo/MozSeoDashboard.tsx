import React, { useState } from 'react';
import { MozSeoAnalyzer, MozSeoAnalysisData } from './MozSeoAnalyzer';
import { MozSeoResults, MozSeoAnalysisResults } from './MozSeoResults';
import Card from '../ui/Card';
import { Button } from '../ui/Button';

interface MozSeoDashboardProps {
  className?: string;
}

export const MozSeoDashboard: React.FC<MozSeoDashboardProps> = ({
  className = ''
}) => {
  const [analysisResults, setAnalysisResults] = useState<MozSeoAnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<string[]>([]);

  const handleAnalyze = async (analysisData: MozSeoAnalysisData) => {
    setLoading(true);
    setError(null);

    try {
      // Call the backend API
      const response = await fetch('/api/moz-seo/seo-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResults(result.data);
        
        // Add to analysis history
        if (!analysisHistory.includes(analysisData.websiteUrl)) {
          setAnalysisHistory(prev => [analysisData.websiteUrl, ...prev.slice(0, 4)]);
        }
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAnalysis = (url: string) => {
    const quickAnalysisData: MozSeoAnalysisData = {
      websiteUrl: url,
      name: new URL(url).hostname,
      location: 'US'
    };
    handleAnalyze(quickAnalysisData);
  };

  const clearResults = () => {
    setAnalysisResults(null);
    setError(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">
          📊 MOZ SEO Optimizer
        </h1>
        <p className="text-blue-100">
          Analyze your website's SEO performance with MOZ's industry-leading metrics including Domain Authority, keyword difficulty, and competitor insights
        </p>
      </div>

      {/* Quick Actions */}
      {analysisHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Recent Analyses</h3>
          <div className="flex flex-wrap gap-2">
            {analysisHistory.map((url, index) => (
              <Button
                key={index}
                onClick={() => handleQuickAnalysis(url)}
                className="text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full"
                disabled={loading}
              >
                {new URL(url).hostname}
              </Button>
            ))}
            <Button
              onClick={() => setAnalysisHistory([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear History
            </Button>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <h4 className="font-medium text-red-800">Analysis Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <Button
              onClick={clearResults}
              className="ml-auto text-red-600 hover:text-red-700 text-sm"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Analysis Form */}
      <MozSeoAnalyzer onAnalyze={handleAnalyze} loading={loading} />

      {/* Results */}
      <MozSeoResults results={analysisResults} loading={loading} />

      {/* Features Overview */}
      {!analysisResults && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-gray-900 mb-2">Domain Authority</h3>
              <p className="text-gray-600 text-sm">
                Get MOZ's industry-standard Domain Authority and Page Authority scores for your website
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-gray-900 mb-2">Keyword Difficulty</h3>
              <p className="text-gray-600 text-sm">
                Analyze keyword competition and find opportunities with MOZ's keyword difficulty scores
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-bold text-gray-900 mb-2">Competitor Analysis</h3>
              <p className="text-gray-600 text-sm">
                Compare your SEO performance with competitors and identify market opportunities
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="font-bold text-gray-900 mb-2">Link Analysis</h3>
              <p className="text-gray-600 text-sm">
                Analyze your backlink profile with linking root domains and total link counts
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-bold text-gray-900 mb-2">Spam Score</h3>
              <p className="text-gray-600 text-sm">
                Monitor your website's spam score and maintain a clean link profile
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-bold text-gray-900 mb-2">SEO Recommendations</h3>
              <p className="text-gray-600 text-sm">
                Get actionable SEO recommendations based on comprehensive analysis
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* MOZ Metrics Explanation */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-bold text-gray-900 mb-4">Understanding MOZ Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Domain Authority (DA)</h4>
            <p className="text-sm text-gray-600 mb-4">
              A score from 1-100 that predicts how well a website will rank on search engines. Higher scores indicate better ranking potential.
            </p>
            
            <h4 className="font-medium text-gray-900 mb-2">Page Authority (PA)</h4>
            <p className="text-sm text-gray-600 mb-4">
              Similar to DA but for individual pages. Measures the ranking strength of a specific page.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Spam Score</h4>
            <p className="text-sm text-gray-600 mb-4">
              Percentage score representing the likelihood that a site is spammy. Lower scores are better.
            </p>
            
            <h4 className="font-medium text-gray-900 mb-2">Keyword Difficulty</h4>
            <p className="text-sm text-gray-600">
              Percentage score indicating how difficult it would be to rank for a specific keyword. Lower scores mean easier to rank.
            </p>
          </div>
        </div>
      </Card>

      {/* API Status */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">MOZ API Connected</span>
          </div>
          <div className="text-xs text-gray-500">
            Powered by MOZ Link Explorer API
          </div>
        </div>
      </Card>
    </div>
  );
};
