import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModel } from '../models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      model: modelName, 
      prompt, 
      system, 
      maxTokens = 1000, 
      temperature = 0.7 
    } = body;

    if (!modelName || !prompt) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: model and prompt' 
        },
        { status: 400 }
      );
    }

    const modelConfig = getModel(modelName);
    if (!modelConfig) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Model ${modelName} not found or not supported` 
        },
        { status: 404 }
      );
    }

    // Generate text using the Vercel AI SDK
    const result = await generateText({
      model: modelConfig.model,
      prompt: system ? `${system}\n\n${prompt}` : prompt,
      maxTokens,
      temperature,
    });

    return NextResponse.json({
      success: true,
      data: {
        content: result.text,
        model: modelName,
        provider: modelConfig.provider,
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          totalTokens: result.usage?.totalTokens || 0,
        },
        finishReason: result.finishReason || 'stop',
      }
    });
  } catch (error) {
    console.error('Error generating text:', error);
    
    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'API key missing or invalid',
            details: 'Please check your environment variables for the required API key'
          },
          { status: 401 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Rate limit exceeded',
            details: 'Please wait before making another request'
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Text generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
