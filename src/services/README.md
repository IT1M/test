# Services

This directory contains service layer implementations for the Saudi Mais Inventory System.

## Gemini AI Service

The Gemini AI service (`gemini.ts`) provides intelligent analytics and insights for inventory management.

### Features

- **Rate Limiting**: Automatically limits requests to 60 per minute
- **Caching**: Caches responses for 30 minutes to optimize performance
- **Retry Logic**: Implements exponential backoff for failed requests (up to 3 retries)
- **Error Handling**: Comprehensive error handling with meaningful error messages

### Setup

1. Add your Gemini API key to `.env.local`:
```env
GEMINI_API_KEY=your-api-key-here
```

2. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Usage

#### Basic Text Generation

```typescript
import { geminiService } from '@/services/gemini';

const response = await geminiService.generate('Your prompt here');
console.log(response.text);
console.log(response.cached); // true if from cache
```

#### Analyze Inventory

```typescript
import { geminiService } from '@/services/gemini';

const inventoryData = await prisma.inventoryItem.findMany();
const analysis = await geminiService.analyzeInventory(inventoryData);

console.log(analysis.trends);          // Array of trends with severity
console.log(analysis.alerts);          // Array of alerts (warning/critical)
console.log(analysis.recommendations); // Array of recommendations
```

#### Generate Insights

```typescript
import { geminiService } from '@/services/gemini';

const inventoryData = await prisma.inventoryItem.findMany();
const insights = await geminiService.generateInsights(inventoryData);

console.log(insights.findings);        // Key findings
console.log(insights.alerts);          // Critical alerts
console.log(insights.recommendations); // Strategic recommendations
console.log(insights.predictions);     // Future predictions
```

#### Predict Stock Needs

```typescript
import { geminiService } from '@/services/gemini';

const inventoryData = await prisma.inventoryItem.findMany();
const predictions = await geminiService.predictStockNeeds(
  inventoryData,
  'month' // 'week', 'month', or 'quarter'
);

console.log(predictions.predictions); // Array of item predictions
console.log(predictions.summary);     // Overall forecast summary
```

#### Natural Language Queries

```typescript
import { geminiService } from '@/services/gemini';

const inventoryData = await prisma.inventoryItem.findMany();
const answer = await geminiService.handleNaturalLanguageQuery(
  'Which items have the highest reject rates?',
  inventoryData
);

console.log(answer); // Natural language response
```

### API Route Example

```typescript
// app/api/analytics/ai-insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/gemini';
import { prisma } from '@/services/prisma';

export async function POST(request: NextRequest) {
  try {
    // Fetch inventory data
    const inventoryData = await prisma.inventoryItem.findMany({
      take: 1000, // Limit for performance
      orderBy: { createdAt: 'desc' },
    });

    // Generate insights
    const insights = await geminiService.generateInsights(inventoryData);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_ERROR',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
```

### Utility Methods

```typescript
// Check if service is initialized
if (geminiService.isInitialized()) {
  // Service is ready to use
}

// Clear cache manually
geminiService.clearCache();

// Get cache size
const cacheSize = geminiService.getCacheSize();
console.log(`Cache contains ${cacheSize} entries`);
```

### Error Handling

The service throws errors in the following cases:
- API key not configured
- Rate limit exceeded
- Network errors (after 3 retries)
- Invalid responses from Gemini API

Always wrap calls in try-catch blocks:

```typescript
try {
  const insights = await geminiService.generateInsights(data);
  // Handle success
} catch (error) {
  console.error('Failed to generate insights:', error);
  // Handle error
}
```

### Performance Considerations

- Responses are cached for 30 minutes
- Rate limited to 60 requests per minute
- Use `useCache: false` parameter to bypass cache if needed
- Consider limiting inventory data size for faster processing

### Types

All TypeScript types are exported from the service:

```typescript
import type {
  GeminiResponse,
  InventoryAnalysis,
  InventoryInsights,
  StockPrediction,
} from '@/services/gemini';
```

Or import from the types directory:

```typescript
import type {
  GeminiResponse,
  InventoryAnalysis,
  InventoryInsights,
  StockPrediction,
} from '@/types/gemini';
```
