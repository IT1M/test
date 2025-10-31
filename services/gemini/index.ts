// Gemini AI Services - Main Export File
// Centralized exports for all Gemini AI services

import { GeminiService as GeminiServiceClass, getGeminiService as getGeminiServiceFn, resetGeminiService as resetGeminiServiceFn } from './client';
import { ForecastingService as ForecastingServiceClass } from './forecasting';
import { PricingService as PricingServiceClass } from './pricing';
import { InsightsService as InsightsServiceClass } from './insights';
import { MedicalAnalysisService as MedicalAnalysisServiceClass } from './medical';
import { OCRService as OCRServiceClass } from './ocr';

export { GeminiServiceClass as GeminiService, getGeminiServiceFn as getGeminiService, resetGeminiServiceFn as resetGeminiService };
export { ForecastingServiceClass as ForecastingService };
export { PricingServiceClass as PricingService };
export { InsightsServiceClass as InsightsService };
export { MedicalAnalysisServiceClass as MedicalAnalysisService };
export { OCRServiceClass as OCRService };

// Re-export types for convenience
export type {
  DemandForecast,
  PricingRecommendation,
  BundleRecommendation,
  DailyBriefing,
  Anomaly,
  MedicalAnalysis,
  ProcessedDocument,
  DemandPrediction,
} from '@/types/database';

/**
 * Initialize all Gemini services with a single client
 * 
 * @example
 * ```typescript
 * const services = initializeGeminiServices();
 * const forecast = await services.forecasting.forecastDemand('product-id', 30);
 * const pricing = await services.pricing.optimizePricing('product-id');
 * ```
 */
export function initializeGeminiServices() {
  const geminiClient = getGeminiServiceFn();

  return {
    client: geminiClient,
    forecasting: new ForecastingServiceClass(geminiClient),
    pricing: new PricingServiceClass(geminiClient),
    insights: new InsightsServiceClass(geminiClient),
    medical: new MedicalAnalysisServiceClass(geminiClient),
    ocr: new OCRServiceClass(geminiClient),
  };
}

/**
 * Singleton instance of all services
 */
let servicesInstance: ReturnType<typeof initializeGeminiServices> | null = null;

/**
 * Get singleton instance of all Gemini services
 * 
 * @example
 * ```typescript
 * const services = getGeminiServices();
 * await services.forecasting.forecastDemand('product-id', 30);
 * ```
 */
export function getGeminiServices() {
  if (!servicesInstance) {
    servicesInstance = initializeGeminiServices();
  }
  return servicesInstance;
}

/**
 * Reset services instance (useful for testing)
 */
export function resetGeminiServices() {
  servicesInstance = null;
  resetGeminiServiceFn();
}
