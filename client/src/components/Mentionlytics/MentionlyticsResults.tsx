import React, { useState } from 'react';
import Card from '../ui/Card';

interface MentionlyticsResultsProps {
  results: MentionlyticsSearchResults | null;
  loading?: boolean;
}

export interface MentionlyticsSearchResults {
  keyword: string;
  totalMentions: number;
  mentions: MentionlyticsMention[];
  processingTime: number;
  timestamp: string;
}

export interface MentionlyticsMention {
  id: string;
  platform: string;
  content: string;
  author: {
    name: string;
    username: string;
    followers: number;
    verified: boolean;
    profileUrl: string;
  };
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
    retweets?: number;
  };
  mentions: string[];
  hashtags: string[];
  language: string;
  location?: {
    country: string;
    city?: string;
  };
  reach: number;
  influence: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '🐦',
  facebook: '📘',
  instagram: '📷',
  linkedin: '💼',
  youtube: '📺',
  reddit: '🤖',
  tiktok: '🎵'
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-green-600 bg-green-50',
  negative: 'text-red-600 bg-red-50',
  neutral: 'text-gray-600 bg-gray-50'
};

const SENTIMENT_ICONS: Record<string, string> = {
  positive: '😊',
  negative: '😞',
  neutral: '😐'
};

export const MentionlyticsResults: React.FC<MentionlyticsResultsProps> = ({
  results,
  loading = false
}) => {
  const [selectedMention, setSelectedMention] = useState<MentionlyticsMention | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'engagement' | 'influence'>('date');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching social media mentions...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to Search
          </h3>
          <p className="text-gray-600">
            Enter a keyword or brand name above to start searching for mentions
          </p>
        </div>
      </Card>
    );
  }

  // Filter and sort mentions
  let filteredMentions = results.mentions;

  if (filterSentiment !== 'all') {
    filteredMentions = filteredMentions.filter(m => m.sentiment === filterSentiment);
  }

  if (filterPlatform !== 'all') {
    filteredMentions = filteredMentions.filter(m => m.platform === filterPlatform);
  }

  // Sort mentions
  filteredMentions = [...filteredMentions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      case 'engagement':
        const aEngagement = a.engagement.likes + a.engagement.shares + a.engagement.comments;
        const bEngagement = b.engagement.likes + b.engagement.shares + b.engagement.comments;
        return bEngagement - aEngagement;
      case 'influence':
        return b.influence - a.influence;
      default:
        return 0;
    }
  });

  // Calculate analytics
  const sentimentBreakdown = results.mentions.reduce((acc, mention) => {
    acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformBreakdown = results.mentions.reduce((acc, mention) => {
    acc[mention.platform] = (acc[mention.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEngagement = results.mentions.reduce((sum, mention) => 
    sum + mention.engagement.likes + mention.engagement.shares + mention.engagement.comments, 0
  );

  const averageSentiment = results.mentions.reduce((sum, mention) => 
    sum + mention.sentimentScore, 0
  ) / results.mentions.length;

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            📊 Search Results for "{results.keyword}"
          </h3>
          <p className="text-sm text-gray-600">
            Found {results.totalMentions} mentions • Processed in {results.processingTime}ms
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{results.totalMentions}</div>
            <div className="text-sm text-blue-700">Total Mentions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(averageSentiment * 100)}%
            </div>
            <div className="text-sm text-green-700">Avg Sentiment</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {totalEngagement.toLocaleString()}
            </div>
            <div className="text-sm text-purple-700">Total Engagement</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {Object.keys(platformBreakdown).length}
            </div>
            <div className="text-sm text-orange-700">Platforms</div>
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Sentiment Breakdown</h4>
          <div className="flex space-x-4">
            {Object.entries(sentimentBreakdown).map(([sentiment, count]) => (
              <div key={sentiment} className="flex items-center space-x-2">
                <span className="text-lg">{SENTIMENT_ICONS[sentiment]}</span>
                <span className="text-sm font-medium capitalize">{sentiment}</span>
                <span className="text-sm text-gray-600">({count})</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters and Sorting */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'engagement' | 'influence')}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="date">Latest First</option>
              <option value="engagement">Most Engaged</option>
              <option value="influence">Most Influential</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sentiment:</label>
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Platform:</label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Platforms</option>
              {Object.keys(platformBreakdown).map(platform => (
                <option key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredMentions.length} of {results.totalMentions} mentions
          </div>
        </div>
      </Card>

      {/* Mentions List */}
      <div className="space-y-4">
        {filteredMentions.map((mention) => (
          <Card key={mention.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              {/* Platform Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">{PLATFORM_ICONS[mention.platform] || '📱'}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{mention.author.name}</span>
                    {mention.author.verified && <span className="text-blue-500">✓</span>}
                    <span className="text-sm text-gray-500">@{mention.author.username}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {mention.author.followers.toLocaleString()} followers
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${SENTIMENT_COLORS[mention.sentiment]}`}>
                      {SENTIMENT_ICONS[mention.sentiment]} {mention.sentiment}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(mention.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-900 mb-3 leading-relaxed">
                  {mention.content}
                </p>

                {/* Hashtags */}
                {mention.hashtags.length > 0 && (
                  <div className="mb-3">
                    {mention.hashtags.map((hashtag, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Engagement Metrics */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>❤️ {mention.engagement.likes.toLocaleString()}</span>
                    <span>🔄 {mention.engagement.shares.toLocaleString()}</span>
                    <span>💬 {mention.engagement.comments.toLocaleString()}</span>
                    {mention.engagement.views && (
                      <span>👁️ {mention.engagement.views.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      Reach: {mention.reach.toLocaleString()}
                    </span>
                    <a
                      href={mention.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Post →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredMentions.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No mentions found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
