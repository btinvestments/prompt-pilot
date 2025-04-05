import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

// Input validation schema
const resendConfirmationSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const auth = getAuth(req);
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = resendConfirmationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    
    // Resend confirmation email using Supabase
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('Error resending confirmation email:', error);
      return NextResponse.json(
        { 
          error: 'Failed to resend confirmation email', 
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
    });
  } catch (error) {
    console.error('Error in resend confirmation endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to resend confirmation email', 
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
