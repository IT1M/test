import { NextRequest, NextResponse } from 'next/server';
import { AIControlConfigManager } from '@/services/ai/ai-control-config';

/**
 * GET /api/ai-control/settings
 * Get current AI Control Center configuration
 */
export async function GET(request: NextRequest) {
  try {
    const config = await AIControlConfigManager.loadConfig();
    
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error fetching AI control settings:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-control/settings
 * Update AI Control Center configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request body',
          message: 'Config object is required'
        },
        { status: 400 }
      );
    }

    // Save configuration
    await AIControlConfigManager.saveConfig(body.config);
    
    // Get updated configuration
    const updatedConfig = AIControlConfigManager.getConfig();
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating AI control settings:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
