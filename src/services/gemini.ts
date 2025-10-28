import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
export interface GeminiResponse {
  text: string;
  cached: boolean;
  timestamp: Date;
}

export interface InventoryAnalysis {
  trends: {
    finding: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  alerts: {
    message: string;
    type: 'warning' | 'critical';
  }[];
  recommendations: string[];
}

export interface InventoryInsights {
  findings: string[];
  alerts: string[];
  recommendations: string[];
  predictions: string[];
}

export interface StockPrediction {
  predictions: Array<{
    itemName: string;
    currentQuantity: number;
    predictedNeed: number;
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
  }>;
  summary: string;
}

// Cache interface
interface CacheEntry {
  response: string;
  timestamp: number;
}

// Rate limiter class
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    // Remove requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    this.requests.push(now);
  }

  reset(): void {
    this.requests = [];
  }
}

// Gemini AI Service class
class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private model: any = null;
  private cache: Map<string, CacheEntry> = new Map();
  private rateLimiter: RateLimiter;
  private readonly cacheDuration: number = 30 * 60 * 1000; // 30 minutes
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1 second

  constructor() {
    this.rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables');
      return;
    }

    try {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });
    } catch (error) {
      console.error('Failed to initialize Gemini AI client:', error);
    }
  }

  private getCacheKey(prompt: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  private setCache(key: string, response: string): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async generateWithRetry(prompt: string, retries: number = 0): Promise<string> {
    try {
      if (!this.model) {
        throw new Error('Gemini AI client not initialized. Please check your API key.');
      }

      await this.rateLimiter.checkLimit();

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      if (retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retries); // Exponential backoff
        console.warn(`Gemini API request failed, retrying in ${delay}ms... (attempt ${retries + 1}/${this.maxRetries})`);
        await this.sleep(delay);
        return this.generateWithRetry(prompt, retries + 1);
      }
      throw error;
    }
  }

  async generate(prompt: string, useCache: boolean = true): Promise<GeminiResponse> {
    try {
      // Check cache first
      if (useCache) {
        const cacheKey = this.getCacheKey(prompt);
        const cachedResponse = this.getFromCache(cacheKey);
        
        if (cachedResponse) {
          return {
            text: cachedResponse,
            cached: true,
            timestamp: new Date(),
          };
        }
      }

      // Generate new response
      const text = await this.generateWithRetry(prompt);

      // Cache the response
      if (useCache) {
        const cacheKey = this.getCacheKey(prompt);
        this.setCache(cacheKey, text);
      }

      return {
        text,
        cached: false,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Gemini AI generation error:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  /**
   * Analyze inventory data for trends and patterns
   */
  async analyzeInventory(inventoryData: any[]): Promise<InventoryAnalysis> {
    try {
      const summary = this.prepareInventorySummary(inventoryData);
      
      const promptText = `You are an inventory management expert. Analyze the following inventory data and provide insights:

${summary}

Please provide:
1. Key trends you observe in the data (identify 3-5 trends with severity levels: low, medium, or high)
2. Any alerts or warnings about potential issues (categorize as warning or critical)
3. Actionable recommendations for inventory management (provide 3-5 specific recommendations)

Format your response as JSON with this structure:
{
  "trends": [{"finding": "description", "severity": "low|medium|high"}],
  "alerts": [{"message": "description", "type": "warning|critical"}],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`;

      const response = await this.generate(promptText, true);
      
      // Parse JSON response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        trends: [{ finding: 'Unable to parse AI response', severity: 'low' }],
        alerts: [],
        recommendations: ['Please try again or contact support'],
      };
    } catch (error: any) {
      console.error('Error analyzing inventory:', error);
      throw new Error(`Failed to analyze inventory: ${error.message}`);
    }
  }

  /**
   * Generate actionable insights from inventory data
   */
  async generateInsights(inventoryData: any[]): Promise<InventoryInsights> {
    try {
      const summary = this.prepareInventorySummary(inventoryData);
      
      const promptText = `As an inventory management consultant, analyze this medical inventory data and provide comprehensive insights:

${summary}

Provide:
1. Key findings about the current inventory state (3-5 findings)
2. Critical alerts that need immediate attention (if any)
3. Strategic recommendations for optimization (3-5 recommendations)
4. Predictions about future inventory needs based on current trends (2-3 predictions)

Format as JSON:
{
  "findings": ["finding1", "finding2", ...],
  "alerts": ["alert1", "alert2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "predictions": ["pred1", "pred2", ...]
}`;

      const response = await this.generate(promptText, true);
      
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        findings: ['Analysis completed but response format was unexpected'],
        alerts: [],
        recommendations: ['Please refresh to try again'],
        predictions: [],
      };
    } catch (error: any) {
      console.error('Error generating insights:', error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  /**
   * Perform predictive analytics for stock forecasting
   */
  async predictStockNeeds(
    inventoryData: any[], 
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<StockPrediction> {
    try {
      const summary = this.prepareInventorySummary(inventoryData);
      
      const promptText = `As a supply chain analyst, predict future stock needs for the next ${timeframe} based on this inventory data:

${summary}

Analyze consumption patterns, reject rates, and trends to predict:
1. Which items will need restocking
2. Estimated quantities needed
3. Confidence level in each prediction (low, medium, high)
4. Reasoning for each prediction
5. Overall summary of stock forecast

Format as JSON:
{
  "predictions": [
    {
      "itemName": "item name",
      "currentQuantity": number,
      "predictedNeed": number,
      "confidence": "low|medium|high",
      "reasoning": "explanation"
    }
  ],
  "summary": "overall forecast summary"
}`;

      const response = await this.generate(promptText, true);
      
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        predictions: [],
        summary: 'Unable to generate predictions at this time',
      };
    } catch (error: any) {
      console.error('Error predicting stock needs:', error);
      throw new Error(`Failed to predict stock needs: ${error.message}`);
    }
  }

  /**
   * Handle natural language queries about inventory
   */
  async handleNaturalLanguageQuery(query: string, inventoryData: any[]): Promise<string> {
    try {
      const summary = this.prepareInventorySummary(inventoryData);
      
      const promptText = `You are an AI assistant for a medical inventory management system. Answer the following question based on the inventory data provided:

Question: ${query}

Inventory Data:
${summary}

Provide a clear, concise answer that directly addresses the question. If the data doesn't contain enough information to answer, say so and suggest what additional information would be helpful.`;

      const response = await this.generate(promptText, true);
      return response.text;
    } catch (error: any) {
      console.error('Error handling natural language query:', error);
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  /**
   * Prepare inventory summary for AI prompts
   */
  private prepareInventorySummary(inventoryData: any[]): string {
    if (!inventoryData || inventoryData.length === 0) {
      return 'No inventory data available.';
    }

    // Calculate statistics
    const totalItems = inventoryData.length;
    const totalQuantity = inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalRejects = inventoryData.reduce((sum, item) => sum + (item.reject || 0), 0);
    const rejectRate = totalQuantity > 0 ? ((totalRejects / totalQuantity) * 100).toFixed(2) : '0';

    // Group by destination
    const byDestination = inventoryData.reduce((acc, item) => {
      const dest = item.destination || 'Unknown';
      acc[dest] = (acc[dest] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by category
    const byCategory = inventoryData.reduce((acc, item) => {
      const cat = item.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find items with high reject rates
    const highRejectItems = inventoryData
      .filter(item => item.quantity > 0 && (item.reject / item.quantity) > 0.15)
      .map(item => ({
        name: item.itemName,
        rejectRate: ((item.reject / item.quantity) * 100).toFixed(2),
      }))
      .slice(0, 5);

    // Recent items (last 10)
    const recentItems = inventoryData
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(item => ({
        name: item.itemName,
        quantity: item.quantity,
        reject: item.reject,
        destination: item.destination,
      }));

    return `
Inventory Summary:
- Total Items: ${totalItems}
- Total Quantity: ${totalQuantity}
- Total Rejects: ${totalRejects}
- Overall Reject Rate: ${rejectRate}%

Distribution by Destination:
${Object.entries(byDestination).map(([dest, count]) => `- ${dest}: ${count} items`).join('\n')}

Distribution by Category:
${Object.entries(byCategory).map(([cat, count]) => `- ${cat}: ${count} items`).join('\n')}

${highRejectItems.length > 0 ? `Items with High Reject Rates (>15%):
${highRejectItems.map(item => `- ${item.name}: ${item.rejectRate}%`).join('\n')}` : 'No items with high reject rates.'}

Recent Inventory Entries:
${recentItems.map(item => `- ${item.name}: ${item.quantity} units (${item.reject} rejects) → ${item.destination}`).join('\n')}
    `.trim();
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  isInitialized(): boolean {
    return this.client !== null && this.model !== null;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
