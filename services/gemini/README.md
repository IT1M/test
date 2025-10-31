# Gemini AI Services

This directory contains all AI-powered services using Google's Gemini API for the Medical Products Company Management System.

## Services Overview

### 1. GeminiService (client.ts)
Base client for all Gemini API interactions.

**Features:**
- Rate limiting (60 requests per minute)
- Response caching (5-minute TTL)
- Automatic retry with exponential backoff
- API call logging to SystemLogs
- Error handling and recovery

**Usage:**
```typescript
import { getGeminiService } from '@/services/gemini';

const gemini = getGeminiService();
const response = await gemini.generateContent('Your prompt here');
```

### 2. ForecastingService (forecasting.ts)
Demand forecasting and inventory optimization.

**Features:**
- Forecast product demand for 30/60/90 days
- Detect trending products with increasing demand
- Calculate optimal reorder points and quantities
- Identify slow-moving products
- Predict expiry risks

**Usage:**
```typescript
import { getGeminiServices } from '@/services/gemini';

const { forecasting } = getGeminiServices();
const forecast = await forecasting.forecastDemand('product-id', 30);
console.log(forecast.reorderPoint, forecast.reorderQuantity);
```

### 3. PricingService (pricing.ts)
Pricing optimization and bundle recommendations.

**Features:**
- Optimize product pricing based on elasticity
- Calculate price elasticity of demand
- Suggest product bundles
- Dynamic clearance pricing for slow-moving items
- Cross-sell recommendations

**Usage:**
```typescript
import { getGeminiServices } from '@/services/gemini';

const { pricing } = getGeminiServices();
const recommendation = await pricing.optimizePricing('product-id');
console.log(recommendation.recommendedPrice);
```

### 4. InsightsService (insights.ts)
Business intelligence and anomaly detection.

**Features:**
- Generate daily morning briefings
- Detect anomalies in business data
- Answer business questions conversationally
- Identify customer behavior patterns
- Analyze product performance
- Predict supply chain risks
- Root cause analysis for negative trends

**Usage:**
```typescript
import { getGeminiServices } from '@/services/gemini';

const { insights } = getGeminiServices();
const briefing = await insights.generateMorningBriefing();
console.log(briefing.highlights, briefing.actionsNeeded);
```

### 5. MedicalAnalysisService (medical.ts)
Medical document analysis and healthcare insights.

**Features:**
- Analyze medical reports and extract structured data
- Link medical records to products
- Predict product demand from medical trends
- Generate patient health summaries
- Check medication interactions
- Analyze disease prevalence
- Suggest products for medical conditions
- Generate compliance reports

**Usage:**
```typescript
import { getGeminiServices } from '@/services/gemini';

const { medical } = getGeminiServices();
const analysis = await medical.analyzeMedicalReport(reportText);
console.log(analysis.diagnosis, analysis.medications);
```

### 6. OCRService (ocr.ts)
Document processing and data extraction.

**Features:**
- Process invoices, purchase orders, medical reports
- Extract structured data from images/PDFs
- Automatic document type detection
- Batch document processing
- OCR error correction suggestions
- Data validation

**Usage:**
```typescript
import { getGeminiServices } from '@/services/gemini';

const { ocr } = getGeminiServices();
const processed = await ocr.processDocument(file);
console.log(processed.documentType, processed.extractedData);
```

## Quick Start

### Initialize All Services
```typescript
import { getGeminiServices } from '@/services/gemini';

const services = getGeminiServices();

// Use any service
await services.forecasting.forecastDemand('product-id', 30);
await services.pricing.optimizePricing('product-id');
await services.insights.generateMorningBriefing();
await services.medical.analyzeMedicalReport(text);
await services.ocr.processDocument(file);
```

### Individual Service Import
```typescript
import { GeminiService, ForecastingService } from '@/services/gemini';

const gemini = new GeminiService({ apiKey: 'your-key' });
const forecasting = new ForecastingService(gemini);
```

## Configuration

Set the Gemini API key in your environment variables:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

## Rate Limiting

All services share the same rate limiter:
- **Limit:** 60 requests per minute
- **Behavior:** Requests are queued when limit is reached
- **Automatic:** No manual intervention needed

## Caching

Responses are cached for 5 minutes by default:
- Reduces API calls
- Improves response time
- Saves costs

To bypass cache:
```typescript
await gemini.generateContent(prompt, false); // useCache = false
```

## Error Handling

All services include automatic error handling:
- Retry with exponential backoff (up to 3 attempts)
- Detailed error logging to SystemLogs
- User-friendly error messages

## API Usage Tracking

Monitor API usage:
```typescript
const stats = await gemini.getUsageStats(30); // Last 30 days
console.log(stats.totalCalls, stats.cacheHits);
```

## Testing

Test Gemini connection:
```typescript
const isConnected = await gemini.testConnection();
```

## Best Practices

1. **Use the singleton:** Always use `getGeminiServices()` to avoid multiple instances
2. **Enable caching:** Keep caching enabled for repeated queries
3. **Handle errors:** Wrap calls in try-catch blocks
4. **Monitor usage:** Check API usage regularly to avoid quota issues
5. **Validate responses:** Always validate AI-generated data before using

## Requirements Mapping

This implementation satisfies the following requirements:
- **3.1-3.11:** Gemini AI integration and capabilities
- **17.1-17.11:** Demand forecasting
- **18.1-18.11:** Pricing optimization
- **19.1-19.11:** Business intelligence
- **20.1-20.11:** Medical insights
- **9.1-9.13:** OCR and document processing

## Architecture

```
services/gemini/
├── client.ts          # Base Gemini client
├── forecasting.ts     # Demand forecasting
├── pricing.ts         # Pricing optimization
├── insights.ts        # Business intelligence
├── medical.ts         # Medical analysis
├── ocr.ts            # Document processing
├── index.ts          # Main exports
└── README.md         # This file
```

## Dependencies

- `@google/generative-ai`: Google's Gemini API client
- `dexie`: Database access
- `uuid`: ID generation

## Support

For issues or questions about the Gemini services, refer to:
- Design document: `.kiro/specs/medical-archive-system/design.md`
- Requirements: `.kiro/specs/medical-archive-system/requirements.md`
- Tasks: `.kiro/specs/medical-archive-system/tasks.md`
