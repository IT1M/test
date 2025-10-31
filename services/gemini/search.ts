// AI-Powered Search Service
// Natural language search across all entities with confidence scoring

import { GeminiService } from './client';
import { db } from '@/lib/db/schema';
import type {
  Product,
  Customer,
  Order,
  Patient,
  MedicalRecord,
} from '@/types/database';

/**
 * Search result with confidence score
 */
export interface SearchResult {
  entityType: 'product' | 'customer' | 'order' | 'patient' | 'medical-record';
  entity: Product | Customer | Order | Patient | MedicalRecord;
  confidence: number;
  matchReason: string;
}

/**
 * Grouped search results
 */
export interface GroupedSearchResults {
  products: SearchResult[];
  customers: SearchResult[];
  orders: SearchResult[];
  patients: SearchResult[];
  medicalRecords: SearchResult[];
  totalResults: number;
}

/**
 * Similar case suggestion
 */
export interface SimilarCase {
  entityType: string;
  entityId: string;
  entityName: string;
  similarity: number;
  reason: string;
}

/**
 * Search filters
 */
export interface SearchFilters {
  entityType?: 'all' | 'products' | 'customers' | 'orders' | 'patients';
  dateRange?: { from: Date; to: Date };
  priceRange?: { min: number; max: number };
  status?: string;
  category?: string;
}

/**
 * Search Service Class
 * Provides AI-powered natural language search
 */
export class SearchService {
  constructor(private gemini: GeminiService) {}

  /**
   * Perform AI-powered search across all entities
   */
  async search(
    query: string,
    filters: SearchFilters = {}
  ): Promise<GroupedSearchResults> {
    // First, use AI to understand the query intent
    const searchIntent = await this.analyzeSearchIntent(query, filters);

    // Perform searches based on intent
    const [products, customers, orders, patients, medicalRecords] = await Promise.all([
      this.shouldSearchEntity('products', filters.entityType)
        ? this.searchProducts(query, searchIntent, filters)
        : Promise.resolve([]),
      this.shouldSearchEntity('customers', filters.entityType)
        ? this.searchCustomers(query, searchIntent, filters)
        : Promise.resolve([]),
      this.shouldSearchEntity('orders', filters.entityType)
        ? this.searchOrders(query, searchIntent, filters)
        : Promise.resolve([]),
      this.shouldSearchEntity('patients', filters.entityType)
        ? this.searchPatients(query, searchIntent, filters)
        : Promise.resolve([]),
      this.shouldSearchEntity('patients', filters.entityType)
        ? this.searchMedicalRecords(query, searchIntent, filters)
        : Promise.resolve([]),
    ]);

    // Calculate confidence scores using AI
    const scoredResults = await this.scoreResults(query, {
      products,
      customers,
      orders,
      patients,
      medicalRecords,
    });

    return {
      ...scoredResults,
      totalResults:
        scoredResults.products.length +
        scoredResults.customers.length +
        scoredResults.orders.length +
        scoredResults.patients.length +
        scoredResults.medicalRecords.length,
    };
  }

  /**
   * Analyze search intent using AI
   */
  private async analyzeSearchIntent(
    query: string,
    filters: SearchFilters
  ): Promise<{
    keywords: string[];
    entityTypes: string[];
    timeframe?: string;
    conditions: string[];
  }> {
    const prompt = `
Analyze this search query and extract search intent:

Query: "${query}"
Filters: ${JSON.stringify(filters)}

Extract:
1. Keywords (important terms to search for)
2. Entity types mentioned (products, customers, orders, patients)
3. Timeframe if mentioned (e.g., "last month", "this week")
4. Conditions or filters (e.g., "low stock", "overdue", "active")

Return JSON format:
{
  "keywords": ["keyword1", "keyword2"],
  "entityTypes": ["products", "customers"],
  "timeframe": "last 30 days",
  "conditions": ["low stock", "active"]
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const intent = await this.gemini.generateJSON<{
        keywords: string[];
        entityTypes: string[];
        timeframe?: string;
        conditions: string[];
      }>(prompt);

      return intent;
    } catch (error) {
      // Fallback to basic keyword extraction
      return {
        keywords: query.toLowerCase().split(' ').filter(w => w.length > 2),
        entityTypes: [],
        conditions: [],
      };
    }
  }

  /**
   * Search products
   */
  private async searchProducts(
    query: string,
    intent: any,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    let productsQuery = db.products.where('isActive').equals(1);

    // Apply filters
    if (filters.category) {
      productsQuery = productsQuery.and(p => p.category === filters.category);
    }

    if (filters.priceRange) {
      productsQuery = productsQuery.and(
        p =>
          p.unitPrice >= (filters.priceRange?.min || 0) &&
          p.unitPrice <= (filters.priceRange?.max || Infinity)
      );
    }

    const products = await productsQuery.toArray();

    // Filter by keywords
    const keywords = intent.keywords.map((k: string) => k.toLowerCase());
    const matchedProducts = products.filter(product => {
      const searchText = `${product.name} ${product.sku} ${product.category} ${product.manufacturer} ${product.description}`.toLowerCase();
      return keywords.some((keyword: string) => searchText.includes(keyword));
    });

    return matchedProducts.map(product => ({
      entityType: 'product' as const,
      entity: product,
      confidence: 0.8, // Will be scored by AI later
      matchReason: 'Matched product name or description',
    }));
  }

  /**
   * Search customers
   */
  private async searchCustomers(
    query: string,
    intent: any,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    let customersQuery = db.customers.where('isActive').equals(1);

    const customers = await customersQuery.toArray();

    // Filter by keywords
    const keywords = intent.keywords.map((k: string) => k.toLowerCase());
    const matchedCustomers = customers.filter(customer => {
      const searchText = `${customer.name} ${customer.customerId} ${customer.email} ${customer.phone} ${customer.city} ${customer.type}`.toLowerCase();
      return keywords.some((keyword: string) => searchText.includes(keyword));
    });

    return matchedCustomers.map(customer => ({
      entityType: 'customer' as const,
      entity: customer,
      confidence: 0.8,
      matchReason: 'Matched customer name or contact info',
    }));
  }

  /**
   * Search orders
   */
  private async searchOrders(
    query: string,
    intent: any,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    let ordersQuery = db.orders.toCollection();

    // Apply date range filter
    if (filters.dateRange) {
      ordersQuery = ordersQuery.and(
        o =>
          o.orderDate >= filters.dateRange!.from &&
          o.orderDate <= filters.dateRange!.to
      );
    }

    // Apply status filter
    if (filters.status) {
      ordersQuery = ordersQuery.and(o => o.status === filters.status);
    }

    const orders = await ordersQuery.toArray();

    // Filter by keywords
    const keywords = intent.keywords.map((k: string) => k.toLowerCase());
    const matchedOrders = orders.filter(order => {
      const searchText = `${order.orderId} ${order.status} ${order.salesPerson}`.toLowerCase();
      return keywords.some((keyword: string) => searchText.includes(keyword));
    });

    return matchedOrders.map(order => ({
      entityType: 'order' as const,
      entity: order,
      confidence: 0.8,
      matchReason: 'Matched order ID or status',
    }));
  }

  /**
   * Search patients
   */
  private async searchPatients(
    query: string,
    intent: any,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    const patients = await db.patients.toArray();

    // Filter by keywords
    const keywords = intent.keywords.map((k: string) => k.toLowerCase());
    const matchedPatients = patients.filter(patient => {
      const searchText = `${patient.firstName} ${patient.lastName} ${patient.nationalId} ${patient.phone} ${patient.email}`.toLowerCase();
      return keywords.some((keyword: string) => searchText.includes(keyword));
    });

    return matchedPatients.map(patient => ({
      entityType: 'patient' as const,
      entity: patient,
      confidence: 0.8,
      matchReason: 'Matched patient name or ID',
    }));
  }

  /**
   * Search medical records
   */
  private async searchMedicalRecords(
    query: string,
    intent: any,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    let recordsQuery = db.medicalRecords.toCollection();

    // Apply date range filter
    if (filters.dateRange) {
      recordsQuery = recordsQuery.and(
        r =>
          r.visitDate >= filters.dateRange!.from &&
          r.visitDate <= filters.dateRange!.to
      );
    }

    const records = await recordsQuery.toArray();

    // Filter by keywords
    const keywords = intent.keywords.map((k: string) => k.toLowerCase());
    const matchedRecords = records.filter(record => {
      const searchText = `${record.title} ${record.content} ${record.diagnosis} ${record.recordType}`.toLowerCase();
      return keywords.some((keyword: string) => searchText.includes(keyword));
    });

    return matchedRecords.map(record => ({
      entityType: 'medical-record' as const,
      entity: record,
      confidence: 0.8,
      matchReason: 'Matched medical record content',
    }));
  }

  /**
   * Score results using AI for better confidence
   */
  private async scoreResults(
    query: string,
    results: Omit<GroupedSearchResults, 'totalResults'>
  ): Promise<Omit<GroupedSearchResults, 'totalResults'>> {
    // For performance, only score if we have results
    const hasResults =
      results.products.length > 0 ||
      results.customers.length > 0 ||
      results.orders.length > 0 ||
      results.patients.length > 0 ||
      results.medicalRecords.length > 0;

    if (!hasResults) {
      return results;
    }

    // Create a summary of results for AI scoring
    const resultsSummary = {
      query,
      products: results.products.slice(0, 10).map(r => ({
        name: (r.entity as Product).name,
        sku: (r.entity as Product).sku,
        category: (r.entity as Product).category,
      })),
      customers: results.customers.slice(0, 10).map(r => ({
        name: (r.entity as Customer).name,
        type: (r.entity as Customer).type,
      })),
      orders: results.orders.slice(0, 10).map(r => ({
        orderId: (r.entity as Order).orderId,
        status: (r.entity as Order).status,
      })),
      patients: results.patients.slice(0, 10).map(r => ({
        name: `${(r.entity as Patient).firstName} ${(r.entity as Patient).lastName}`,
      })),
    };

    const prompt = `
Score the relevance of these search results for the query: "${query}"

Results:
${JSON.stringify(resultsSummary, null, 2)}

For each result, provide a confidence score (0-1) based on how well it matches the query.
Consider:
- Exact matches vs partial matches
- Relevance of the entity type to the query
- Context and intent of the search

Return JSON format with confidence scores:
{
  "products": [0.95, 0.87, 0.75, ...],
  "customers": [0.92, 0.81, ...],
  "orders": [0.88, ...],
  "patients": [0.90, ...]
}

Return ONLY the JSON object, no additional text.
`;

    try {
      const scores = await this.gemini.generateJSON<{
        products: number[];
        customers: number[];
        orders: number[];
        patients: number[];
      }>(prompt);

      // Apply scores to results
      results.products.forEach((result, index) => {
        if (scores.products && scores.products[index] !== undefined) {
          result.confidence = scores.products[index];
        }
      });

      results.customers.forEach((result, index) => {
        if (scores.customers && scores.customers[index] !== undefined) {
          result.confidence = scores.customers[index];
        }
      });

      results.orders.forEach((result, index) => {
        if (scores.orders && scores.orders[index] !== undefined) {
          result.confidence = scores.orders[index];
        }
      });

      results.patients.forEach((result, index) => {
        if (scores.patients && scores.patients[index] !== undefined) {
          result.confidence = scores.patients[index];
        }
      });
    } catch (error) {
      // If AI scoring fails, keep default scores
      console.error('Failed to score results with AI:', error);
    }

    // Sort results by confidence
    results.products.sort((a, b) => b.confidence - a.confidence);
    results.customers.sort((a, b) => b.confidence - a.confidence);
    results.orders.sort((a, b) => b.confidence - a.confidence);
    results.patients.sort((a, b) => b.confidence - a.confidence);
    results.medicalRecords.sort((a, b) => b.confidence - a.confidence);

    return results;
  }

  /**
   * Find similar cases using AI
   */
  async findSimilarCases(
    entityType: string,
    entityId: string
  ): Promise<SimilarCase[]> {
    // Get the entity
    let entity: any;
    switch (entityType) {
      case 'product':
        entity = await db.products.get(entityId);
        break;
      case 'customer':
        entity = await db.customers.get(entityId);
        break;
      case 'order':
        entity = await db.orders.get(entityId);
        break;
      case 'patient':
        entity = await db.patients.get(entityId);
        break;
      default:
        return [];
    }

    if (!entity) return [];

    // Get all entities of the same type
    let allEntities: any[] = [];
    switch (entityType) {
      case 'product':
        allEntities = await db.products.limit(100).toArray();
        break;
      case 'customer':
        allEntities = await db.customers.limit(100).toArray();
        break;
      case 'order':
        allEntities = await db.orders.limit(100).toArray();
        break;
      case 'patient':
        allEntities = await db.patients.limit(100).toArray();
        break;
    }

    // Use AI to find similar cases
    const prompt = `
Find similar cases to this ${entityType}:

Target Entity:
${JSON.stringify(entity, null, 2)}

All Entities:
${JSON.stringify(allEntities.slice(0, 50), null, 2)}

Identify the top 5 most similar entities based on:
- Shared characteristics
- Similar patterns
- Related attributes

Return JSON array:
[
  {
    "entityId": "id",
    "entityName": "name",
    "similarity": number (0-1),
    "reason": "why it's similar"
  }
]

Return ONLY the JSON array, no additional text.
`;

    try {
      const similarCases = await this.gemini.generateJSON<SimilarCase[]>(prompt);
      return similarCases.map(c => ({ ...c, entityType }));
    } catch (error) {
      console.error('Failed to find similar cases:', error);
      return [];
    }
  }

  /**
   * Helper to determine if entity type should be searched
   */
  private shouldSearchEntity(
    entityType: string,
    filter?: 'all' | 'products' | 'customers' | 'orders' | 'patients'
  ): boolean {
    if (!filter || filter === 'all') return true;
    return filter === entityType;
  }
}
