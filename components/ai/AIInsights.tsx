'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getGeminiService } from '@/services/gemini/client';
import { InsightsService } from '@/services/gemini/insights';
import type { DailyBriefing, Anomaly } from '@/types/database';

/**
 * AI Insights Component
 * Displays AI-generated insights, recommendations, and alerts
 */
export function AIInsights() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gemini = getGeminiService();
      const insightsService = new InsightsService(gemini);

      const [dailyBriefing, detectedAnomalies] = await Promise.all([
        insightsService.generateMorningBriefing(),
        insightsService.detectAnomalies(),
      ]);

      setBriefing(dailyBriefing);
      setAnomalies(detectedAnomalies);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError('Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !briefing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadInsights} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Briefing */}
      {briefing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Daily Briefing
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={loadInsights}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Highlights */}
              {briefing.highlights && briefing.highlights.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Key Highlights
                  </h4>
                  <ul className="space-y-2">
                    {briefing.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions Needed */}
              {briefing.actionsNeeded && briefing.actionsNeeded.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Actions Needed Today
                  </h4>
                  <ul className="space-y-2">
                    {briefing.actionsNeeded.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Opportunities */}
              {briefing.opportunities && briefing.opportunities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {briefing.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span className="text-gray-700">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {briefing.recommendations && briefing.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Strategic Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {briefing.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Detected Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          anomaly.severity === 'critical'
                            ? 'destructive'
                            : anomaly.severity === 'high'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {anomaly.severity}
                      </Badge>
                      <span className="font-semibold text-gray-900">
                        {anomaly.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{anomaly.description}</p>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Affected:</span>{' '}
                    {anomaly.affectedEntity}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Recommended Action:
                    </div>
                    <div className="text-sm text-blue-800">
                      {anomaly.recommendedAction}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
