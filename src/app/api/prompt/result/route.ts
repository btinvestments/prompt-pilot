import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get prompt ID from query params
    const url = new URL(req.url);
    const promptId = url.searchParams.get('id');
    
    if (!promptId) {
      return NextResponse.json(
        { error: 'Missing prompt ID' },
        { status: 400 }
      );
    }

    // Fetch the prompt from the database
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Return the prompt data
    return NextResponse.json({
      prompt: data.original_text,
      response: data.response_text || '', // Add this field to your database schema if needed
      model: data.model_used,
      tokens: data.tokens,
      category: data.category,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Error fetching prompt result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt result' },
      { status: 500 }
    );
  }
}
