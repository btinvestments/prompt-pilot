# PromptPilot

PromptPilot is an AI prompt engineering tool that helps users create, improve, and optimize prompts for various AI models. It provides model recommendations based on the prompt's purpose and offers a seamless interface for interacting with different AI models via OpenRouter.

The application uses OpenAI's ChatGPT (via OpenRouter) to generate high-quality prompts based on user goals and to improve existing prompts with AI-powered suggestions.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Features

- **AI-powered Prompt Generation**: Create effective prompts using OpenAI's ChatGPT
- **Prompt Improvement**: Enhance existing prompts with AI-powered suggestions
- **Model Recommendations**: Get AI model recommendations based on your prompt type
- **Model Catalog**: Browse available AI models from OpenRouter
- **Prompt History**: Track and reuse your previous prompts
- **Results Page**: View AI-generated responses after sending prompts to models
- **User Authentication**: Secure user authentication with Clerk
- **Persistent Storage**: Save all prompts and interactions with Supabase
- **Modern UI**: Beautiful interface with Tailwind CSS and shadcn/ui components

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Authentication - Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Database - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter API
OPENROUTER_API_KEY=sk_...
NEXT_PUBLIC_OPENROUTER_SITE_URL=http://localhost:3000 # Change to your production URL in production
```

## Database Schema

### Users Table
```sql
create table users (
  id text primary key,
  email text not null,
  usage_count integer default 0,
  plan text default 'free',
  created_at timestamp with time zone default now()
);
```

### Prompts Table
```sql
create table prompts (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(id),
  original_text text not null,
  improved_text text,
  response_text text,
  category text,
  model_used text,
  tokens integer,
  quality_score integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Usage Guide

### Generating a New Prompt

1. Navigate to the "Create New Prompt" page
2. Select the "Generate New" tab
3. Enter your goal in the "Your Goal" field
4. Add any additional context if needed
5. Click "Generate Prompt"
6. Review the generated prompt
7. Choose one of the recommended models to send your prompt to
8. View the AI response on the results page

### Improving an Existing Prompt

1. Navigate to the "Create New Prompt" page
2. Select the "Improve Existing" tab
3. Paste your existing prompt in the "Your Prompt" field
4. Add any improvement feedback if needed
5. Click "Improve Prompt"
6. Review the improved prompt
7. Choose one of the recommended models to send your prompt to
8. View the AI response on the results page

### Browsing AI Models

1. Navigate to the "Models" page
2. Browse the available AI models from OpenRouter
3. Filter models by category if needed
4. Click on a model to view more details

### Viewing Prompt History

1. Navigate to the "History" page
2. View your previously generated and improved prompts
3. Click on a prompt to view its details
4. Reuse or further improve existing prompts

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
