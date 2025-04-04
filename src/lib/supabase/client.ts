import { createClient } from '@supabase/supabase-js';

// Define the database schema types
export type User = {
  id: string;
  email: string;
  usage_count: number;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
};

export type Prompt = {
  id: string;
  user_id: string;
  original_text: string;
  improved_text: string;
  category: string;
  model_used: string;
  tokens: number;
  quality_score: number;
  created_at: string;
  updated_at: string;
};

// Create a Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Service role client for admin operations (server-side only)
export const supabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Helper functions for database operations
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as User;
}

export async function incrementUserUsage(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ usage_count: supabase.rpc('increment_usage') })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

export async function savePrompt(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('prompts')
    .insert([prompt])
    .select();

  if (error) throw error;
  return data[0] as Prompt;
}

export async function getUserPrompts(userId: string) {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Prompt[];
}
