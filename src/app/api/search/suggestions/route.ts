import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Use PostgreSQL full-text search for better performance
    const suggestions = await prisma.$queryRaw<Array<{
      id: string;
      value: string;
      label: string;
      type: string;
      description?: string;
      rank: number;
    }>>`
      SELECT DISTINCT
        id,
        item_name as value,
        item_name as label,
        'item' as type,
        CONCAT('Category: ', COALESCE(category, 'Uncategorized'), ' | Batch: ', batch) as description,
        ts_rank(to_tsvector('english', item_name || ' ' || COALESCE(notes, '')), plainto_tsquery('english', ${query})) as rank
      FROM "InventoryItem"
      WHERE to_tsvector('english', item_name || ' ' || COALESCE(notes, '')) @@ plainto_tsquery('english', ${query})
      
      UNION ALL
      
      SELECT DISTINCT
        gen_random_uuid() as id,
        batch as value,
        batch as label,
        'batch' as type,
        CONCAT('Items: ', COUNT(*), ' | Latest: ', MAX(item_name)) as description,
        ts_rank(to_tsvector('english', batch), plainto_tsquery('english', ${query})) as rank
      FROM "InventoryItem"
      WHERE to_tsvector('english', batch) @@ plainto_tsquery('english', ${query})
      GROUP BY batch
      
      UNION ALL
      
      SELECT DISTINCT
        gen_random_uuid() as id,
        category as value,
        category as label,
        'category' as type,
        CONCAT('Items: ', COUNT(*)) as description,
        ts_rank(to_tsvector('english', category), plainto_tsquery('english', ${query})) as rank
      FROM "InventoryItem"
      WHERE category IS NOT NULL 
        AND to_tsvector('english', category) @@ plainto_tsquery('english', ${query})
      GROUP BY category
      
      ORDER BY rank DESC, type
      LIMIT ${limit}
    `;

    // Fallback to LIKE search if full-text search returns no results
    if (suggestions.length === 0) {
      const likeQuery = `%${query}%`;
      
      const fallbackSuggestions = await prisma.$queryRaw<Array<{
        id: string;
        value: string;
        label: string;
        type: string;
        description?: string;
      }>>`
        SELECT DISTINCT
          id,
          item_name as value,
          item_name as label,
          'item' as type,
          CONCAT('Category: ', COALESCE(category, 'Uncategorized'), ' | Batch: ', batch) as description
        FROM "InventoryItem"
        WHERE LOWER(item_name) LIKE LOWER(${likeQuery})
           OR LOWER(COALESCE(notes, '')) LIKE LOWER(${likeQuery})
        
        UNION ALL
        
        SELECT DISTINCT
          gen_random_uuid() as id,
          batch as value,
          batch as label,
          'batch' as type,
          CONCAT('Items: ', COUNT(*)) as description
        FROM "InventoryItem"
        WHERE LOWER(batch) LIKE LOWER(${likeQuery})
        GROUP BY batch
        
        UNION ALL
        
        SELECT DISTINCT
          gen_random_uuid() as id,
          category as value,
          category as label,
          'category' as type,
          CONCAT('Items: ', COUNT(*)) as description
        FROM "InventoryItem"
        WHERE category IS NOT NULL 
          AND LOWER(category) LIKE LOWER(${likeQuery})
        GROUP BY category
        
        ORDER BY type, value
        LIMIT ${limit}
      `;

      return NextResponse.json({
        success: true,
        data: fallbackSuggestions
      });
    }

    return NextResponse.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch search suggestions',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        } 
      },
      { status: 500 }
    );
  }
}