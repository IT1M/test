// Conversational AI Chatbot Service
// Provides natural language interface for business queries and task execution

import { getGeminiService } from './client';
import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    actions?: ChatAction[];
    data?: any;
  };
}

/**
 * Chat action interface for executable tasks
 */
export interface ChatAction {
  type: 'navigate' | 'create' | 'update' | 'search' | 'export' | 'analyze';
  entity?: string;
  params?: any;
  label: string;
}

/**
 * Chat session interface
 */
export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: ChatContext;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Context for maintaining conversation state
 */
interface ChatContext {
  currentEntity?: string;
  currentEntityId?: string;
  recentQueries: string[];
  userPreferences?: any;
}

/**
 * Conversational AI Chatbot Service
 */
export class ChatbotService {
  private gemini = getGeminiService();
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * Create a new chat session
   */
  createSession(userId: string): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      userId,
      messages: [],
      context: {
        recentQueries: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get existing session or create new one
   */
  getOrCreateSession(sessionId: string | null, userId: string): ChatSession {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    return this.createSession(userId);
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    sessionId: string,
    userMessage: string,
    userId: string
  ): Promise<ChatMessage> {
    const session = this.getOrCreateSession(sessionId, userId);

    // Add user message to session
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    session.messages.push(userMsg);

    // Build context-aware prompt
    const prompt = await this.buildPrompt(session, userMessage);

    try {
      // Get AI response
      const response = await this.gemini.generateJSON<{
        response: string;
        confidence: number;
        actions?: ChatAction[];
        data?: any;
        sources?: string[];
      }>(prompt, false);

      // Create assistant message
      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          actions: response.actions,
          data: response.data,
          sources: response.sources,
        },
      };

      session.messages.push(assistantMsg);
      session.context.recentQueries.push(userMessage);
      session.updatedAt = new Date();

      // Keep only last 10 queries in context
      if (session.context.recentQueries.length > 10) {
        session.context.recentQueries.shift();
      }

      // Log interaction
      await this.logInteraction(session.id, userMessage, assistantMsg);

      return assistantMsg;
    } catch (error) {
      // Return error message
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date(),
        metadata: {
          confidence: 0,
        },
      };
      session.messages.push(errorMsg);
      throw error;
    }
  }

  /**
   * Build context-aware prompt for AI
   */
  private async buildPrompt(session: ChatSession, userMessage: string): Promise<string> {
    // Get business context
    const businessContext = await this.getBusinessContext();

    // Get conversation history (last 5 messages)
    const conversationHistory = session.messages
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `You are an AI assistant for a Medical Products Company Management System. You help users with business queries, data insights, and task execution.

BUSINESS CONTEXT:
${JSON.stringify(businessContext, null, 2)}

CONVERSATION HISTORY:
${conversationHistory}

CURRENT CONTEXT:
${session.context.currentEntity ? `Currently viewing: ${session.context.currentEntity} (ID: ${session.context.currentEntityId})` : 'No specific context'}

USER QUESTION:
${userMessage}

INSTRUCTIONS:
1. Analyze the user's question in the context of the business data
2. Provide a helpful, accurate response
3. If the question requires data, query the business context and provide specific numbers
4. If the user wants to perform an action, suggest executable actions
5. Be conversational and friendly
6. If you're not confident about something, say so

RESPONSE FORMAT (JSON):
{
  "response": "Your natural language response here",
  "confidence": 0.95,
  "actions": [
    {
      "type": "navigate|create|update|search|export|analyze",
      "entity": "products|customers|orders|etc",
      "params": {},
      "label": "Action button label"
    }
  ],
  "data": {
    // Any structured data to display (charts, tables, etc.)
  },
  "sources": ["Source of information used"]
}

Respond ONLY with valid JSON.`;

    return prompt;
  }

  /**
   * Get current business context for AI
   */
  private async getBusinessContext(): Promise<any> {
    try {
      const [
        productsCount,
        customersCount,
        ordersCount,
        lowStockProducts,
        recentOrders,
        topProducts,
      ] = await Promise.all([
        db.products.count(),
        db.customers.count(),
        db.orders.count(),
        db.products.where('stockQuantity').below(10).count(),
        db.orders.orderBy('orderDate').reverse().limit(5).toArray(),
        db.sales.orderBy('totalAmount').reverse().limit(5).toArray(),
      ]);

      return {
        summary: {
          totalProducts: productsCount,
          totalCustomers: customersCount,
          totalOrders: ordersCount,
          lowStockAlerts: lowStockProducts,
        },
        recentOrders: recentOrders.map(o => ({
          id: o.orderId,
          customer: o.customerId,
          amount: o.totalAmount,
          status: o.status,
          date: o.orderDate,
        })),
        topProducts: topProducts.map(s => ({
          saleId: s.saleId,
          amount: s.totalAmount,
          profit: s.profit,
        })),
      };
    } catch (error) {
      console.error('Error getting business context:', error);
      return {
        summary: {
          totalProducts: 0,
          totalCustomers: 0,
          totalOrders: 0,
          lowStockAlerts: 0,
        },
      };
    }
  }

  /**
   * Execute a chat action
   */
  async executeAction(action: ChatAction, userId: string): Promise<any> {
    switch (action.type) {
      case 'search':
        return this.executeSearch(action.params);
      
      case 'analyze':
        return this.executeAnalysis(action.params);
      
      case 'export':
        return this.executeExport(action.params);
      
      case 'create':
        // Return navigation info for create actions
        return {
          navigate: `/${action.entity}/new`,
          params: action.params,
        };
      
      case 'navigate':
        return {
          navigate: action.params.path,
        };
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute search action
   */
  private async executeSearch(params: any): Promise<any> {
    const { entity, query, filters } = params;

    switch (entity) {
      case 'products':
        return db.products
          .filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.toLowerCase().includes(query.toLowerCase())
          )
          .limit(10)
          .toArray();
      
      case 'customers':
        return db.customers
          .filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())
          )
          .limit(10)
          .toArray();
      
      case 'orders':
        return db.orders
          .filter(o => 
            o.orderId.toLowerCase().includes(query.toLowerCase())
          )
          .limit(10)
          .toArray();
      
      default:
        return [];
    }
  }

  /**
   * Execute analysis action
   */
  private async executeAnalysis(params: any): Promise<any> {
    const { type, period } = params;

    switch (type) {
      case 'sales':
        return this.analyzeSales(period);
      
      case 'inventory':
        return this.analyzeInventory();
      
      case 'customers':
        return this.analyzeCustomers();
      
      default:
        return null;
    }
  }

  /**
   * Analyze sales data
   */
  private async analyzeSales(period: string): Promise<any> {
    const sales = await db.sales.toArray();
    
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const averageOrderValue = totalRevenue / sales.length;

    return {
      totalRevenue,
      totalProfit,
      averageOrderValue,
      totalOrders: sales.length,
      profitMargin: (totalProfit / totalRevenue) * 100,
    };
  }

  /**
   * Analyze inventory data
   */
  private async analyzeInventory(): Promise<any> {
    const products = await db.products.toArray();
    const inventory = await db.inventory.toArray();

    const lowStock = products.filter(p => p.stockQuantity < p.reorderLevel);
    const outOfStock = products.filter(p => p.stockQuantity === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.unitPrice * p.stockQuantity), 0);

    return {
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalInventoryValue: totalValue,
      lowStockProducts: lowStock.slice(0, 5).map(p => ({
        name: p.name,
        sku: p.sku,
        quantity: p.stockQuantity,
        reorderLevel: p.reorderLevel,
      })),
    };
  }

  /**
   * Analyze customer data
   */
  private async analyzeCustomers(): Promise<any> {
    const customers = await db.customers.toArray();
    const orders = await db.orders.toArray();

    const activeCustomers = customers.filter(c => c.isActive);
    const vipCustomers = customers.filter(c => c.segment === 'VIP');

    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      vipCustomers: vipCustomers.length,
      totalOrders: orders.length,
      averageOrdersPerCustomer: orders.length / customers.length,
    };
  }

  /**
   * Execute export action
   */
  private async executeExport(params: any): Promise<any> {
    // Return export configuration
    return {
      entity: params.entity,
      format: params.format || 'csv',
      filters: params.filters,
    };
  }

  /**
   * Get chat history for a session
   */
  getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }

  /**
   * Clear chat history
   */
  clearHistory(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
      session.context.recentQueries = [];
      session.updatedAt = new Date();
    }
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Log chat interaction
   */
  private async logInteraction(
    sessionId: string,
    userMessage: string,
    assistantMessage: ChatMessage
  ): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: 'chatbot_interaction',
        entityType: 'chatbot',
        details: JSON.stringify({
          sessionId,
          userMessage: userMessage.substring(0, 200),
          responseLength: assistantMessage.content.length,
          confidence: assistantMessage.metadata?.confidence,
          hasActions: !!assistantMessage.metadata?.actions?.length,
        }),
        userId: 'system',
        timestamp: new Date(),
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log chatbot interaction:', error);
    }
  }

  /**
   * Get chatbot analytics
   */
  async getAnalytics(days: number = 30): Promise<{
    totalInteractions: number;
    averageConfidence: number;
    topQueries: string[];
    actionExecutions: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db.systemLogs
      .where('action')
      .equals('chatbot_interaction')
      .and(log => log.timestamp >= startDate)
      .toArray();

    const totalInteractions = logs.length;
    let totalConfidence = 0;
    let actionExecutions = 0;

    logs.forEach(log => {
      const details = JSON.parse(log.details);
      totalConfidence += details.confidence || 0;
      if (details.hasActions) {
        actionExecutions++;
      }
    });

    return {
      totalInteractions,
      averageConfidence: totalInteractions > 0 ? totalConfidence / totalInteractions : 0,
      topQueries: [], // Would need to implement query frequency tracking
      actionExecutions,
    };
  }
}

// Export singleton instance
let chatbotServiceInstance: ChatbotService | null = null;

export function getChatbotService(): ChatbotService {
  if (!chatbotServiceInstance) {
    chatbotServiceInstance = new ChatbotService();
  }
  return chatbotServiceInstance;
}
