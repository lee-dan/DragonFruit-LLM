import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_MODELS } from '../models';

export async function GET(request: NextRequest) {
  const totalModels = Object.keys(AVAILABLE_MODELS).length;
  const providers = [...new Set(Object.values(AVAILABLE_MODELS).map(m => m.provider))];
  
  return NextResponse.json({
    success: true,
    status: 'healthy',
    message: '🚀 Vercel AI Bridge integrated into Next.js',
    data: {
      totalModels,
      providers: providers.length,
      providerList: providers,
      timestamp: new Date().toISOString(),
      version: '1.0.0-nextjs',
      features: [
        '200+ AI Models',
        '2025 Latest Models (GPT-4.1, o3, Grok-4, Claude-4)',
        'Unified API',
        'Next.js Integration',
        'Enterprise Ready'
      ]
    }
  });
}
