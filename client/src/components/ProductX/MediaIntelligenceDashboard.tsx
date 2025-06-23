import React, { useState } from 'react';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// Media intelligence interfaces
interface MediaActivity {
  id: string;
  competitor: string;
  platform: string;
  contentType: string;
  timestamp: string;
  engagement: number;
  reach: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  content: string;
  performance: 'high' | 'medium' | 'low';
}

interface ChannelPerformance {
  channel: string;
  competitor: string;
  followers: number;
  engagement: number;
  postFrequency: number;
  avgReach: number;
  growthRate: number;
  contentTypes: string[];
  topPerformingContent: string;
}

interface MediaSpendEstimate {
  competitor: string;
  platform: string;
  estimatedSpend: number;
  adTypes: string[];
  targetAudience: string[];
  campaignThemes: string[];
  effectiveness: number;
  period: string;
}

interface ContentAnalysis {
  contentType: string;
  frequency: number;
  avgEngagement: number;
  topTopics: string[];
  sentiment: number;
  effectiveness: 'high' | 'medium' | 'low';
  trends: string[];
}

interface CreativeInsight {
  insight: string;
  category: string;
  impact: 'high' | 'medium' | 'low';
  examples: string[];
  recommendation: string;
  competitors: string[];
}

const MediaIntelligenceDashboard: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [timeframe, setTimeframe] = useState('30d');
  const [viewMode, setViewMode] = useState('activity');

  // Mock media activity data
  const mediaActivities: MediaActivity[] = [
    {
      id: '1',
      competitor: 'Purple',
      platform: 'Instagram',
      contentType: 'Video',
      timestamp: '2 hours ago',
      engagement: 8.5,
      reach: 125000,
      sentiment: 'positive',
      content: 'New cooling technology demonstration',
      performance: 'high'
    },
    {
      id: '2',
      competitor: 'Casper',
      platform: 'TikTok',
      contentType: 'Video',
      timestamp: '4 hours ago',
      engagement: 12.3,
      reach: 89000,
      sentiment: 'positive',
      content: 'Sleep tips and mattress unboxing',
      performance: 'high'
    },
    {
      id: '3',
      competitor: 'Tempur-Pedic',
      platform: 'YouTube',
      contentType: 'Advertisement',
      timestamp: '6 hours ago',
      engagement: 3.2,
      reach: 450000,
      sentiment: 'neutral',
      content: 'Premium mattress commercial',
      performance: 'medium'
    },
    {
      id: '4',
      competitor: 'Tuft & Needle',
      platform: 'Facebook',
      contentType: 'Post',
      timestamp: '8 hours ago',
      engagement: 5.7,
      reach: 32000,
      sentiment: 'positive',
      content: 'Customer testimonial and review',
      performance: 'medium'
    }
  ];

  const channelPerformance: ChannelPerformance[] = [
    {
      channel: 'Instagram',
      competitor: 'Purple',
      followers: 285000,
      engagement: 8.5,
      postFrequency: 5,
      avgReach: 95000,
      growthRate: 15.2,
      contentTypes: ['Videos', 'Stories', 'Reels'],
      topPerformingContent: 'Product demonstrations'
    },
    {
      channel: 'TikTok',
      competitor: 'Casper',
      followers: 420000,
      engagement: 12.3,
      postFrequency: 8,
      avgReach: 180000,
      growthRate: 28.7,
      contentTypes: ['Short videos', 'Challenges', 'Tips'],
      topPerformingContent: 'Sleep tips and hacks'
    },
    {
      channel: 'YouTube',
      competitor: 'Tempur-Pedic',
      followers: 156000,
      engagement: 4.2,
      postFrequency: 2,
      avgReach: 320000,
      growthRate: 8.9,
      contentTypes: ['Commercials', 'Reviews', 'Education'],
      topPerformingContent: 'Medical endorsements'
    },
    {
      channel: 'Facebook',
      competitor: 'Tuft & Needle',
      followers: 198000,
      engagement: 6.1,
      postFrequency: 4,
      avgReach: 45000,
      growthRate: 5.3,
      contentTypes: ['Posts', 'Videos', 'Customer stories'],
      topPerformingContent: 'Customer testimonials'
    }
  ];

  const mediaSpendEstimates: MediaSpendEstimate[] = [
    {
      competitor: 'Purple',
      platform: 'Instagram',
      estimatedSpend: 450000,
      adTypes: ['Video ads', 'Story ads', 'Carousel ads'],
      targetAudience: ['Health-conscious millennials', 'Tech enthusiasts'],
      campaignThemes: ['Cooling technology', 'Innovation', 'Comfort'],
      effectiveness: 85,
      period: 'Last 30 days'
    },
    {
      competitor: 'Casper',
      platform: 'TikTok',
      estimatedSpend: 320000,
      adTypes: ['In-feed videos', 'Brand takeovers', 'Hashtag challenges'],
      targetAudience: ['Gen Z', 'Young millennials', 'Urban professionals'],
      campaignThemes: ['Sleep wellness', 'Lifestyle', 'Convenience'],
      effectiveness: 78,
      period: 'Last 30 days'
    },
    {
      competitor: 'Tempur-Pedic',
      platform: 'YouTube',
      estimatedSpend: 680000,
      adTypes: ['Pre-roll ads', 'Display ads', 'Bumper ads'],
      targetAudience: ['Affluent adults', 'Health-conscious consumers'],
      campaignThemes: ['Premium quality', 'Medical benefits', 'Luxury'],
      effectiveness: 72,
      period: 'Last 30 days'
    }
  ];

  const contentAnalysis: ContentAnalysis[] = [
    {
      contentType: 'Product Demonstrations',
      frequency: 35,
      avgEngagement: 9.2,
      topTopics: ['Cooling technology', 'Comfort features', 'Durability'],
      sentiment: 82,
      effectiveness: 'high',
      trends: ['Interactive demos', 'Before/after comparisons', 'User testing']
    },
    {
      contentType: 'Customer Testimonials',
      frequency: 28,
      avgEngagement: 7.8,
      topTopics: ['Sleep quality', 'Pain relief', 'Satisfaction'],
      sentiment: 89,
      effectiveness: 'high',
      trends: ['Video testimonials', 'Real customer stories', 'Health benefits']
    },
    {
      contentType: 'Educational Content',
      frequency: 22,
      avgEngagement: 6.5,
      topTopics: ['Sleep science', 'Health tips', 'Mattress care'],
      sentiment: 75,
      effectiveness: 'medium',
      trends: ['Expert interviews', 'Infographics', 'Sleep studies']
    },
    {
      contentType: 'Lifestyle Content',
      frequency: 18,
      avgEngagement: 8.1,
      topTopics: ['Bedroom design', 'Morning routines', 'Wellness'],
      sentiment: 78,
      effectiveness: 'medium',
      trends: ['Aesthetic content', 'Lifestyle integration', 'Wellness focus']
    }
  ];

  const creativeInsights: CreativeInsight[] = [
    {
      insight: 'Video content outperforms static images by 340%',
      category: 'Content Format',
      impact: 'high',
      examples: ['Product demos', 'Unboxing videos', 'Customer stories'],
      recommendation: 'Increase video content production and focus on dynamic demonstrations',
      competitors: ['Purple', 'Casper', 'Tuft & Needle']
    },
    {
      insight: 'User-generated content drives 2.5x higher engagement',
      category: 'Content Source',
      impact: 'high',
      examples: ['Customer reviews', 'Sleep selfies', 'Bedroom tours'],
      recommendation: 'Develop UGC campaigns and incentivize customer content creation',
      competitors: ['Casper', 'Tuft & Needle']
    },
    {
      insight: 'Health and wellness messaging resonates strongest',
      category: 'Messaging',
      impact: 'medium',
      examples: ['Sleep science', 'Pain relief', 'Recovery benefits'],
      recommendation: 'Emphasize health benefits and scientific backing in content',
      competitors: ['Tempur-Pedic', 'Purple']
    },
    {
      insight: 'Interactive content increases time spent by 180%',
      category: 'Engagement',
      impact: 'medium',
      examples: ['Polls', 'Quizzes', 'AR try-ons'],
      recommendation: 'Implement interactive elements in social media campaigns',
      competitors: ['Purple', 'Casper']
    }
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return productXColors.secondary[500];
      case 'neutral': return productXColors.neutral[400];
      case 'negative': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'high': return productXColors.secondary[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'high': return productXColors.secondary[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return productXColors.alert[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.secondary[500];
      default: return productXColors.neutral[400];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📺 Media Intelligence Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive competitor media strategy monitoring and creative intelligence
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="activity">Media Activity</option>
              <option value="channels">Channel Performance</option>
              <option value="spend">Media Spend</option>
              <option value="content">Content Analysis</option>
              <option value="insights">Creative Insights</option>
            </select>
            <select 
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
            </select>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Mentions</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <p className="text-sm text-green-600">↗ +18% vs last month</p>
            </div>
            <div className="text-3xl">📢</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Sentiment</p>
              <p className="text-2xl font-bold text-gray-900">78%</p>
              <p className="text-sm text-green-600">↗ Positive trend</p>
            </div>
            <div className="text-3xl">😊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Reach</p>
              <p className="text-2xl font-bold text-gray-900">2.1M</p>
              <p className="text-sm text-green-600">↗ +25% growth</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">7.8%</p>
              <p className="text-sm text-green-600">↗ Above industry avg</p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </div>
      </div>

      {/* Media Activity Timeline */}
      {viewMode === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Recent Media Activity</h3>
          <div className="space-y-4">
            {mediaActivities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{activity.competitor}</h4>
                      <p className="text-sm text-gray-500">{activity.platform} • {activity.contentType}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getSentimentColor(activity.sentiment) }}
                    >
                      {activity.sentiment.toUpperCase()}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getPerformanceColor(activity.performance) }}
                    >
                      {activity.performance.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{activity.timestamp}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3">{activity.content}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Engagement: </span>
                    <span className="font-medium">{activity.engagement}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Reach: </span>
                    <span className="font-medium">{activity.reach.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel Performance */}
      {viewMode === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {channelPerformance.map((channel, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{channel.competitor}</h3>
                  <p className="text-sm text-gray-500">{channel.channel}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{channel.followers.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">followers</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Engagement Rate</p>
                  <p className="font-medium">{channel.engagement}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Reach</p>
                  <p className="font-medium">{channel.avgReach.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Post Frequency</p>
                  <p className="font-medium">{channel.postFrequency}/week</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Growth Rate</p>
                  <p className="font-medium text-green-600">+{channel.growthRate}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Content Types</p>
                  <div className="flex flex-wrap gap-1">
                    {channel.contentTypes.map((type, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Top Performing: {channel.topPerformingContent}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Spend Analysis */}
      {viewMode === 'spend' && (
        <div className="space-y-6">
          {mediaSpendEstimates.map((spend, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{spend.competitor}</h3>
                  <p className="text-sm text-gray-500">{spend.platform} • {spend.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${spend.estimatedSpend.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Estimated spend</p>
                  <p className="text-sm font-medium text-green-600">{spend.effectiveness}% effectiveness</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-2">AD TYPES</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {spend.adTypes.map((type, idx) => (
                      <li key={idx}>• {type}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-2">TARGET AUDIENCE</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {spend.targetAudience.map((audience, idx) => (
                      <li key={idx}>• {audience}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-600 mb-2">CAMPAIGN THEMES</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {spend.campaignThemes.map((theme, idx) => (
                      <li key={idx}>• {theme}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Analysis */}
      {viewMode === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {contentAnalysis.map((content, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{content.contentType}</h3>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getEffectivenessColor(content.effectiveness) }}
                >
                  {content.effectiveness.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Frequency</p>
                  <p className="font-medium">{content.frequency}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Engagement</p>
                  <p className="font-medium">{content.avgEngagement}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sentiment</p>
                  <p className="font-medium text-green-600">{content.sentiment}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">TOP TOPICS</p>
                  <div className="flex flex-wrap gap-1">
                    {content.topTopics.map((topic, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">TRENDS</p>
                  <div className="flex flex-wrap gap-1">
                    {content.trends.map((trend, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {trend}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creative Insights */}
      {viewMode === 'insights' && (
        <div className="space-y-6">
          {creativeInsights.map((insight, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{insight.insight}</h3>
                  <p className="text-sm text-gray-500">{insight.category}</p>
                </div>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getImpactColor(insight.impact) }}
                >
                  {insight.impact.toUpperCase()} IMPACT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-2">EXAMPLES</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {insight.examples.map((example, idx) => (
                      <li key={idx}>• {example}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">COMPETITORS USING</p>
                  <div className="flex flex-wrap gap-1">
                    {insight.competitors.map((comp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Recommendation:</strong> {insight.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaIntelligenceDashboard;
