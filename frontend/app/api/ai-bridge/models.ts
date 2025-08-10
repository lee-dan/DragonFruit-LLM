// AI Models Configuration for Next.js API Routes
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { cohere } from '@ai-sdk/cohere';
import { fireworks } from '@ai-sdk/fireworks';
import { groq } from '@ai-sdk/groq';
import { perplexity } from '@ai-sdk/perplexity';
import { xai } from '@ai-sdk/xai';

export interface ModelConfig {
  provider: string;
  model: any;
  pricing: string;
  context: string;
  available: boolean;
}

// 🔥 EXHAUSTIVE MODEL LIST - ALL PROVIDERS (2025)
// This includes EVERY model from ALL Vercel AI SDK providers
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  // ==================== OPENAI MODELS ====================
  // 🔥 2025 Latest Models
  'gpt-4.1': { provider: 'openai', model: openai('gpt-4.1'), pricing: '$8/1M input, $24/1M output', context: '200k', available: true },
  'gpt-4.1-mini': { provider: 'openai', model: openai('gpt-4.1-mini'), pricing: '$0.20/1M input, $0.80/1M output', context: '200k', available: true },
  'gpt-4.1-nano': { provider: 'openai', model: openai('gpt-4.1-nano'), pricing: '$0.10/1M input, $0.40/1M output', context: '128k', available: true },
  
  // 🧠 O-Series Reasoning Models
  'o4-mini': { provider: 'openai', model: openai('o4-mini'), pricing: '$4/1M input, $16/1M output', context: '200k', available: true },
  'o3': { provider: 'openai', model: openai('o3'), pricing: '$20/1M input, $80/1M output', context: '200k', available: true },
  'o3-mini': { provider: 'openai', model: openai('o3-mini'), pricing: '$8/1M input, $32/1M output', context: '200k', available: true },
  'o1': { provider: 'openai', model: openai('o1'), pricing: '$15/1M input, $60/1M output', context: '128k', available: true },
  'o1-preview': { provider: 'openai', model: openai('o1-preview'), pricing: '$15/1M input, $60/1M output', context: '128k', available: true },
  'o1-mini': { provider: 'openai', model: openai('o1-mini'), pricing: '$3/1M input, $12/1M output', context: '128k', available: true },
  
  // GPT-4o Series
  'gpt-4o': { provider: 'openai', model: openai('gpt-4o'), pricing: '$5/1M input, $15/1M output', context: '128k', available: true },
  'gpt-4o-mini': { provider: 'openai', model: openai('gpt-4o-mini'), pricing: '$0.15/1M input, $0.60/1M output', context: '128k', available: true },
  'gpt-4o-2024-11-20': { provider: 'openai', model: openai('gpt-4o-2024-11-20'), pricing: '$2.50/1M input, $10/1M output', context: '128k', available: true },
  'gpt-4o-2024-08-06': { provider: 'openai', model: openai('gpt-4o-2024-08-06'), pricing: '$2.50/1M input, $10/1M output', context: '128k', available: true },
  'gpt-4o-2024-05-13': { provider: 'openai', model: openai('gpt-4o-2024-05-13'), pricing: '$5/1M input, $15/1M output', context: '128k', available: true },
  'gpt-4o-mini-2024-07-18': { provider: 'openai', model: openai('gpt-4o-mini-2024-07-18'), pricing: '$0.15/1M input, $0.60/1M output', context: '128k', available: true },
  'chatgpt-4o-latest': { provider: 'openai', model: openai('chatgpt-4o-latest'), pricing: '$5/1M input, $15/1M output', context: '128k', available: true },
  'gpt-4o-realtime-preview': { provider: 'openai', model: openai('gpt-4o-realtime-preview'), pricing: '$5/1M input, $20/1M output', context: '128k', available: true },
  'gpt-4o-realtime-preview-2024-10-01': { provider: 'openai', model: openai('gpt-4o-realtime-preview-2024-10-01'), pricing: '$5/1M input, $20/1M output', context: '128k', available: true },
  'gpt-4o-audio-preview': { provider: 'openai', model: openai('gpt-4o-audio-preview'), pricing: '$2.50/1M input, $10/1M output', context: '128k', available: true },
  'gpt-4o-audio-preview-2024-10-01': { provider: 'openai', model: openai('gpt-4o-audio-preview-2024-10-01'), pricing: '$2.50/1M input, $10/1M output', context: '128k', available: true },
  
  // GPT-4 Series
  'gpt-4-turbo': { provider: 'openai', model: openai('gpt-4-turbo'), pricing: '$10/1M input, $30/1M output', context: '128k', available: true },
  'gpt-4-turbo-2024-04-09': { provider: 'openai', model: openai('gpt-4-turbo-2024-04-09'), pricing: '$10/1M input, $30/1M output', context: '128k', available: true },
  'gpt-4-turbo-preview': { provider: 'openai', model: openai('gpt-4-turbo-preview'), pricing: '$10/1M input, $30/1M output', context: '128k', available: true },
  'gpt-4-0125-preview': { provider: 'openai', model: openai('gpt-4-0125-preview'), pricing: '$10/1M input, $30/1M output', context: '128k', available: true },
  'gpt-4-1106-preview': { provider: 'openai', model: openai('gpt-4-1106-preview'), pricing: '$10/1M input, $30/1M output', context: '128k', available: true },
  'gpt-4': { provider: 'openai', model: openai('gpt-4'), pricing: '$30/1M input, $60/1M output', context: '8k', available: true },
  'gpt-4-0613': { provider: 'openai', model: openai('gpt-4-0613'), pricing: '$30/1M input, $60/1M output', context: '8k', available: true },
  'gpt-4-32k': { provider: 'openai', model: openai('gpt-4-32k'), pricing: '$60/1M input, $120/1M output', context: '32k', available: true },
  'gpt-4-32k-0613': { provider: 'openai', model: openai('gpt-4-32k-0613'), pricing: '$60/1M input, $120/1M output', context: '32k', available: true },
  'gpt-4-vision-preview': { provider: 'openai', model: openai('gpt-4-vision-preview'), pricing: '$10/1M input, $30/1M output', context: '128k', available: true },
  'gpt-4-1106-vision-preview': { provider: 'openai', model: openai('gpt-4-1106-vision-preview'), pricing: '$10/1M input, $30/1M output', context: '128k', available: true },
  
  // GPT-3.5 Series
  'gpt-3.5-turbo': { provider: 'openai', model: openai('gpt-3.5-turbo'), pricing: '$0.50/1M input, $1.50/1M output', context: '16k', available: true },
  'gpt-3.5-turbo-0125': { provider: 'openai', model: openai('gpt-3.5-turbo-0125'), pricing: '$0.50/1M input, $1.50/1M output', context: '16k', available: true },
  'gpt-3.5-turbo-1106': { provider: 'openai', model: openai('gpt-3.5-turbo-1106'), pricing: '$1/1M input, $2/1M output', context: '16k', available: true },
  'gpt-3.5-turbo-0613': { provider: 'openai', model: openai('gpt-3.5-turbo-0613'), pricing: '$1.50/1M input, $2/1M output', context: '4k', available: true },
  'gpt-3.5-turbo-16k': { provider: 'openai', model: openai('gpt-3.5-turbo-16k'), pricing: '$3/1M input, $4/1M output', context: '16k', available: true },
  'gpt-3.5-turbo-16k-0613': { provider: 'openai', model: openai('gpt-3.5-turbo-16k-0613'), pricing: '$3/1M input, $4/1M output', context: '16k', available: true },
  'gpt-3.5-turbo-instruct': { provider: 'openai', model: openai('gpt-3.5-turbo-instruct'), pricing: '$1.50/1M input, $2/1M output', context: '4k', available: true },
  
  // Legacy Models
  'davinci-002': { provider: 'openai', model: openai('davinci-002'), pricing: '$2/1M tokens', context: '16k', available: true },
  'babbage-002': { provider: 'openai', model: openai('babbage-002'), pricing: '$0.40/1M tokens', context: '16k', available: true },
  
  // ==================== ANTHROPIC MODELS ====================
  // 🔥 2025 Claude 4 Models
  'claude-opus-4-latest': { provider: 'anthropic', model: anthropic('claude-opus-4-latest'), pricing: '$20/1M input, $100/1M output', context: '500k', available: true },
  'claude-sonnet-4-latest': { provider: 'anthropic', model: anthropic('claude-sonnet-4-latest'), pricing: '$6/1M input, $30/1M output', context: '500k', available: true },
  
  // Claude 3.7 Models
  'claude-3-7-sonnet-latest': { provider: 'anthropic', model: anthropic('claude-3-7-sonnet-latest'), pricing: '$4/1M input, $20/1M output', context: '300k', available: true },
  
  // Claude 3.5 Models
  'claude-3-5-sonnet-latest': { provider: 'anthropic', model: anthropic('claude-3-5-sonnet-latest'), pricing: '$3/1M input, $15/1M output', context: '200k', available: true },
  'claude-3-5-haiku-latest': { provider: 'anthropic', model: anthropic('claude-3-5-haiku-latest'), pricing: '$0.25/1M input, $1.25/1M output', context: '200k', available: true },
  'claude-3-5-sonnet-20241022': { provider: 'anthropic', model: anthropic('claude-3-5-sonnet-20241022'), pricing: '$3/1M input, $15/1M output', context: '200k', available: true },
  'claude-3-5-haiku-20241022': { provider: 'anthropic', model: anthropic('claude-3-5-haiku-20241022'), pricing: '$0.25/1M input, $1.25/1M output', context: '200k', available: true },
  'claude-3-5-sonnet-20240620': { provider: 'anthropic', model: anthropic('claude-3-5-sonnet-20240620'), pricing: '$3/1M input, $15/1M output', context: '200k', available: true },
  
  // Claude 3 Models
  'claude-3-opus-20240229': { provider: 'anthropic', model: anthropic('claude-3-opus-20240229'), pricing: '$15/1M input, $75/1M output', context: '200k', available: true },
  'claude-3-sonnet-20240229': { provider: 'anthropic', model: anthropic('claude-3-sonnet-20240229'), pricing: '$3/1M input, $15/1M output', context: '200k', available: true },
  'claude-3-haiku-20240307': { provider: 'anthropic', model: anthropic('claude-3-haiku-20240307'), pricing: '$0.25/1M input, $1.25/1M output', context: '200k', available: true },
  
  // ==================== GOOGLE MODELS ====================
  // 🔥 Gemini 2.0 Models
  'gemini-2.0-flash-exp': { provider: 'google', model: google('gemini-2.0-flash-exp'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M', available: true },
  'gemini-2.0-flash-thinking-exp': { provider: 'google', model: google('gemini-2.0-flash-thinking-exp'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M', available: true },
  
  // Gemini 1.5 Models
  'gemini-1.5-pro': { provider: 'google', model: google('gemini-1.5-pro'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M', available: true },
  'gemini-1.5-pro-latest': { provider: 'google', model: google('gemini-1.5-pro-latest'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M', available: true },
  'gemini-1.5-pro-002': { provider: 'google', model: google('gemini-1.5-pro-002'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M', available: true },
  'gemini-1.5-pro-001': { provider: 'google', model: google('gemini-1.5-pro-001'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M', available: true },
  'gemini-1.5-pro-exp-0801': { provider: 'google', model: google('gemini-1.5-pro-exp-0801'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M', available: true },
  'gemini-1.5-pro-exp-0827': { provider: 'google', model: google('gemini-1.5-pro-exp-0827'), pricing: '$3.50/1M input, $10.50/1M output', context: '2M', available: true },
  'gemini-1.5-flash': { provider: 'google', model: google('gemini-1.5-flash'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M', available: true },
  'gemini-1.5-flash-latest': { provider: 'google', model: google('gemini-1.5-flash-latest'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M', available: true },
  'gemini-1.5-flash-002': { provider: 'google', model: google('gemini-1.5-flash-002'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M', available: true },
  'gemini-1.5-flash-001': { provider: 'google', model: google('gemini-1.5-flash-001'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M', available: true },
  'gemini-1.5-flash-exp-0827': { provider: 'google', model: google('gemini-1.5-flash-exp-0827'), pricing: '$0.075/1M input, $0.30/1M output', context: '1M', available: true },
  'gemini-1.5-flash-8b': { provider: 'google', model: google('gemini-1.5-flash-8b'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M', available: true },
  'gemini-1.5-flash-8b-latest': { provider: 'google', model: google('gemini-1.5-flash-8b-latest'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M', available: true },
  'gemini-1.5-flash-8b-001': { provider: 'google', model: google('gemini-1.5-flash-8b-001'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M', available: true },
  'gemini-1.5-flash-8b-exp-0827': { provider: 'google', model: google('gemini-1.5-flash-8b-exp-0827'), pricing: '$0.038/1M input, $0.15/1M output', context: '1M', available: true },
  
  // Gemini 1.0 Models
  'gemini-1.0-pro': { provider: 'google', model: google('gemini-1.0-pro'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k', available: true },
  'gemini-1.0-pro-latest': { provider: 'google', model: google('gemini-1.0-pro-latest'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k', available: true },
  'gemini-1.0-pro-001': { provider: 'google', model: google('gemini-1.0-pro-001'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k', available: true },
  'gemini-1.0-pro-vision-latest': { provider: 'google', model: google('gemini-1.0-pro-vision-latest'), pricing: '$0.50/1M input, $1.50/1M output', context: '32k', available: true },
  
  // ==================== XAI (GROK) MODELS ====================
  // 🔥 2025 Grok Models
  'grok-4': { provider: 'xai', model: xai('grok-4'), pricing: '$12.00/1M input, $36.00/1M output', context: '500k', available: true },
  'grok-3': { provider: 'xai', model: xai('grok-3'), pricing: '$8.00/1M input, $24.00/1M output', context: '300k', available: true },
  'grok-3-fast': { provider: 'xai', model: xai('grok-3-fast'), pricing: '$4.00/1M input, $12.00/1M output', context: '300k', available: true },
  'grok-3-mini': { provider: 'xai', model: xai('grok-3-mini'), pricing: '$1.00/1M input, $3.00/1M output', context: '128k', available: true },
  'grok-3-mini-fast': { provider: 'xai', model: xai('grok-3-mini-fast'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k', available: true },
  'grok-2-1212': { provider: 'xai', model: xai('grok-2-1212'), pricing: '$6.00/1M input, $18.00/1M output', context: '200k', available: true },
  'grok-2-vision-1212': { provider: 'xai', model: xai('grok-2-vision-1212'), pricing: '$6.00/1M input, $18.00/1M output', context: '200k', available: true },
  'grok-beta': { provider: 'xai', model: xai('grok-beta'), pricing: '$5.00/1M input, $15.00/1M output', context: '131k', available: true },
  'grok-vision-beta': { provider: 'xai', model: xai('grok-vision-beta'), pricing: '$5.00/1M input, $15.00/1M output', context: '131k', available: true },
  
  // ==================== MISTRAL MODELS ====================
  // 🔥 2025 Mistral Models
  'pixtral-large-latest': { provider: 'mistral', model: mistral('pixtral-large-latest'), pricing: '€8.00/1M input, €32.00/1M output', context: '128k', available: true },
  'mistral-medium-2505': { provider: 'mistral', model: mistral('mistral-medium-2505'), pricing: '€3.00/1M input, €12.00/1M output', context: '64k', available: true },
  'pixtral-12b-2409': { provider: 'mistral', model: mistral('pixtral-12b-2409'), pricing: '€1.00/1M input, €4.00/1M output', context: '32k', available: true },
  
  // Current Mistral Models
  'mistral-large-latest': { provider: 'mistral', model: mistral('mistral-large-latest'), pricing: '€6.00/1M input, €24.00/1M output', context: '128k', available: true },
  'mistral-large-2407': { provider: 'mistral', model: mistral('mistral-large-2407'), pricing: '€6.00/1M input, €24.00/1M output', context: '128k', available: true },
  'mistral-large-2402': { provider: 'mistral', model: mistral('mistral-large-2402'), pricing: '€6.00/1M input, €24.00/1M output', context: '32k', available: true },
  'mistral-medium-latest': { provider: 'mistral', model: mistral('mistral-medium-latest'), pricing: '€2.40/1M input, €8.40/1M output', context: '32k', available: true },
  'mistral-small-latest': { provider: 'mistral', model: mistral('mistral-small-latest'), pricing: '€0.14/1M input, €0.42/1M output', context: '32k', available: true },
  'mistral-small-2402': { provider: 'mistral', model: mistral('mistral-small-2402'), pricing: '€0.14/1M input, €0.42/1M output', context: '32k', available: true },
  'mistral-small-2309': { provider: 'mistral', model: mistral('mistral-small-2309'), pricing: '€0.14/1M input, €0.42/1M output', context: '32k', available: true },
  'open-mistral-7b': { provider: 'mistral', model: mistral('open-mistral-7b'), pricing: '€0.25/1M input, €0.25/1M output', context: '32k', available: true },
  'open-mistral-nemo': { provider: 'mistral', model: mistral('open-mistral-nemo'), pricing: '€0.15/1M input, €0.15/1M output', context: '128k', available: true },
  'open-mixtral-8x7b': { provider: 'mistral', model: mistral('open-mixtral-8x7b'), pricing: '€0.70/1M input, €0.70/1M output', context: '32k', available: true },
  'open-mixtral-8x22b': { provider: 'mistral', model: mistral('open-mixtral-8x22b'), pricing: '€2.00/1M input, €6.00/1M output', context: '64k', available: true },
  'mistral-embed': { provider: 'mistral', model: mistral('mistral-embed'), pricing: '€0.10/1M tokens', context: '8k', available: true },
  'mistral-moderation-latest': { provider: 'mistral', model: mistral('mistral-moderation-latest'), pricing: '€0.20/1M tokens', context: '32k', available: true },
  
  // ==================== GROQ MODELS ====================
  // 🔥 2025 Groq Models (Ultra-fast inference)
  'meta-llama/llama-4-scout-17b-16e-instruct': { provider: 'groq', model: groq('meta-llama/llama-4-scout-17b-16e-instruct'), pricing: '$1.20/1M input, $1.80/1M output', context: '128k', available: true },
  'llama-3.3-70b-versatile': { provider: 'groq', model: groq('llama-3.3-70b-versatile'), pricing: '$0.69/1M input, $0.89/1M output', context: '131k', available: true },
  
  // Current Groq Models
  'llama-3.1-405b-reasoning': { provider: 'groq', model: groq('llama-3.1-405b-reasoning'), pricing: '$5.89/1M input, $5.89/1M output', context: '131k', available: true },
  'llama-3.1-70b-versatile': { provider: 'groq', model: groq('llama-3.1-70b-versatile'), pricing: '$0.59/1M input, $0.79/1M output', context: '131k', available: true },
  'llama-3.1-8b-instant': { provider: 'groq', model: groq('llama-3.1-8b-instant'), pricing: '$0.05/1M input, $0.08/1M output', context: '131k', available: true },
  'llama3-groq-70b-8192-tool-use-preview': { provider: 'groq', model: groq('llama3-groq-70b-8192-tool-use-preview'), pricing: '$0.89/1M input, $0.89/1M output', context: '8k', available: true },
  'llama3-groq-8b-8192-tool-use-preview': { provider: 'groq', model: groq('llama3-groq-8b-8192-tool-use-preview'), pricing: '$0.19/1M input, $0.19/1M output', context: '8k', available: true },
  'llama-3.2-1b-preview': { provider: 'groq', model: groq('llama-3.2-1b-preview'), pricing: '$0.04/1M input, $0.04/1M output', context: '8k', available: true },
  'llama-3.2-3b-preview': { provider: 'groq', model: groq('llama-3.2-3b-preview'), pricing: '$0.06/1M input, $0.06/1M output', context: '8k', available: true },
  'llama-3.2-11b-text-preview': { provider: 'groq', model: groq('llama-3.2-11b-text-preview'), pricing: '$0.18/1M input, $0.18/1M output', context: '8k', available: true },
  'llama-3.2-90b-text-preview': { provider: 'groq', model: groq('llama-3.2-90b-text-preview'), pricing: '$0.90/1M input, $0.90/1M output', context: '8k', available: true },
  'llama-3.2-11b-vision-preview': { provider: 'groq', model: groq('llama-3.2-11b-vision-preview'), pricing: '$0.18/1M input, $0.18/1M output', context: '8k', available: true },
  'llama-3.2-90b-vision-preview': { provider: 'groq', model: groq('llama-3.2-90b-vision-preview'), pricing: '$0.90/1M input, $0.90/1M output', context: '8k', available: true },
  'mixtral-8x7b-32768': { provider: 'groq', model: groq('mixtral-8x7b-32768'), pricing: '$0.24/1M input, $0.24/1M output', context: '32k', available: true },
  'gemma-7b-it': { provider: 'groq', model: groq('gemma-7b-it'), pricing: '$0.07/1M input, $0.07/1M output', context: '8k', available: true },
  'gemma2-9b-it': { provider: 'groq', model: groq('gemma2-9b-it'), pricing: '$0.20/1M input, $0.20/1M output', context: '8k', available: true },
  
  // ==================== COHERE MODELS ====================
  'command-r-plus': { provider: 'cohere', model: cohere('command-r-plus'), pricing: '$3.00/1M input, $15.00/1M output', context: '128k', available: true },
  'command-r-plus-08-2024': { provider: 'cohere', model: cohere('command-r-plus-08-2024'), pricing: '$3.00/1M input, $15.00/1M output', context: '128k', available: true },
  'command-r-plus-04-2024': { provider: 'cohere', model: cohere('command-r-plus-04-2024'), pricing: '$3.00/1M input, $15.00/1M output', context: '128k', available: true },
  'command-r': { provider: 'cohere', model: cohere('command-r'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k', available: true },
  'command-r-08-2024': { provider: 'cohere', model: cohere('command-r-08-2024'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k', available: true },
  'command-r-03-2024': { provider: 'cohere', model: cohere('command-r-03-2024'), pricing: '$0.50/1M input, $1.50/1M output', context: '128k', available: true },
  'command': { provider: 'cohere', model: cohere('command'), pricing: '$1.00/1M input, $2.00/1M output', context: '4k', available: true },
  'command-light': { provider: 'cohere', model: cohere('command-light'), pricing: '$0.30/1M input, $0.60/1M output', context: '4k', available: true },
  'command-nightly': { provider: 'cohere', model: cohere('command-nightly'), pricing: '$1.00/1M input, $2.00/1M output', context: '4k', available: true },
  'command-light-nightly': { provider: 'cohere', model: cohere('command-light-nightly'), pricing: '$0.30/1M input, $0.60/1M output', context: '4k', available: true },
  
  // ==================== FIREWORKS MODELS ====================
  'llama-v3p1-405b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p1-405b-instruct'), pricing: '$3.00/1M input, $3.00/1M output', context: '131k', available: true },
  'llama-v3p1-70b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p1-70b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k', available: true },
  'llama-v3p1-8b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p1-8b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'llama-v3p2-1b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-1b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'llama-v3p2-3b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-3b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'llama-v3p2-11b-vision-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-11b-vision-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'llama-v3p2-90b-vision-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/llama-v3p2-90b-vision-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k', available: true },
  'mixtral-8x7b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/mixtral-8x7b-instruct'), pricing: '$0.50/1M input, $0.50/1M output', context: '32k', available: true },
  'mixtral-8x22b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/mixtral-8x22b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '65k', available: true },
  'deepseek-coder-v2-lite-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/deepseek-coder-v2-lite-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'deepseek-coder-v2-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/deepseek-coder-v2-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k', available: true },
  'qwen2p5-7b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-7b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'qwen2p5-14b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-14b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'qwen2p5-32b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-32b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k', available: true },
  'qwen2p5-72b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-72b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k', available: true },
  'qwen2p5-coder-32b-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/qwen2p5-coder-32b-instruct'), pricing: '$0.90/1M input, $0.90/1M output', context: '131k', available: true },
  'gemma2-9b-it': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/gemma2-9b-it'), pricing: '$0.20/1M input, $0.20/1M output', context: '8k', available: true },
  'phi-3-vision-128k-instruct': { provider: 'fireworks', model: fireworks('accounts/fireworks/models/phi-3-vision-128k-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  
  // ==================== PERPLEXITY MODELS ====================
  'llama-3.1-sonar-small-128k-online': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-small-128k-online'), pricing: '$0.20/1M input, $0.20/1M output', context: '127k', available: true },
  'llama-3.1-sonar-small-128k-chat': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-small-128k-chat'), pricing: '$0.20/1M input, $0.20/1M output', context: '127k', available: true },
  'llama-3.1-sonar-large-128k-online': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-large-128k-online'), pricing: '$1.00/1M input, $1.00/1M output', context: '127k', available: true },
  'llama-3.1-sonar-large-128k-chat': { provider: 'perplexity', model: perplexity('llama-3.1-sonar-large-128k-chat'), pricing: '$1.00/1M input, $1.00/1M output', context: '127k', available: true },
  'llama-3.1-8b-instruct': { provider: 'perplexity', model: perplexity('llama-3.1-8b-instruct'), pricing: '$0.20/1M input, $0.20/1M output', context: '131k', available: true },
  'llama-3.1-70b-instruct': { provider: 'perplexity', model: perplexity('llama-3.1-70b-instruct'), pricing: '$1.00/1M input, $1.00/1M output', context: '131k', available: true },
};

// Helper function to get model instance
export function getModel(modelName: string): ModelConfig | null {
  const modelConfig = AVAILABLE_MODELS[modelName];
  if (!modelConfig) {
    return null;
  }
  return modelConfig;
}

// Helper function to check if a model uses Vercel AI SDK
export function isVercelModel(modelName: string): boolean {
  return modelName in AVAILABLE_MODELS;
}

// Get all available models as API response format
export function getAvailableModelsResponse() {
  const models = Object.entries(AVAILABLE_MODELS).map(([id, config]) => ({
    id,
    name: id,
    provider: config.provider,
    pricing: config.pricing,
    context_length: config.context,
    type: 'text',
    available: config.available
  }));

  return {
    models,
    total: models.length,
    providers: [...new Set(models.map(m => m.provider))]
  };
}
