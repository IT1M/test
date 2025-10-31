// AI-Powered Sentiment Analysis Service
// Analyzes customer feedback, employee satisfaction, and social media mentions

import { getGeminiService } from './client';
import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sentiment score interface
 */
export interface SentimentScore {
  overall: number; // -1 to 1 (-1 = very negative, 0 = neutral, 1 = very positive)
  positive: number; // 0 to 1
  negative: number; // 0 to 1
  neutral: number; // 0 to 1
  confidence: number; // 0 to 1
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  id: string;
  text: string;
  sentiment: SentimentScore;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  keywords: string[];
  topics: string[];
  summary: string;
  actionableInsights: string[];
  timestamp: Date;
}

/**
 * Feedback item interface
 */
export interface FeedbackItem {
  id: string;
  source: 'customer' | 'employee' | 'social' | 'survey' | 'review';
  sourceId?: string; // Customer ID, Employee ID, etc.
  text: string;
  rating?: number; // 1-5 stars
  category?: string;
  timestamp: Date;
  metadata?: any;
}

/**
 * Sentiment trend interface
 */
export interface SentimentTrend {
  period: string;
  averageSentiment: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalCount: number;
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
  alerts: string[];
}

/**
 * AI-Powered Sentiment Analysis Service
 */
export class SentimentAnalysisService {
  private gemini = getGeminiService();
  private feedbackStore: Map<string, FeedbackItem> = new Map();

  /**
   * Analyze sentiment of a single text
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    const prompt = `Analyze the sentiment of the following text:

"${text}"

Provide a comprehensive sentiment analysis including:
1. Overall sentiment score (-1 to 1)
2. Positive, negative, and neutral percentages
3. Emotional analysis (joy, sadness, anger, fear, surprise)
4. Key words and phrases
5. Main topics discussed
6. Brief summary
7. Actionable insights

Respond in JSON format:
{
  "sentiment": {
    "overall": 0.75,
    "positive": 0.8,
    "negative": 0.1,
    "neutral": 0.1,
    "confidence": 0.95
  },
  "emotions": {
    "joy": 0.7,
    "sadness": 0.1,
    "anger": 0.05,
    "fear": 0.05,
    "surprise": 0.1
  },
  "keywords": ["quality", "excellent", "satisfied"],
  "topics": ["product quality", "customer service"],
  "summary": "Brief summary of the sentiment",
  "actionableInsights": ["Insight 1", "Insight 2"]
}`;

    try {
      const response = await this.gemini.generateJSON<{
        sentiment: SentimentScore;
        emotions: any;
        keywords: string[];
        topics: string[];
        summary: string;
        actionableInsights: string[];
      }>(prompt, false);

      const analysis: SentimentAnalysis = {
        id: uuidv4(),
        text,
        sentiment: response.sentiment,
        emotions: response.emotions,
        keywords: response.keywords,
        topics: response.topics,
        summary: response.summary,
        actionableInsights: response.actionableInsights,
        timestamp: new Date(),
      };

      await this.logAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze batch of feedback items
   */
  async analyzeBatch(feedbackItems: FeedbackItem[]): Promise<SentimentAnalysis[]> {
    const analyses: SentimentAnalysis[] = [];

    for (const item of feedbackItems) {
      try {
        const analysis = await this.analyzeSentiment(item.text);
        analyses.push(analysis);
        
        // Store feedback with analysis
        this.feedbackStore.set(item.id, item);
      } catch (error) {
        console.error(`Failed to analyze feedback ${item.id}:`, error);
      }
    }

    return analyses;
  }

  /**
   * Analyze customer feedback
   */
  async analyzeCustomerFeedback(customerId?: string): Promise<{
    overallSentiment: number;
    analyses: SentimentAnalysis[];
    trends: SentimentTrend[];
    recommendations: string[];
  }> {
    // Get customer feedback from various sources
    const feedback = await this.getCustomerFeedback(customerId);

    if (feedback.length === 0) {
      return {
        overallSentiment: 0,
        analyses: [],
        trends: [],
        recommendations: ['No feedback data available'],
      };
    }

    // Analyze each feedback item
    const analyses = await this.analyzeBatch(feedback);

    // Calculate overall sentiment
    const overallSentiment = analyses.reduce((sum, a) => sum + a.sentiment.overall, 0) / analyses.length;

    // Generate trends
    const trends = this.calculateTrends(analyses);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(analyses, 'customer');

    return {
      overallSentiment,
      analyses,
      trends,
      recommendations,
    };
  }

  /**
   * Analyze employee satisfaction
   */
  async analyzeEmployeeSatisfaction(): Promise<{
    overallSatisfaction: number;
    analyses: SentimentAnalysis[];
    departmentBreakdown: Record<string, number>;
    concerns: string[];
    recommendations: string[];
  }> {
    // Get employee feedback from surveys, reviews, etc.
    const feedback = await this.getEmployeeFeedback();

    if (feedback.length === 0) {
      return {
        overallSatisfaction: 0,
        analyses: [],
        departmentBreakdown: {},
        concerns: [],
        recommendations: ['No employee feedback data available'],
      };
    }

    const analyses = await this.analyzeBatch(feedback);

    const overallSatisfaction = analyses.reduce((sum, a) => sum + a.sentiment.overall, 0) / analyses.length;

    // Extract concerns from negative feedback
    const concerns = analyses
      .filter(a => a.sentiment.overall < -0.3)
      .flatMap(a => a.topics)
      .filter((topic, index, self) => self.indexOf(topic) === index)
      .slice(0, 10);

    const recommendations = await this.generateRecommendations(analyses, 'employee');

    return {
      overallSatisfaction,
      analyses,
      departmentBreakdown: {}, // Would need department data
      concerns,
      recommendations,
    };
  }

  /**
   * Monitor social media mentions
   */
  async analyzeSocialMediaMentions(mentions: string[]): Promise<{
    overallSentiment: number;
    analyses: SentimentAnalysis[];
    viralTopics: string[];
    influencerMentions: number;
    recommendations: string[];
  }> {
    const feedbackItems: FeedbackItem[] = mentions.map(text => ({
      id: uuidv4(),
      source: 'social',
      text,
      timestamp: new Date(),
    }));

    const analyses = await this.analyzeBatch(feedbackItems);

    const overallSentiment = analyses.reduce((sum, a) => sum + a.sentiment.overall, 0) / analyses.length;

    // Identify viral topics (topics mentioned frequently)
    const topicCounts: Record<string, number> = {};
    analyses.forEach(a => {
      a.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const viralTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    const recommendations = await this.generateRecommendations(analyses, 'social');

    return {
      overallSentiment,
      analyses,
      viralTopics,
      influencerMentions: 0, // Would need influencer detection
      recommendations,
    };
  }

  /**
   * Generate sentiment report
   */
  async generateSentimentReport(
    startDate: Date,
    endDate: Date,
    source?: 'customer' | 'employee' | 'social'
  ): Promise<{
    summary: string;
    overallSentiment: number;
    trends: SentimentTrend[];
    topIssues: string[];
    topPraises: string[];
    recommendations: string[];
    alerts: string[];
  }> {
    // Get feedback for the period
    const feedback = await this.getFeedbackByPeriod(startDate, endDate, source);

    if (feedback.length === 0) {
      return {
        summary: 'No feedback data available for this period',
        overallSentiment: 0,
        trends: [],
        topIssues: [],
        topPraises: [],
        recommendations: [],
        alerts: [],
      };
    }

    const analyses = await this.analyzeBatch(feedback);

    const overallSentiment = analyses.reduce((sum, a) => sum + a.sentiment.overall, 0) / analyses.length;

    // Extract issues and praises
    const negativeAnalyses = analyses.filter(a => a.sentiment.overall < -0.3);
    const positiveAnalyses = analyses.filter(a => a.sentiment.overall > 0.3);

    const topIssues = this.extractTopKeywords(negativeAnalyses, 10);
    const topPraises = this.extractTopKeywords(positiveAnalyses, 10);

    const trends = this.calculateTrends(analyses);

    // Generate alerts for negative trends
    const alerts = this.generateAlerts(trends, analyses);

    const recommendations = await this.generateRecommendations(analyses, source || 'customer');

    // Generate summary using AI
    const summary = await this.generateSummary(analyses, startDate, endDate);

    return {
      summary,
      overallSentiment,
      trends,
      topIssues,
      topPraises,
      recommendations,
      alerts,
    };
  }

  /**
   * Calculate sentiment trends over time
   */
  private calculateTrends(analyses: SentimentAnalysis[]): SentimentTrend[] {
    // Group by day
    const groupedByDay: Record<string, SentimentAnalysis[]> = {};

    analyses.forEach(analysis => {
      const day = analysis.timestamp.toISOString().split('T')[0];
      if (!groupedByDay[day]) {
        groupedByDay[day] = [];
      }
      groupedByDay[day].push(analysis);
    });

    // Calculate trends for each day
    const trends: SentimentTrend[] = Object.entries(groupedByDay).map(([day, dayAnalyses]) => {
      const avgSentiment = dayAnalyses.reduce((sum, a) => sum + a.sentiment.overall, 0) / dayAnalyses.length;
      
      const positiveCount = dayAnalyses.filter(a => a.sentiment.overall > 0.3).length;
      const negativeCount = dayAnalyses.filter(a => a.sentiment.overall < -0.3).length;
      const neutralCount = dayAnalyses.length - positiveCount - negativeCount;

      const topPositiveKeywords = this.extractTopKeywords(
        dayAnalyses.filter(a => a.sentiment.overall > 0.3),
        5
      );

      const topNegativeKeywords = this.extractTopKeywords(
        dayAnalyses.filter(a => a.sentiment.overall < -0.3),
        5
      );

      return {
        period: day,
        averageSentiment: avgSentiment,
        positiveCount,
        negativeCount,
        neutralCount,
        totalCount: dayAnalyses.length,
        topPositiveKeywords,
        topNegativeKeywords,
        alerts: [],
      };
    });

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Extract top keywords from analyses
   */
  private extractTopKeywords(analyses: SentimentAnalysis[], limit: number): string[] {
    const keywordCounts: Record<string, number> = {};

    analyses.forEach(analysis => {
      analysis.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    });

    return Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword]) => keyword);
  }

  /**
   * Generate alerts for negative trends
   */
  private generateAlerts(trends: SentimentTrend[], analyses: SentimentAnalysis[]): string[] {
    const alerts: string[] = [];

    // Check for declining sentiment
    if (trends.length >= 3) {
      const recentTrends = trends.slice(-3);
      const isDecreasing = recentTrends.every((trend, i) => 
        i === 0 || trend.averageSentiment < recentTrends[i - 1].averageSentiment
      );

      if (isDecreasing) {
        alerts.push('⚠️ Sentiment has been declining for the past 3 periods');
      }
    }

    // Check for high negative sentiment
    const recentSentiment = trends[trends.length - 1]?.averageSentiment || 0;
    if (recentSentiment < -0.5) {
      alerts.push('🚨 Critical: Overall sentiment is very negative');
    }

    // Check for spike in negative feedback
    if (trends.length >= 2) {
      const current = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      
      if (current.negativeCount > previous.negativeCount * 1.5) {
        alerts.push('📈 Alert: Significant increase in negative feedback');
      }
    }

    return alerts;
  }

  /**
   * Generate recommendations based on sentiment analysis
   */
  private async generateRecommendations(
    analyses: SentimentAnalysis[],
    source: string
  ): Promise<string[]> {
    const negativeAnalyses = analyses.filter(a => a.sentiment.overall < -0.3);
    
    if (negativeAnalyses.length === 0) {
      return ['Continue current practices - sentiment is positive'];
    }

    const topIssues = this.extractTopKeywords(negativeAnalyses, 5);
    const topTopics = negativeAnalyses
      .flatMap(a => a.topics)
      .filter((topic, index, self) => self.indexOf(topic) === index)
      .slice(0, 5);

    const prompt = `Based on sentiment analysis of ${source} feedback, generate actionable recommendations.

Top Issues: ${topIssues.join(', ')}
Top Topics: ${topTopics.join(', ')}
Negative Feedback Count: ${negativeAnalyses.length}
Total Feedback Count: ${analyses.length}

Provide 5-7 specific, actionable recommendations to address the issues and improve sentiment.
Focus on practical steps that can be implemented immediately.

Respond with a JSON array of recommendation strings.`;

    try {
      const recommendations = await this.gemini.generateJSON<string[]>(prompt, false);
      return recommendations;
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return ['Review negative feedback and address common concerns'];
    }
  }

  /**
   * Generate summary of sentiment analysis
   */
  private async generateSummary(
    analyses: SentimentAnalysis[],
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const overallSentiment = analyses.reduce((sum, a) => sum + a.sentiment.overall, 0) / analyses.length;
    const positiveCount = analyses.filter(a => a.sentiment.overall > 0.3).length;
    const negativeCount = analyses.filter(a => a.sentiment.overall < -0.3).length;

    const prompt = `Generate a brief executive summary of sentiment analysis results.

Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
Total Feedback: ${analyses.length}
Overall Sentiment: ${overallSentiment.toFixed(2)} (-1 to 1 scale)
Positive Feedback: ${positiveCount}
Negative Feedback: ${negativeCount}

Write a 2-3 sentence summary highlighting the key findings and overall sentiment trend.
Be concise and focus on actionable insights.`;

    try {
      const summary = await this.gemini.generateContent(prompt, false);
      return summary.trim();
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return `Analyzed ${analyses.length} feedback items with an overall sentiment of ${overallSentiment.toFixed(2)}.`;
    }
  }

  /**
   * Get customer feedback (placeholder - would integrate with actual data sources)
   */
  private async getCustomerFeedback(customerId?: string): Promise<FeedbackItem[]> {
    // This would integrate with actual customer feedback sources
    // For now, return empty array
    return [];
  }

  /**
   * Get employee feedback (placeholder)
   */
  private async getEmployeeFeedback(): Promise<FeedbackItem[]> {
    // This would integrate with employee survey/feedback systems
    return [];
  }

  /**
   * Get feedback by period (placeholder)
   */
  private async getFeedbackByPeriod(
    startDate: Date,
    endDate: Date,
    source?: string
  ): Promise<FeedbackItem[]> {
    // This would query feedback from database
    return [];
  }

  /**
   * Log sentiment analysis
   */
  private async logAnalysis(analysis: SentimentAnalysis): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: 'sentiment_analysis',
        entityType: 'sentiment',
        details: JSON.stringify({
          sentiment: analysis.sentiment.overall,
          confidence: analysis.sentiment.confidence,
          keywords: analysis.keywords.slice(0, 5),
        }),
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log sentiment analysis:', error);
    }
  }

  /**
   * Get sentiment analytics
   */
  async getAnalytics(days: number = 30): Promise<{
    totalAnalyses: number;
    averageSentiment: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.systemLogs
      .where('action')
      .equals('sentiment_analysis')
      .and(log => log.timestamp >= startDate)
      .toArray();

    let totalSentiment = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    logs.forEach(log => {
      const details = JSON.parse(log.details);
      totalSentiment += details.sentiment;

      if (details.sentiment > 0.3) positiveCount++;
      else if (details.sentiment < -0.3) negativeCount++;
      else neutralCount++;
    });

    const total = logs.length;

    return {
      totalAnalyses: total,
      averageSentiment: total > 0 ? totalSentiment / total : 0,
      positivePercentage: total > 0 ? (positiveCount / total) * 100 : 0,
      negativePercentage: total > 0 ? (negativeCount / total) * 100 : 0,
      neutralPercentage: total > 0 ? (neutralCount / total) * 100 : 0,
    };
  }
}

// Export singleton instance
let sentimentAnalysisServiceInstance: SentimentAnalysisService | null = null;

export function getSentimentAnalysisService(): SentimentAnalysisService {
  if (!sentimentAnalysisServiceInstance) {
    sentimentAnalysisServiceInstance = new SentimentAnalysisService();
  }
  return sentimentAnalysisServiceInstance;
}
