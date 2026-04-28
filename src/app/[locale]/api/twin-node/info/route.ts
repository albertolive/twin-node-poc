import { NextResponse } from 'next/server';
import { twinNodeService } from '@/lib/services/twin-node.service';

/**
 * Get node information (public endpoint - no authentication required)
 */
export async function GET() {
  try {
    // This endpoint doesn't require authentication
    const nodeInfo = await twinNodeService.getNodeInfo();

    return NextResponse.json({
      success: true,
      data: nodeInfo,
    });
  } catch (error) {
    console.error('Get node info error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
