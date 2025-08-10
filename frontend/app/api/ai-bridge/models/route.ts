import { NextRequest, NextResponse } from 'next/server';
import { getAvailableModelsResponse } from '../models';

export async function GET(request: NextRequest) {
  try {
    const modelsData = getAvailableModelsResponse();
    
    return NextResponse.json({
      success: true,
      data: modelsData,
      message: `🔥 ${modelsData.total} models available from ${modelsData.providers.length} providers`
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch available models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
