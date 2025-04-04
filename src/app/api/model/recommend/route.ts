import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { generateCompletion, getModelRecommendation } from '@/lib/openrouter/client';
import { incrementUserUsage } from '@/lib/supabase/client';
import { z } from 'zod';

// Input validation schema
const modelRecommendationSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters long'),
  category: z.enum(['chat', 'code', 'reasoning', 'writing', 'multimodal']).optional(),
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
    const validationResult = modelRecommendationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { prompt, category: userSpecifiedCategory } = validationResult.data;

    // If category is specified by the user, use that
    if (userSpecifiedCategory) {
      const recommendedModels = getModelRecommendation(userSpecifiedCategory);
      
      // Increment user's usage count
      await incrementUserUsage(userId);
      
      return NextResponse.json({
        category: userSpecifiedCategory,
        recommendedModels,
        confidence: 1.0, // User-specified category has 100% confidence
      });
    }

    // Otherwise, analyze the prompt to determine the best category
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an AI model classifier. Your task is to analyze prompts and classify them into categories. Respond with ONLY the category name and a confidence score between 0 and 1, separated by a comma. Example: "code,0.85"'
      },
      {
        role: 'user' as const,
        content: `Analyze the following prompt and classify it into one of these categories:
- chat: General conversation, Q&A, or simple interactions
- code: Programming, code generation, debugging, or technical explanations
- reasoning: Complex problem-solving, logical analysis, or deep reasoning
- writing: Content creation, creative writing, or document drafting
- multimodal: Tasks involving images, audio, or other non-text media

Prompt to classify:
"${prompt}"

Respond with ONLY the category name and a confidence score between 0 and 1, separated by a comma.
Example: "code,0.85"`
      }
    ];

    // Call OpenRouter API to classify the prompt
    const completion = await generateCompletion({
      model: 'openai/gpt-3.5-turbo',
      prompt: messages,
      max_tokens: 20,
      temperature: 0.3,
    });

    // Parse the classification result
    const classificationResult = completion.choices[0].message.content.trim();
    const [detectedCategory, confidenceStr] = classificationResult.split(',');
    const confidence = parseFloat(confidenceStr);

    // Validate the detected category
    const validCategories = ['chat', 'code', 'reasoning', 'writing', 'multimodal'];
    const category = validCategories.includes(detectedCategory.toLowerCase()) 
      ? detectedCategory.toLowerCase() 
      : 'chat'; // Default to chat if invalid category

    // Get model recommendations based on the detected category
    const recommendedModels = getModelRecommendation(category as any);

    // Increment user's usage count
    await incrementUserUsage(userId);

    // Return the recommendations
    return NextResponse.json({
      category,
      recommendedModels,
      confidence: isNaN(confidence) ? 0.7 : confidence, // Default to 0.7 if parsing failed
      tokens: completion.usage.total_tokens,
    });
  } catch (error) {
    console.error('Error recommending model:', error);
    return NextResponse.json(
      { error: 'Failed to recommend model' },
      { status: 500 }
    );
  }
}
