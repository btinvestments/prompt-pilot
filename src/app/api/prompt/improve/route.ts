import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { generateCompletion } from '@/lib/openai/client';
import { incrementUserUsage, savePrompt } from '@/lib/supabase/client';
import { z } from 'zod';

// Input validation schema
const improvePromptSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters long'),
  feedback: z.string().optional(),
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
    const validationResult = improvePromptSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { prompt, feedback } = validationResult.data;

    // Create a structured message array for the OpenAI API
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert prompt engineer. Your task is to improve prompts to make them more effective. Your response should ONLY include the improved prompt text, with no additional explanations or commentary.'
      },
      {
        role: 'user' as const,
        content: `I need help improving the following prompt to make it more effective:

Original prompt:
"${prompt}"

${feedback ? `User feedback on what to improve: ${feedback}\n\n` : ''}
Please analyze the prompt and improve it by:
1. Making it more specific and clear
2. Adding necessary context or constraints
3. Improving the structure and flow
4. Adjusting the tone and style for the intended purpose
5. Adding examples or clarifications if needed

Provide only the improved prompt without explanations or commentary.`
      }
    ];

    // Call OpenAI API to improve the prompt
    const completion = await generateCompletion({
      model: 'gpt-4o',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract the improved prompt
    const improvedPrompt = completion.choices[0].message.content.trim();

    // Determine prompt category based on content analysis
    let category = 'chat';
    if (improvedPrompt.toLowerCase().includes('code') || 
        improvedPrompt.toLowerCase().includes('program') || 
        improvedPrompt.toLowerCase().includes('function')) {
      category = 'code';
    } else if (improvedPrompt.toLowerCase().includes('explain') || 
               improvedPrompt.toLowerCase().includes('analyze') || 
               improvedPrompt.toLowerCase().includes('compare')) {
      category = 'reasoning';
    } else if (improvedPrompt.toLowerCase().includes('write') || 
               improvedPrompt.toLowerCase().includes('draft') || 
               improvedPrompt.toLowerCase().includes('create')) {
      category = 'writing';
    } else if (improvedPrompt.toLowerCase().includes('image') || 
               improvedPrompt.toLowerCase().includes('picture') || 
               improvedPrompt.toLowerCase().includes('visual')) {
      category = 'multimodal';
    }

    // Log the interaction to the database
    await savePrompt({
      user_id: userId,
      original_text: prompt,
      improved_text: improvedPrompt,
      category,
      model_used: 'gpt-4o',
      tokens: completion.usage.total_tokens,
      quality_score: 0, // Will be updated if user rates the prompt
    });

    // Increment user's usage count
    await incrementUserUsage(userId);

    // Return the improved prompt
    return NextResponse.json({
      original: prompt,
      improved: improvedPrompt,
      category,
      tokens: completion.usage.total_tokens,
    });
  } catch (error) {
    console.error('Error improving prompt:', error);
    return NextResponse.json(
      { error: 'Failed to improve prompt' },
      { status: 500 }
    );
  }
}
