import React, { useState, useEffect } from 'react';
// Temporary icon replacements
const Brain = ({ className }: { className?: string }) => <span className={className}>🧠</span>;
const TrendingUp = ({ className }: { className?: string }) => <span className={className}>📈</span>;
const Target = ({ className }: { className?: string }) => <span className={className}>🎯</span>;
const Lightbulb = ({ className }: { className?: string }) => <span className={className}>💡</span>;
const AlertTriangle = ({ className }: { className?: string }) => <span className={className}>⚠️</span>;
const BarChart3 = ({ className }: { className?: string }) => <span className={className}>📊</span>;

interface AIInsight {
  id: string;
  type: 'opportunity' | 'threat' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  data: any;
}

interface CompetitorScore {
  competitor: string;
  overallScore: number;
  categories: {
    innovation: number;
    marketPosition: number;
    customerSatisfaction: number;
    financialHealth: number;
    digitalPresence: number;
  };
}

interface MarketPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  change: number;
  confidence: number;
  timeframe: string;
}

const AIAnalysis: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [competitorScores, setCompetitorScores] = useState<CompetitorScore[]>([]);
  const [predictions, setPredictions] = useState<MarketPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'immediate' | 'short-term' | 'long-term'>('short-term');

  useEffect(() => {
    generateAIInsights();
    generateCompetitorScores();
    generateMarketPredictions();
  }, []);

  const generateAIInsights = () => {
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Emerging Market Gap in Sustainable Furniture',
        description: 'AI analysis reveals a 23% increase in searches for eco-friendly office furniture with limited competitor presence in this segment.',
        confidence: 87,
        impact: 'high',
        timeframe: 'short-term',
        data: { marketSize: '$2.3B', growthRate: '23%' }
      },
      {
        id: '2',
        type: 'threat',
        title: 'Competitor Price Optimization Strategy',
        description: 'Herman Miller has implemented dynamic pricing algorithms, resulting in 15% better conversion rates on premium products.',
        confidence: 92,
        impact: 'medium',
        timeframe: 'immediate',
        data: { conversionIncrease: '15%', priceOptimization: true }
      },
      {
        id: '3',
        type: 'recommendation',
        title: 'AI-Powered Customer Service Implementation',
        description: 'Competitors using AI chatbots show 34% higher customer satisfaction scores. Recommend immediate implementation.',
        confidence: 78,
        impact: 'medium',
        timeframe: 'short-term',
        data: { satisfactionIncrease: '34%', implementationCost: '$150K' }
      },
      {
        id: '4',
        type: 'prediction',
        title: 'Remote Work Furniture Demand Surge',
        description: 'ML models predict 45% increase in home office furniture demand over next 18 months based on employment trends.',
        confidence: 85,
        impact: 'high',
        timeframe: 'long-term',
        data: { demandIncrease: '45%', timeframe: '18 months' }
      }
    ];
    setInsights(mockInsights);
  };

  const generateCompetitorScores = () => {
    const mockScores: CompetitorScore[] = [
      {
        competitor: 'Herman Miller',
        overallScore: 87,
        categories: {
          innovation: 92,
          marketPosition: 89,
          customerSatisfaction: 85,
          financialHealth: 88,
          digitalPresence: 81
        }
      },
      {
        competitor: 'Steelcase',
        overallScore: 82,
        categories: {
          innovation: 78,
          marketPosition: 85,
          customerSatisfaction: 83,
          financialHealth: 86,
          digitalPresence: 78
        }
      },
      {
        competitor: 'Haworth',
        overallScore: 75,
        categories: {
          innovation: 72,
          marketPosition: 76,
          customerSatisfaction: 79,
          financialHealth: 74,
          digitalPresence: 74
        }
      }
    ];
    setCompetitorScores(mockScores);
  };

  const generateMarketPredictions = () => {
    const mockPredictions: MarketPrediction[] = [
      {
        metric: 'Market Share',
        currentValue: 28.5,
        predictedValue: 31.2,
        change: 2.7,
        confidence: 84,
        timeframe: '6 months'
      },
      {
        metric: 'Average Selling Price',
        currentValue: 1395,
        predictedValue: 1450,
        change: 55,
        confidence: 76,
        timeframe: '3 months'
      },
      {
        metric: 'Customer Acquisition Cost',
        currentValue: 245,
        predictedValue: 220,
        change: -25,
        confidence: 82,
        timeframe: '6 months'
      }
    ];
    setPredictions(mockPredictions);
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    generateAIInsights();
    generateCompetitorScores();
    generateMarketPredictions();
    setIsAnalyzing(false);
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return <Target className="w-5 h-5 text-green-600" />;
      case 'threat': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case 'prediction': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default: return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredInsights = insights.filter(insight => insight.timeframe === selectedTimeframe);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Analysis</h2>
            <p className="text-gray-600">Machine learning insights and competitive intelligence</p>
          </div>
        </div>
        <button
          onClick={runAIAnalysis}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Brain className="w-4 h-4" />
          <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
        </button>
      </div>

      {/* Competitor Scoring */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Competitor Scoring</h3>
        <div className="space-y-4">
          {competitorScores.map((score, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{score.competitor}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">{score.overallScore}</span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(score.categories).map(([category, value]) => (
                  <div key={category} className="text-center">
                    <div className="text-sm font-medium text-gray-600 capitalize mb-1">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{value}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Predictions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{prediction.metric}</h4>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-medium">{prediction.currentValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Predicted:</span>
                  <span className="font-medium">{prediction.predictedValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Change:</span>
                  <span className={`font-medium ${prediction.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {prediction.change > 0 ? '+' : ''}{prediction.change}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          <div className="flex space-x-2">
            {['immediate', 'short-term', 'long-term'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredInsights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                      <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;
