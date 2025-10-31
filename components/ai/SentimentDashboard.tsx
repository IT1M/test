'use client';

// Sentiment Analysis Dashboard Component
// Displays sentiment analysis results and trends

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getSentimentAnalysisService,
  SentimentAnalysis,
  SentimentTrend,
} from '@/services/gemini/sentiment-analysis';

export function SentimentDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<'customer' | 'employee' | 'social'>('customer');

  const sentimentService = getSentimentAnalysisService();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await sentimentService.getAnalytics(30);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.3) return 'text-green-500';
    if (sentiment < -0.3) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <ThumbsUp className="h-5 w-5" />;
    if (sentiment < -0.3) return <ThumbsDown className="h-5 w-5" />;
    return <Meh className="h-5 w-5" />;
  };

  const getSentimentLabel = (sentiment: number): string => {
    if (sentiment > 0.6) return 'Very Positive';
    if (sentiment > 0.3) return 'Positive';
    if (sentiment > -0.3) return 'Neutral';
    if (sentiment > -0.6) return 'Negative';
    return 'Very Negative';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sentiment Analysis</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor customer feedback, employee satisfaction, and social media sentiment
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Analyses</span>
          </div>
          <div className="text-3xl font-bold">{analytics?.totalAnalyses || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Sentiment</span>
            <span className={getSentimentColor(analytics?.averageSentiment || 0)}>
              {getSentimentIcon(analytics?.averageSentiment || 0)}
            </span>
          </div>
          <div className="text-3xl font-bold">
            {getSentimentLabel(analytics?.averageSentiment || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Score: {(analytics?.averageSentiment || 0).toFixed(2)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Positive</span>
            <ThumbsUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500">
            {(analytics?.positivePercentage || 0).toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Of all feedback</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Negative</span>
            <ThumbsDown className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-500">
            {(analytics?.negativePercentage || 0).toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Needs attention</p>
        </Card>
      </div>

      {/* Tabs for different sources */}
      <Tabs value={activeSource} onValueChange={(v: any) => setActiveSource(v)}>
        <TabsList>
          <TabsTrigger value="customer">Customer Feedback</TabsTrigger>
          <TabsTrigger value="employee">Employee Satisfaction</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Sentiment Overview</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Customer feedback analysis will appear here once feedback data is available.
            </p>
            <div className="mt-4">
              <Button variant="outline">Analyze Customer Feedback</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="employee" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Employee Satisfaction</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Employee satisfaction analysis will appear here once survey data is available.
            </p>
            <div className="mt-4">
              <Button variant="outline">Analyze Employee Feedback</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Social Media Sentiment</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Social media sentiment analysis will appear here once mentions are tracked.
            </p>
            <div className="mt-4">
              <Button variant="outline">Analyze Social Media</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Sentiment Alerts
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No active alerts. Sentiment monitoring is active and will notify you of any significant changes.
          </p>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div>
              <p className="text-sm">
                Continue monitoring sentiment trends to identify patterns early
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div>
              <p className="text-sm">
                Collect more feedback data to improve analysis accuracy
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div>
              <p className="text-sm">
                Set up automated alerts for negative sentiment spikes
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
