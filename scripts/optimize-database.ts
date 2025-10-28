#!/usr/bin/env tsx

/**
 * Database Optimization Script
 * Analyzes and optimizes database performance
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QueryAnalysis {
  query: string;
  executionTime: number;
  rowsAffected: number;
  needsOptimization: boolean;
}

async function analyzeSlowQueries(): Promise<QueryAnalysis[]> {
  console.log('🔍 Analyzing slow queries...\n');
  
  const analyses: QueryAnalysis[] = [];
  
  // Test common queries
  const queries = [
    {
      name: 'Inventory List Query',
      fn: async () => {
        const start = Date.now();
        const result = await prisma.inventoryItem.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
        });
        return { time: Date.now() - start, rows: result.length };
      },
    },
    {
      name: 'Search Query',
      fn: async () => {
        const start = Date.now();
        const result = await prisma.inventoryItem.findMany({
          where: {
            itemName: { contains: 'test', mode: 'insensitive' },
          },
          take: 50,
        });
        return { time: Date.now() - start, rows: result.length };
      },
    },
    {
      name: 'Aggregation Query',
      fn: async () => {
        const start = Date.now();
        const result = await prisma.inventoryItem.groupBy({
          by: ['destination'],
          _count: true,
          _sum: { quantity: true },
        });
        return { time: Date.now() - start, rows: result.length };
      },
    },
    {
      name: 'User List Query',
      fn: async () => {
        const start = Date.now();
        const result = await prisma.user.findMany({
          take: 100,
          include: { accounts: true },
        });
        return { time: Date.now() - start, rows: result.length };
      },
    },
  ];

  for (const query of queries) {
    try {
      const { time, rows } = await query.fn();
      const needsOptimization = time > 100; // More than 100ms
      
      analyses.push({
        query: query.name,
        executionTime: time,
        rowsAffected: rows,
        needsOptimization,
      });

      console.log(`${needsOptimization ? '⚠️ ' : '✅'} ${query.name}`);
      console.log(`   Execution time: ${time}ms`);
      console.log(`   Rows: ${rows}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error analyzing ${query.name}:`, error);
    }
  }

  return analyses;
}

async function checkIndexes() {
  console.log('📊 Checking database indexes...\n');
  
  try {
    // Check if indexes exist (PostgreSQL specific)
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
      ORDER BY
        tablename,
        indexname;
    `;

    console.log(`Found ${indexes.length} indexes:\n`);
    
    const tableIndexes = new Map<string, number>();
    indexes.forEach(idx => {
      const count = tableIndexes.get(idx.tablename) || 0;
      tableIndexes.set(idx.tablename, count + 1);
    });

    tableIndexes.forEach((count, table) => {
      console.log(`  ${table}: ${count} indexes`);
    });
    
    console.log('');
    
    // Recommend missing indexes
    console.log('💡 Recommended indexes:\n');
    console.log('  - inventory_items(destination, category, created_at)');
    console.log('  - inventory_items(batch_number)');
    console.log('  - audit_logs(user_id, timestamp)');
    console.log('  - audit_logs(action, timestamp)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
  }
}

async function analyzeTableSizes() {
  console.log('📦 Analyzing table sizes...\n');
  
  try {
    const tableSizes = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname as schema,
        tablename as table,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM
        pg_tables
      WHERE
        schemaname = 'public'
      ORDER BY
        pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    tableSizes.forEach(table => {
      console.log(`  ${table.table}: ${table.size}`);
    });
    
    console.log('');
  } catch (error) {
    console.error('❌ Error analyzing table sizes:', error);
  }
}

async function vacuumAnalyze() {
  console.log('🧹 Running VACUUM ANALYZE...\n');
  
  try {
    await prisma.$executeRawUnsafe('VACUUM ANALYZE;');
    console.log('✅ VACUUM ANALYZE completed\n');
  } catch (error) {
    console.error('❌ Error running VACUUM ANALYZE:', error);
  }
}

async function checkConnectionPool() {
  console.log('🔌 Checking connection pool...\n');
  
  try {
    const connections = await prisma.$queryRaw<any[]>`
      SELECT
        count(*) as total,
        state,
        wait_event_type
      FROM
        pg_stat_activity
      WHERE
        datname = current_database()
      GROUP BY
        state,
        wait_event_type;
    `;

    console.log('Active connections:');
    connections.forEach(conn => {
      console.log(`  State: ${conn.state}, Wait: ${conn.wait_event_type || 'none'}, Count: ${conn.total}`);
    });
    
    console.log('');
  } catch (error) {
    console.error('❌ Error checking connections:', error);
  }
}

async function generateOptimizationReport(analyses: QueryAnalysis[]) {
  console.log('📋 Optimization Report\n');
  console.log('='.repeat(50));
  console.log('');
  
  const slowQueries = analyses.filter(a => a.needsOptimization);
  
  if (slowQueries.length === 0) {
    console.log('✅ All queries are performing well!');
  } else {
    console.log(`⚠️  Found ${slowQueries.length} slow queries:\n`);
    slowQueries.forEach(query => {
      console.log(`  - ${query.query}: ${query.executionTime}ms`);
    });
    console.log('');
    console.log('Recommendations:');
    console.log('  1. Add appropriate indexes');
    console.log('  2. Optimize query structure');
    console.log('  3. Consider caching frequently accessed data');
    console.log('  4. Use pagination for large result sets');
  }
  
  console.log('');
  console.log('='.repeat(50));
}

async function main() {
  console.log('🚀 Database Optimization Tool\n');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Run analyses
    const analyses = await analyzeSlowQueries();
    await checkIndexes();
    await analyzeTableSizes();
    await checkConnectionPool();
    await vacuumAnalyze();
    
    // Generate report
    await generateOptimizationReport(analyses);
    
    console.log('\n✅ Optimization analysis complete!');
  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
