import axios from 'axios';

// OpenRouter API base URL
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

// Types for OpenRouter API
export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  category?: string;
};

export type ModelCategory = 'chat' | 'code' | 'reasoning' | 'writing' | 'multimodal';

export type GeneratePromptRequest = {
  goal: string;
  context?: string;
};

export type ImprovePromptRequest = {
  prompt: string;
  feedback?: string;
};

export type ModelRecommendationRequest = {
  prompt: string;
  category?: ModelCategory;
};

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenRouterCompletionRequest = {
  model: string;
  prompt: string | string[] | Message[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
};

export type OpenRouterCompletionResponse = {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// OpenRouter client
const openRouterClient = axios.create({
  baseURL: OPENROUTER_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_OPENROUTER_SITE_URL || 'http://localhost:3000',
    'X-Title': 'PromptPilot',
  },
});

// Get available models from OpenRouter
export async function getAvailableModels(): Promise<OpenRouterModel[]> {
  try {
    // Check if we have an API key
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is required but not found in environment variables');
    }
    
    const response = await openRouterClient.get('/models');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    throw error;
  }
}



// Generate completion using OpenRouter
export async function generateCompletion(
  request: OpenRouterCompletionRequest
): Promise<OpenRouterCompletionResponse> {
  try {
    // Check if we have an API key
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is required but not found in environment variables');
    }
    
    // Format the prompt as an array of messages if it's a string
    let messages;
    if (typeof request.prompt === 'string') {
      messages = [
        { role: 'user', content: request.prompt }
      ];
    } else if (Array.isArray(request.prompt) && request.prompt.length > 0 && typeof request.prompt[0] === 'string') {
      // If it's an array of strings, convert each to a message
      messages = request.prompt.map(content => ({ role: 'user', content }));
    } else {
      // If it's already in message format, use it directly
      messages = request.prompt as Message[];
    }

    const response = await openRouterClient.post('/chat/completions', {
      model: request.model,
      messages,
      max_tokens: request.max_tokens || 1024,
      temperature: request.temperature || 0.7,
      top_p: request.top_p || 1,
      stream: request.stream || false,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating completion with OpenRouter:', error);
    throw error;
  }
}

// Model recommendation mapping
const MODEL_RECOMMENDATIONS: Record<ModelCategory, string[]> = {
  chat: ['openai/gpt-4o', 'anthropic/claude-3-opus', 'anthropic/claude-3-sonnet'],
  code: ['openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku', 'mistralai/mistral-7b-instruct'],
  reasoning: ['anthropic/claude-3-opus', 'anthropic/claude-3-sonnet', 'meta-llama/llama-3-70b-instruct'],
  writing: ['anthropic/claude-3-opus', 'openai/gpt-4o', 'meta-llama/llama-3-70b-instruct'],
  multimodal: ['openai/gpt-4o', 'anthropic/claude-3-opus', 'anthropic/claude-3-sonnet'],
};

// Get model recommendation based on prompt category
export function getModelRecommendation(category: ModelCategory): string[] {
  return MODEL_RECOMMENDATIONS[category] || MODEL_RECOMMENDATIONS.chat;
}
