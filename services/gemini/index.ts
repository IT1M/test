// Gemini AI Services - Main Export File
// Centralized exports for all Gemini AI services

export { GeminiService, getGeminiService, resetGeminiService } from './client';
export { ForecastingService } from './forecasting';
export { PricingService } from './pricing';
export { InsightsService } from './insights';
export { MedicalAnalysisService } from './medical';
export { OCRService } from './ocr';

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
  const geminiClient = getGeminiService();

  return {
    client: geminiClient,
    forecasting: new ForecastingService(geminiClient),
    pricing: new PricingService(geminiClient),
    insights: new InsightsService(geminiClient),
    medical: new MedicalAnalysisService(geminiClient),
    ocr: new OCRService(geminiClient),
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
  resetGeminiService();
}
