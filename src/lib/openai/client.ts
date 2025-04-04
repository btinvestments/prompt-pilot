import axios from 'axios';

// OpenAI API base URL
const OPENAI_API_URL = 'https://api.openai.com/v1';

// Types for OpenAI API
export type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenAICompletionRequest = {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
};

export type OpenAICompletionResponse = {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// Create an axios instance for OpenAI API
const openaiClient = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

// Generate completion using OpenAI
export async function generateCompletion(
  request: OpenAICompletionRequest
): Promise<OpenAICompletionResponse> {
  try {
    // Check if we have an API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required but not found in environment variables');
    }
    
    const response = await openaiClient.post('/chat/completions', {
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens || 1024,
      temperature: request.temperature || 0.7,
      top_p: request.top_p || 1,
      stream: request.stream || false,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating completion with OpenAI:', error);
    throw error;
  }
}
