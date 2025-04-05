import axios from 'axios';
import { AxiosResponse } from 'axios';

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

// Create a function to get a configured axios instance for OpenAI API
// This ensures we get the latest API key from environment variables for each request
const getOpenAIClient = () => {
  return axios.create({
    baseURL: OPENAI_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });
};

// Generate completion using OpenAI
export async function generateCompletion(
  request: OpenAICompletionRequest
): Promise<OpenAICompletionResponse> {
  try {
    // Check if we have an API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required but not found in environment variables');
    }
    
    console.log('OpenAI API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    console.log('Request model:', request.model);
    console.log('Request messages:', JSON.stringify(request.messages, null, 2));
    
    const client = getOpenAIClient();
    
    // Log the request configuration
    const requestConfig = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens || 1024,
      temperature: request.temperature || 0.7,
      top_p: request.top_p || 1,
      stream: request.stream || false,
    };
    
    console.log('OpenAI request config:', JSON.stringify(requestConfig, null, 2));
    
    const response = await client.post('/chat/completions', requestConfig);
    
    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response headers:', JSON.stringify(response.headers, null, 2));
    console.log('OpenAI response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error generating completion with OpenAI:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('OpenAI API error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
    }
    
    throw error;
  }
}
