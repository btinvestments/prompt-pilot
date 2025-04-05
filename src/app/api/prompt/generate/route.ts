import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { generateCompletion } from '@/lib/openai/client';
import { savePrompt, incrementUserUsage } from '@/lib/supabase/client';
import { z } from 'zod';
import axios from 'axios';

// Input validation schema
const generatePromptSchema = z.object({
  goal: z.string().min(5, 'Goal must be at least 5 characters long'),
  context: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    console.log('Checking authentication...');
    const auth = getAuth(req);
    const { userId } = auth;
    
    console.log('Auth status:', { 
      userId: userId || 'not authenticated',
      isAuthenticated: !!userId,
      headers: Object.fromEntries([...req.headers.entries()].filter(([key]) => 
        key.toLowerCase().includes('auth') || 
        key.toLowerCase().includes('cookie') || 
        key.toLowerCase().includes('clerk')
      ))
    });
    
    if (!userId) {
      console.error('Authentication failed: No userId found in request');
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'You must be signed in to use this API',
          authDebug: 'No userId found in request'
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = generatePromptSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { goal, context } = validationResult.data;

    // Create a structured message array for the OpenAI API
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an expert prompt engineer. Your task is to create an effective prompt based on the user\'s goal. Your response should ONLY include the prompt text, with no additional explanations or commentary.'
      },
      {
        role: 'user' as const,
        content: `I need help crafting an effective AI prompt for the following goal:

Goal: ${goal}
${context ? `\nAdditional context: ${context}` : ''}

Consider the following when crafting the prompt:
1. Be specific and clear about what you want the AI to do
2. Provide necessary context and constraints
3. Structure the prompt logically
4. Use appropriate tone and style for the intended purpose
5. Include any relevant examples if needed

Please create a well-crafted prompt that will achieve this goal effectively.`
      }
    ];

    // Call OpenAI API to generate the prompt
    const completion = await generateCompletion({
      model: 'gpt-4o',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract the generated prompt
    const generatedPrompt = completion.choices[0].message.content.trim();

    // Determine prompt category based on content analysis
    let category = 'chat';
    if (generatedPrompt.toLowerCase().includes('code') || 
        generatedPrompt.toLowerCase().includes('program') || 
        generatedPrompt.toLowerCase().includes('function')) {
      category = 'code';
    } else if (generatedPrompt.toLowerCase().includes('explain') || 
               generatedPrompt.toLowerCase().includes('analyze') || 
               generatedPrompt.toLowerCase().includes('compare')) {
      category = 'reasoning';
    } else if (generatedPrompt.toLowerCase().includes('write') || 
               generatedPrompt.toLowerCase().includes('draft') || 
               generatedPrompt.toLowerCase().includes('create')) {
      category = 'writing';
    } else if (generatedPrompt.toLowerCase().includes('image') || 
               generatedPrompt.toLowerCase().includes('picture') || 
               generatedPrompt.toLowerCase().includes('visual')) {
      category = 'multimodal';
    }

    // Log the interaction to the database using Supabase
    await savePrompt({
      user_id: userId,
      original_text: goal,
      improved_text: generatedPrompt,
      category,
      model_used: 'gpt-4o',
      tokens: completion.usage.total_tokens,
      quality_score: 0, // Will be updated if user rates the prompt
    });

    // Increment user's usage count
    await incrementUserUsage(userId);

    // Return the generated prompt
    return NextResponse.json({
      prompt: generatedPrompt,
      category,
      tokens: completion.usage.total_tokens,
    });
  } catch (error) {
    console.error('Error generating prompt:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to generate prompt';
    let errorDetails = '';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
      
      // Check for specific error types
      if (errorMessage.includes('API key')) {
        statusCode = 401;
        errorMessage = 'OpenAI API key is invalid or missing';
      } else if (errorMessage.includes('auth') || errorMessage.includes('token') || errorMessage.includes('clerk')) {
        statusCode = 401;
        errorMessage = 'Authentication error: ' + errorMessage;
        console.error('Authentication error details:', error);
      } else if (axios.isAxiosError(error) && error.response) {
        // Handle Axios errors
        errorDetails = JSON.stringify({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        }, null, 2);
        
        if (error.response.status === 401) {
          statusCode = 401;
          errorMessage = 'Authentication failed with OpenAI API';
        } else if (error.response.status === 429) {
          statusCode = 429;
          errorMessage = 'Rate limit exceeded with OpenAI API';
        }
      }
    }
    
    console.error('Detailed error:', { errorMessage, errorDetails, statusCode });
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        status: statusCode
      },
      { status: statusCode }
    );
  }
}
