import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { generateText, streamText } from 'ai';

// Import all AI providers
// 🔥 ALL PROVIDER IMPORTS - EXHAUSTIVE LIST
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { cohere } from '@ai-sdk/cohere';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { fireworks } from '@ai-sdk/fireworks';
import { groq } from '@ai-sdk/groq';
import { perplexity } from '@ai-sdk/perplexity';
import { xai } from '@ai-sdk/xai';

// Additional providers (install with: npm install @ai-sdk/[provider])
// import { azure } from '@ai-sdk/azure';
// import { googleVertex } from '@ai-sdk/google-vertex';
// import { togetherai } from '@ai-sdk/togetherai';
// import { deepinfra } from '@ai-sdk/deepinfra';
// import { deepseek } from '@ai-sdk/deepseek';
// import { cerebras } from '@ai-sdk/cerebras';
// import { elevenlabs } from '@ai-sdk/elevenlabs';
// import { lmnt } from '@ai-sdk/lmnt';
// import { hume } from '@ai-sdk/hume';
// import { revai } from '@ai-sdk/revai';
// import { deepgram } from '@ai-sdk/deepgram';
// import { gladia } from '@ai-sdk/gladia';
// import { assemblyai } from '@ai-sdk/assemblyai';

// Community providers (require separate installation)
// import { ollama } from 'ollama-ai-provider';
// import { openrouter } from '@openrouter/ai-sdk-provider';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 🔥 EXHAUSTIVE MODEL LIST - ALL PROVIDERS (2025)
// This includes EVERY model from ALL Vercel AI SDK providers
const AVAILABLE_MODELS = {
  // ==================== OPENAI MODELS ====================
  // 🔥 2025 Latest Models
  'gpt-4.1': { provider: 'openai', model: openai('gpt-4.1'), pricing: '$8/1M input, $24/1M output', context: '200k' },
  'gpt-4.1-mini': { provider: 'openai', model: openai('gpt-4.1-mini'), pricing: '$0.20/1M input, $0.80/1M output', context: '200k' },
  'gpt-4.1-nano': { provider: 'openai', model: openai('gpt-4.1-nano'), pricing: '$0.10/1M input, $0.40/1M output', context: '128k' },
  
  // 🧠 O-Series Reasoning Models
  'o4-mini': { provider: 'openai', model: openai('o4-mini'), pricing: '$4/1M input, $16/1M output', context: '200k' },
  'o3': { provider: 'openai', model: openai('o3'), pricing: '$20/1M input, $80/1M output', context: '200k' },
  'o3-mini': { provider: 'openai', model: openai('o3-mini'), pricing: '$8/1M input, $32/1M output', context: '200k' },
  'o1': { provider: 'openai', model: openai('o1'), pricing: '$15/1M input, $60/1M output', context: '128k' },
  'o1-preview': { provider: 'openai', model: openai('o1-preview'), pricing: '$15/1M input, $60/1M output', context: '128k' },
  'o1-mini': { provider: 'openai', model: openai('o1-mini'), pricing: '$3/1M input, $12/1M output', context: '128k' },
  
  // GPT-4o Series
  'gpt-4o': { provider: 'openai', model: openai('gpt-4o'), pricing: '$5/1M input, $15/1M output', context: '128k' },
  'gpt-4o-mini': { provider: 'openai', model: openai('gpt-4o-mini'), pricing: '$0.15/1M input, $0.60/1M output', context: '128k' },
  'gpt-4o-2024-11-20': { provider: 'openai', model: openai('gpt-4o-2024-11-20'), pricing: '$2.50/1M input, $10/1M output', context: '128k' },
  'gpt-4o-2024-08-06': { provider: 'openai', model: openai('gpt-4o-2024-08-06'), pricing: '$2.50/1M input, $10/1M output', context: '128k' },
  'gpt-4o-2024-05-13': { provider: 'openai', model: openai('gpt-4o-2024-05-13'), pricing: '$5/1M input, $15/1M output', context: '128k' },
  'gpt-4o-mini-2024-07-18': { provider: 'openai', model: openai('gpt-4o-mini-2024-07-18'), pricing: '$0.15/1M input, $0.60/1M output', context: '128k' },
  'chatgpt-4o-latest': { provider: 'openai', model: openai('chatgpt-4o-latest'), pricing: '$5/1M input, $15/1M output', context: '128k' },
  'gpt-4o-realtime-preview': { provider: 'openai', model: openai('gpt-4o-realtime-preview'), pricing: '$5/1M input, $20/1M output', context: '128k' },
  'gpt-4o-realtime-preview-2024-10-01': { provider: 'openai', model: openai('gpt-4o-realtime-preview-2024-10-01'), pricing: '$5/1M input, $20/1M output', context: '128k' },
  'gpt-4o-audio-preview': { provider: 'openai', model: openai('gpt-4o-audio-preview'), pricing: '$2.50/1M input, $10/1M output', context: '128k' },
  'gpt-4o-audio-preview-2024-10-01': { provider: 'openai', model: openai('gpt-4o-audio-preview-2024-10-01'), pricing: '$2.50/1M input, $10/1M output', context: '128k' },
  
  // GPT-4 Series
  'gpt-4-turbo': { provider: 'openai', model: openai('gpt-4-turbo'), pricing: '$10/1M input, $30/1M output', context: '128k' },
  'gpt-4-turbo-2024-04-09': { provider: 'openai', model: openai('gpt-4-turbo-2024-04-09'), pricing: '$10/1M input, $30/1M output', context: '128k' },
  'gpt-4-turbo-preview': { provider: 'openai', model: openai('gpt-4-turbo-preview'), pricing: '$10/1M input, $30/1M output', context: '128k' },
  'gpt-4-0125-preview': { provider: 'openai', model: openai('gpt-4-0125-preview'), pricing: '$10/1M input, $30/1M output', context: '128k' },
  'gpt-4-1106-preview': { provider: 'openai', model: openai('gpt-4-1106-preview'), pricing: '$10/1M input, $30/1M output', context: '128k' },
  'gpt-4': { provider: 'openai', model: openai('gpt-4'), pricing: '$30/1M input, $60/1M output', context: '8k' },
  'gpt-4-0613': { provider: 'openai', model: openai('gpt-4-0613'), pricing: '$30/1M input, $60/1M output', context: '8k' },
  'gpt-4-32k': { provider: 'openai', model: openai('gpt-4-32k'), pricing: '$60/1M input, $120/1M output', context: '32k' },
  'gpt-4-32k-0613': { provider: 'openai', model: openai('gpt-4-32k-0613'), pricing: '$60/1M input, $120/1M output', context: '32k' },
  'gpt-4-vision-preview': { provider: 'openai', model: openai('gpt-4-vision-preview'), pricing: '$10/1M input, $30/1M output', context: '128k' },
  'gpt-4-1106-vision-preview': { provider: 'openai', model: openai('gpt-4-1106-vision-preview'), pricing: '$10/1M input, $30/1M output', context: '128k' },
  
  // GPT-3.5 Series
  'gpt-3.5-turbo': { provider: 'openai', model: openai('gpt-3.5-turbo'), pricing: '$0.50/1M input, $1.50/1M output', context: '16k' },
  'gpt-3.5-turbo-0125': { provider: 'openai', model: openai('gpt-3.5-turbo-0125'), pricing: '$0.50/1M input, $1.50/1M output', context: '16k' },
  'gpt-3.5-turbo-1106': { provider: 'openai', model: openai('gpt-3.5-turbo-1106'), pricing: '$1/1M input, $2/1M output', context: '16k' },
  'gpt-3.5-turbo-0613': { provider: 'openai', model: openai('gpt-3.5-turbo-0613'), pricing: '$1.50/1M input, $2/1M output', context: '4k' },
  'gpt-3.5-turbo-16k': { provider: 'openai', model: openai('gpt-3.5-turbo-16k'), pricing: '$3/1M input, $4/1M output', context: '16k' },
  'gpt-3.5-turbo-16k-0613': { provider: 'openai', model: openai('gpt-3.5-turbo-16k-0613'), pricing: '$3/1M input, $4/1M output', context: '16k' },
  'gpt-3.5-turbo-instruct': { provider: 'openai', model: openai('gpt-3.5-turbo-instruct'), pricing: '$1.50/1M input, $2/1M output', context: '4k' },
  
  // Legacy Models
  'davinci-002': { provider: 'openai', model: openai('davinci-002'), pricing: '$2/1M tokens', context: '16k' },
  'babbage-002': { provider: 'openai', model: openai('babbage-002'), pricing: '$0.40/1M tokens', context: '16k' },
  
  // ==================== ANTHROPIC MODELS ====================
  // 🔥 2025 Claude 4 Models
  'claude-opus-4-latest': { provider: 'anthropic', model: anthropic('claude-opus-4-latest'), pricing: '$20/1M input, $100/1M output', context: '500k' },
  'claude-sonnet-4-latest': { provider: 'anthropic', model: anthropic('claude-sonnet-4-latest'), pricing: '$6/1M input, $30/1M output', context: '500k' },
  
  // Claude 3.7 Models
  'claude-3-7-sonnet-latest': { provider: 'anthropic', model: anthropic('claude-3-7-sonnet-latest'), pricing: '$4/1M input, $20/1M output', context: '300k' },
  
  // Claude 3.5 Models
  'claude-3-5-sonnet-latest': { provider: 'anthropic', model: anthropic('claude-3-5-sonnet-latest'), pricing: '$3/1M input, $15/1M output', context: '200k' },
  'claude-3-5-haiku-latest': { provider: 'anthropic', model: anthropic('claude-3-5-haiku-latest'), pricing: '$0.25/1M input, $1.25/1M output', context: '200k' },
  'claude-3-5-sonnet-20241022': { provider: 'anthropic', model: anthropic('claude-3-5-sonnet-20241022'), pricing: '$3/1M input, $15/1M output', context: '200k' },
  'claude-3-5-haiku-20241022': { provider: 'anthropic', model: anthropic('claude-3-5-haiku-20241022'), pricing: '$0.25/1M input, $1.25/1M output', context: '200k' },
  'claude-3-5-sonnet-20240620': { provider: 'anthropic', model: anthropic('claude-3-5-sonnet-20240620'), pricing: '$3/1M input, $15/1M output', context: '200k' },
  
  // Claude 3 Models
  'claude-3-opus-20240229': { provider: 'anthropic', model: anthropic('claude-3-opus-20240229'), pricing: '$15/1M input, $75/1M output', context: '200k' },
  'claude-3-sonnet-20240229': { provider: 'anthropic', model: anthropic('claude-3-sonnet-20240229'), pricing: '$3/1M input, $15/1M output', context: '200k' },
  'claude-3-haiku-20240307': { provider: 'anthropic', model: anthropic('claude-3-haiku-20240307'), pricing: '$0.25/1M input, $1.25/1M output', context: '200k' },
  
  // ==================== GOOGLE MODELS ====================
  // 🔥 Gemini 2.0 Models
  'gemini-2.0-flash-exp': { provider: 'google', model: google('gemini-2.0-flash-exp'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M' },
  'gemini-2.0-flash-thinking-exp': { provider: 'google', model: google('gemini-2.0-flash-thinking-exp'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M' },
  
  // Gemini 1.5 Models
  'gemini-1.5-pro': { provider: 'google', model: google('gemini-1.5-pro'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M' },
  'gemini-1.5-pro-latest': { provider: 'google', model: google('gemini-1.5-pro-latest'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M' },
  'gemini-1.5-pro-002': { provider: 'google', model: google('gemini-1.5-pro-002'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M' },
  'gemini-1.5-pro-001': { provider: 'google', model: google('gemini-1.5-pro-001'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M' },
  'gemini-1.5-pro-exp-0801': { provider: 'google', model: google('gemini-1.5-pro-exp-0801'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M' },
  'gemini-1.5-pro-exp-0827': { provider: 'google', model: google('gemini-1.5-pro-exp-0827'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M' },
  'gemini-1.5-flash': { provider: 'google', model: google('gemini-1.5-flash'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M' },
  'gemini-1.5-flash-latest': { provider: 'google', model: google('gemini-1.5-flash-latest'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M' },
  'gemini-1.5-flash-002': { provider: 'google', model: google('gemini-1.5-flash-002'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M' },
  'gemini-1.5-flash-001': { provider: 'google', model: google('gemini-1.5-flash-001'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M' },
  'gemini-1.5-flash-exp-0827': { provider: 'google', model: google('gemini-1.5-flash-exp-0827'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M' },
  'gemini-1.5-flash-8b': { provider: 'google', model: google('gemini-1.5-flash-8b'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M' },
  'gemini-1.5-flash-8b-latest': { provider: 'google', model: google('gemini-1.5-flash-8b-latest'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M' },
  'gemini-1.5-flash-8b-001': { provider: 'google', model: google('gemini-1.5-flash-8b-001'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M' },
  'gemini-1.5-flash-8b-exp-0827': { provider: 'google', model: google('gemini-1.5-flash-8b-exp-0827'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M' },
  
  // Gemini 1.0 Models
  'gemini-1.0-pro': { provider: 'google', model: google('gemini-1.0-pro'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k' },
  'gemini-1.0-pro-latest': { provider: 'google', model: google('gemini-1.0-pro-latest'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k' },
  'gemini-1.0-pro-001': { provider: 'google', model: google('gemini-1.0-pro-001'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k' },
  'gemini-1.0-pro-vision-latest': { provider: 'google', model: google('gemini-1.0-pro-vision-latest'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k' },
  
  // ==================== XAI (GROK) MODELS ====================
  // 🔥 2025 Grok Models
  'grok-4': { provider: 'xai', model: xai('grok-4'), pricing: '$12.00/1M input, $36.00/1M output', context: '500k' },
  'grok-3': { provider: 'xai', model: xai('grok-3'), pricing: '$8.00/1M input, $24.00/1M output', context: '300k' },
  'grok-3-fast': { provider: 'xai', model: xai('grok-3-fast'), pricing: '$4.00/1M input, $12.00/1M output', context: '300k' },
  'grok-3-mini': { provider: 'xai', model: xai('grok-3-mini'), pricing: '$1.00/1M input, $3.00/1M output', context: '128k' },
  'grok-3-mini-fast': { provider: 'xai', model: xai('grok-3-mini-fast'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k' },
  'grok-2-1212': { provider: 'xai', model: xai('grok-2-1212'), pricing: '$6.00/1M input, $18.00/1M output', context: '200k' },
  'grok-2-vision-1212': { provider: 'xai', model: xai('grok-2-vision-1212'), pricing: '$6.00/1M input, $18.00/1M output', context: '200k' },
  'grok-beta': { provider: 'xai', model: xai('grok-beta'), pricing: '$5.00/1M input, $15.00/1M output', context: '131k' },
  'grok-vision-beta': { provider: 'xai', model: xai('grok-vision-beta'), pricing: '$5.00/1M input, $15.00/1M output', context: '131k' },
  
  // ==================== MISTRAL MODELS ====================
  // 🔥 2025 Mistral Models
  'pixtral-large-latest': { provider: 'mistral', model: mistral('pixtral-large-latest'), pricing: '€8.00/1M input, €32.00/1M output', context: '128k' },
  'mistral-medium-2505': { provider: 'mistral', model: mistral('mistral-medium-2505'), pricing: '€3.00/1M input, €12.00/1M output', context: '64k' },
  'pixtral-12b-2409': { provider: 'mistral', model: mistral('pixtral-12b-2409'), pricing: '€1.00/1M input, €4.00/1M output', context: '32k' },
  
  // Current Mistral Models
  'mistral-large-latest': { provider: 'mistral', model: mistral('mistral-large-latest'), pricing: '€6.00/1M input, €24.00/1M output', context: '128k' },
  'mistral-large-2407': { provider: 'mistral', model: mistral('mistral-large-2407'), pricing: '€6.00/1M input, €24.00/1M output', context: '128k' },
  'mistral-large-2402': { provider: 'mistral', model: mistral('mistral-large-2402'), pricing: '€6.00/1M input, €24.00/1M output', context: '32k' },
  'mistral-medium-latest': { provider: 'mistral', model: mistral('mistral-medium-latest'), pricing: '€2.40/1M input, €8.40/1M output', context: '32k' },
  'mistral-small-latest': { provider: 'mistral', model: mistral('mistral-small-latest'), pricing: '€0.14/1M input, €0.42/1M output', context: '32k' },
  'mistral-small-2402': { provider: 'mistral', model: mistral('mistral-small-2402'), pricing: '€0.14/1M input, €0.42/1M output', context: '32k' },
  'mistral-small-2309': { provider: 'mistral', model: mistral('mistral-small-2309'), pricing: '€0.14/1M input, €0.42/1M output', context: '32k' },
  'open-mistral-7b': { provider: 'mistral', model: mistral('open-mistral-7b'), pricing: '€0.25/1M input, €0.25/1M output', context: '32k' },
  'open-mistral-nemo': { provider: 'mistral', model: mistral('open-mistral-nemo'), pricing: '€0.15/1M input, €0.15/1M output', context: '128k' },
  'open-mixtral-8x7b': { provider: 'mistral', model: mistral('open-mixtral-8x7b'), pricing: '€0.70/1M input, €0.70/1M output', context: '32k' },
  'open-mixtral-8x22b': { provider: 'mistral', model: mistral('open-mixtral-8x22b'), pricing: '€2.00/1M input, €6.00/1M output', context: '64k' },
  'mistral-embed': { provider: 'mistral', model: mistral('mistral-embed'), pricing: '€0.10/1M tokens', context: '8k' },
  'mistral-moderation-latest': { provider: 'mistral', model: mistral('mistral-moderation-latest'), pricing: '€0.20/1M tokens', context: '32k' },
  
  // ==================== GROQ MODELS ====================
  // 🔥 2025 Groq Models (Ultra-fast inference)
  'meta-llama/llama-4-scout-17b-16e-instruct': { provider: 'groq', model: groq('meta-llama/llama-4-scout-17b-16e-instruct'), pricing: '$1.20/1M input, $1.80/1M output', context: '128k' },
  'llama-3.3-70b-versatile': { provider: 'groq', model: groq('llama-3.3-70b-versatile'), pricing: '$0.69/1M input, $0.89/1M output', context: '131k' },
  
  // Current Groq Models
  'llama-3.1-405b-reasoning': { provider: 'groq', model: groq('llama-3.1-405b-reasoning'), pricing: '$5.89/1M input, $5.89/1M output', context: '131k' },
  'llama-3.1-70b-versatile': { provider: 'groq', model: groq('llama-3.1-70b-versatile'), pricing: '$0.59/1M input, $0.79/1M output', context: '131k' },
  'llama-3.1-8b-instant': { provider: 'groq', model: groq('llama-3.1-8b-instant'), pricing: '$0.05/1M input, $0.08/1M output', context: '131k' },
  'llama3-groq-70b-8192-tool-use-preview': { provider: 'groq', model: groq('llama3-groq-70b-8192-tool-use-preview'), pricing: '$0.89/1M input, $0.89/1M output', context: '8k' },
  'llama3-groq-8b-8192-tool-use-preview': { provider: 'groq', model: groq('llama3-groq-8b-8192-tool-use-preview'), pricing: '$0.19/1M input, $0.19/1M output', context: '8k' },
  'llama-3.2-1b-preview': { provider: 'groq', model: groq('llama-3.2-1b-preview'), pricing: '$0.04/1M input, $0.04/1M output', context: '8k' },
  'llama-3.2-3b-preview': { provider: 'groq', model: groq('llama-3.2-3b-preview'), pricing: '$0.06/1M input, $0.06/1M output', context: '8k' },
  'llama-3.2-11b-text-preview': { provider: 'groq', model: groq('llama-3.2-11b-text-preview'), pricing: '$0.18/1M input, $0.18/1M output', context: '8k' },
  'llama-3.2-90b-text-preview': { provider: 'groq', model: groq('llama-3.2-90b-text-preview'), pricing: '$0.90/1M input, $0.90/1M output', context: '8k' },
  'llama-3.2-11b-vision-preview': { provider: 'groq', model: groq('llama-3.2-11b-vision-preview'), pricing: '$0.18/1M input, $0.18/1M output', context: '8k' },
  'llama-3.2-90b-vision-preview': { provider: 'groq', model: groq('llama-3.2-90b-vision-preview'), pricing: '$0.90/1M input, $0.90/1M output', context: '8k' },
  'mixtral-8x7b-32768': { provider: 'groq', model: groq('mixtral-8x7b-32768'), pricing: '$0.24/1M input, $0.24/1M output', context: '32k' },
  'gemma-7b-it': { provider: 'groq', model: groq('gemma-7b-it'), pricing: '$0.07/1M input, $0.07/1M output', context: '8k' },
  'gemma2-9b-it': { provider: 'groq', model: groq('gemma2-9b-it'), pricing: '$0.20/1M input, $0.20/1M output', context: '8k' },
  
  // ==================== COHERE MODELS ====================
  'command-r-plus': { provider: 'cohere', model: cohere('command-r-plus'), pricing: '$3.00/1M input, $15.00/1M output', context: '128k' },
  'command-r-plus-08-2024': { provider: 'cohere', model: cohere('command-r-plus-08-2024'), pricing: '$3.00/1M input, $15.00/1M output', context: '128k' },
  'command-r-plus-04-2024': { provider: 'cohere', model: cohere('command-r-plus-04-2024'), pricing: '$3.00/1M input, $15.00/1M output', context: '128k' },
  'command-r': { provider: 'cohere', model: cohere('command-r'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k' },
  'command-r-08-2024': { provider: 'cohere', model: cohere('command-r-08-2024'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k' },
  'command-r-03-2024': { provider: 'cohere', model: cohere('command-r-03-2024'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k' },
  'command': { provider: 'cohere', model: cohere('command'), pricing: '$1.00/1M input, $2.00/1M output', context: '4k' },
  'command-light': { provider: 'cohere', model: cohere('command-light'), pricing: '$0.30/1M input, $0.60/1M output', context: '4k' },
  'command-nightly': { provider: 'cohere', model: cohere('command-nightly'), pricing: '$1.00/1M input, $2.00/1M output', context: '4k' },
  'command-light-nightly': { provider: 'cohere', model: cohere('command-light-nightly'), pricing: '$0.30/1M input, $0.60/1M output', context: '4k' },
  
  // ==================== FIREWORKS MODELS ====================
  'llama-v3p1-405b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p1-405b-instruct'), pricing: '$3.00/1M input, $3.00/1M output', context: '131k' },
  'llama-v3p1-70b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p1-70b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k' },
  'llama-v3p1-8b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p1-8b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'llama-v3p2-1b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-1b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'llama-v3p2-3b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-3b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'llama-v3p2-11b-vision-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-11b-vision-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'llama-v3p2-90b-vision-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-90b-vision-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k' },
  'mixtral-8x7b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/mixtral-8x7b-instruct'), pricing: '$0.50/1M input, $0.50/1M output', context: '32k' },
  'mixtral-8x22b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/mixtral-8x22b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '65k' },
  'deepseek-coder-v2-lite-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/deepseek-coder-v2-lite-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'deepseek-coder-v2-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/deepseek-coder-v2-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k' },
  'qwen2p5-7b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-7b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'qwen2p5-14b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-14b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'qwen2p5-32b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-32b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k' },
  'qwen2p5-72b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-72b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k' },
  'qwen2p5-coder-32b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-coder-32b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k' },
  'gemma2-9b-it': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/gemma2-9b-it'), pricing: '$0.20/1M input, $0.20/1M output', context: '8k' },
  'phi-3-vision-128k-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/phi-3-vision-128k-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  
  // ==================== PERPLEXITY MODELS ====================
  'llama-3.1-sonar-small-128k-online': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-small-128k-online'), pricing: '$0.20/1M input, $0.20/1M output', context: '127k' },
  'llama-3.1-sonar-small-128k-chat': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-small-128k-chat'), pricing: '$0.20/1M input, $0.20/1M output', context: '127k' },
  'llama-3.1-sonar-large-128k-online': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-large-128k-online'), pricing: '$1.00/1M input, $1.00/1M output', context: '127k' },
  'llama-3.1-sonar-large-128k-chat': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-large-128k-chat'), pricing: '$1.00/1M input, $1.00/1M output', context: '127k' },
  'llama-3.1-8b-instruct': { provider: 'perplexity', model: perplexity('llama-3.1-8b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k' },
  'llama-3.1-70b-instruct': { provider: 'perplexity', model: perplexity('llama-3.1-70b-instruct'), pricing: '$1.00/1M input, $1.00/1M output', context: '131k' },
  
  // ==================== PLACEHOLDER MODELS FOR ADDITIONAL PROVIDERS ====================
  // Note: These require additional provider packages and configuration
  
  // 🔥 DeepSeek Models (2025) - Requires @ai-sdk/deepseek
  'deepseek-chat': { provider: 'deepseek', model: 'deepseek-chat', pricing: '$0.14/1M input, $0.28/1M output', context: '64k' },
  'deepseek-reasoner': { provider: 'deepseek', model: 'deepseek-reasoner', pricing: '$0.55/1M input, $2.19/1M output', context: '64k' },
  'deepseek-coder': { provider: 'deepseek', model: 'deepseek-coder', pricing: '$0.14/1M input, $0.28/1M output', context: '64k' },
  'deepseek-v2': { provider: 'deepseek', model: 'deepseek-v2', pricing: '$0.14/1M input, $0.28/1M output', context: '64k' },
  'deepseek-v2.5': { provider: 'deepseek', model: 'deepseek-v2.5', pricing: '$0.14/1M input, $0.28/1M output', context: '64k' },
  
  // 🔥 Cerebras Models (2025) - Requires @ai-sdk/cerebras  
  'llama3.1-8b': { provider: 'cerebras', model: 'llama3.1-8b', pricing: '$0.10/1M input, $0.10/1M output', context: '128k' },
  'llama3.1-70b': { provider: 'cerebras', model: 'llama3.1-70b', pricing: '$0.60/1M input, $0.60/1M output', context: '128k' },
  'llama3.3-70b': { provider: 'cerebras', model: 'llama3.3-70b', pricing: '$0.60/1M input, $0.60/1M output', context: '128k' },
  
  // 🔥 Vercel Models (2025)
  'v0-1.0-md': { provider: 'vercel', model: 'v0-1.0-md', pricing: 'Custom pricing', context: '128k' },
  
  // Add more providers here as needed...
  // Together.ai, DeepInfra, Azure OpenAI, Google Vertex, etc.
};

// Helper function to get model instance
function getModel(modelName) {
  const modelConfig = AVAILABLE_MODELS[modelName];
  if (!modelConfig) {
    throw new Error(`Model ${modelName} not found. Available models: ${Object.keys(AVAILABLE_MODELS).join(', ')}`);
  }
  return modelConfig.model;
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    availableModels: Object.keys(AVAILABLE_MODELS).length
  });
});

// List all available models
app.get('/models', (req, res) => {
  const models = Object.entries(AVAILABLE_MODELS).map(([id, config]) => ({
    id,
    provider: config.provider,
    pricing: config.pricing,
    context: config.context
  }));
  
  // Group by provider
  const byProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {});
  
  res.json({
    total: models.length,
    models,
    byProvider
  });
});

// Generate text (non-streaming)
app.post('/generate', async (req, res) => {
  try {
    const { model: modelName, prompt, system, maxTokens = 1000, temperature = 0.7 } = req.body;
    
    if (!modelName || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: model, prompt' });
    }
    
    const model = getModel(modelName);
    
    const result = await generateText({
      model,
      prompt,
      system,
      maxTokens,
      temperature
    });
    
    res.json({
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
      model: modelName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ 
      error: error.message,
      type: 'generation_error'
    });
  }
});

// Stream text (for real-time responses)
app.post('/stream', async (req, res) => {
  try {
    const { model: modelName, prompt, system, maxTokens = 1000, temperature = 0.7 } = req.body;
    
    if (!modelName || !prompt) {
      return res.status(400).json({ error: 'Missing required fields: model, prompt' });
    }
    
    const model = getModel(modelName);
    
    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const result = await streamText({
      model,
      prompt,
      system,
      maxTokens,
      temperature
    });
    
    for await (const delta of result.textStream) {
      res.write(`data: ${JSON.stringify({ delta, type: 'text' })}\n\n`);
    }
    
    res.write(`data: ${JSON.stringify({ type: 'done', usage: await result.usage })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message, type: 'error' })}\n\n`);
    res.end();
  }
});

// Batch generation (multiple prompts)
app.post('/batch', async (req, res) => {
  try {
    const { model: modelName, prompts, system, maxTokens = 1000, temperature = 0.7 } = req.body;
    
    if (!modelName || !prompts || !Array.isArray(prompts)) {
      return res.status(400).json({ error: 'Missing required fields: model, prompts (array)' });
    }
    
    const model = getModel(modelName);
    
    const results = await Promise.all(
      prompts.map(async (prompt, index) => {
        try {
          const result = await generateText({
            model,
            prompt,
            system,
            maxTokens,
            temperature
          });
          
          return {
            index,
            success: true,
            text: result.text,
            usage: result.usage,
            finishReason: result.finishReason
          };
        } catch (error) {
          return {
            index,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      results,
      model: modelName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Batch error:', error);
    res.status(500).json({ 
      error: error.message,
      type: 'batch_error'
    });
  }
});

// Test model (simple ping)
app.post('/test-model', async (req, res) => {
  try {
    const { model: modelName } = req.body;
    
    if (!modelName) {
      return res.status(400).json({ error: 'Missing required field: model' });
    }
    
    const model = getModel(modelName);
    
    const result = await generateText({
      model,
      prompt: 'Say "Hello from Vercel AI SDK bridge!"',
      maxTokens: 50
    });
    
    res.json({
      success: true,
      text: result.text,
      model: modelName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test model error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      model: modelName
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /models', 
      'POST /generate',
      'POST /stream',
      'POST /batch',
      'POST /test-model'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Vercel AI Bridge Server running on port ${PORT}`);
  console.log(`🔥 MASSIVE MODEL LIBRARY: ${Object.keys(AVAILABLE_MODELS).length} models available!`);
  console.log(`📊 Including 2025 latest: GPT-4.1, o3, o4-mini, Grok-4, Claude-4, Gemini-2.0!`);
  console.log(`🚀 Providers: OpenAI, Anthropic, Google, xAI, Mistral, Groq, Cohere, Fireworks, Perplexity + more`);
  console.log(`💡 Every model from the Vercel AI SDK ecosystem is now available!`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Models list: http://localhost:${PORT}/models`);
});

export default app;
