// Gemini AI Services - Main Export File
// Centralized exports for all AI-powered services

// Core client
export { GeminiService, getGeminiService, resetGeminiService } from './client';

// Existing services
export { ForecastingService } from './forecasting';
export { PricingService } from './pricing';
export { InsightsService } from './insights';
export { MedicalAnalysisService } from './medical';
export { OCRService } from './ocr';

// New advanced AI services
export {
  ChatbotService,
  getChatbotService,
  type ChatMessage,
  type ChatAction,
  type ChatSession,
} from './chatbot';

export {
  DocumentGenerationService,
  getDocumentGenerationService,
  type DocumentTemplate,
  type GeneratedDocument,
} from './document-generation';

export {
  SentimentAnalysisService,
  getSentimentAnalysisService,
  type SentimentScore,
  type SentimentAnalysis,
  type FeedbackItem,
  type SentimentTrend,
} from './sentiment-analysis';

export {
  WorkflowAutomationService,
  getWorkflowAutomationService,
  type WorkflowRule,
  type WorkflowTrigger,
  type WorkflowCondition,
  type WorkflowAction,
  type WorkflowExecutionResult,
  type TaskPattern,
  type ProcessImprovement,
} from './workflow-automation';
