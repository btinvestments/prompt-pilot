import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { generateCompletion } from '@/lib/openrouter/client';
import { incrementUserUsage, savePrompt } from '@/lib/supabase/client';
import { z } from 'zod';

// Input validation schema
const invokeModelSchema = z.object({
  model: z.string().min(1, 'Model ID is required'),
  prompt: z.string().min(5, 'Prompt must be at least 5 characters long'),
  max_tokens: z.number().int().positive().default(1024),
  temperature: z.number().min(0).max(2).default(0.7),
  top_p: z.number().min(0).max(1).default(1),
  stream: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = invokeModelSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { model, prompt, max_tokens, temperature, top_p, stream } = validationResult.data;

    // Call OpenRouter API to generate completion
    const completion = await generateCompletion({
      model,
      prompt,
      max_tokens,
      temperature,
      top_p,
      stream,
    });

    // Determine prompt category based on content analysis
    let category = 'chat';
    if (prompt.toLowerCase().includes('code') || 
        prompt.toLowerCase().includes('program') || 
        prompt.toLowerCase().includes('function')) {
      category = 'code';
    } else if (prompt.toLowerCase().includes('explain') || 
               prompt.toLowerCase().includes('analyze') || 
               prompt.toLowerCase().includes('compare')) {
      category = 'reasoning';
    } else if (prompt.toLowerCase().includes('write') || 
               prompt.toLowerCase().includes('draft') || 
               prompt.toLowerCase().includes('create')) {
      category = 'writing';
    } else if (prompt.toLowerCase().includes('image') || 
               prompt.toLowerCase().includes('picture') || 
               prompt.toLowerCase().includes('visual')) {
      category = 'multimodal';
    }

    // Log the interaction to the database
    await savePrompt({
      user_id: userId,
      original_text: prompt,
      improved_text: '', // No improvement in this case
      category,
      model_used: model,
      tokens: completion.usage.total_tokens,
      quality_score: 0, // Will be updated if user rates the response
    });

    // Increment user's usage count
    await incrementUserUsage(userId);

    // Return the model response
    return NextResponse.json({
      response: completion.choices[0].message.content,
      model: completion.model,
      tokens: completion.usage.total_tokens,
      finish_reason: completion.choices[0].finish_reason,
    });
  } catch (error) {
    console.error('Error invoking AI model:', error);
    return NextResponse.json(
      { error: 'Failed to invoke AI model' },
      { status: 500 }
    );
  }
}
