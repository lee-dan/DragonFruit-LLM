# Vercel AI Bridge Server

A Express.js bridge server that exposes the Vercel AI SDK to your Python backend, giving you access to 40+ AI models from multiple providers.

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd vercel-ai-bridge
npm install

# 2. Set up environment variables
cp env.example .env
# Edit .env with your API keys

# 3. Start the server
npm start
```

## 📋 Available Models

The bridge provides access to **40+ models** from multiple providers:

### OpenAI
- `gpt-4o` - Latest and most capable
- `gpt-4o-mini` - Cost-effective 
- `gpt-4-turbo` - Previous generation
- `gpt-3.5-turbo` - Fast and affordable

### Anthropic (Claude)
- `claude-3-5-sonnet-20241022` - Most intelligent
- `claude-3-5-haiku-20241022` - Fast and affordable
- `claude-3-opus-20240229` - Most capable (legacy)

### Google (Gemini)
- `gemini-1.5-pro` - 2M context window
- `gemini-1.5-flash` - Ultra-fast inference
- `gemini-1.0-pro` - Reliable baseline

### Groq (Ultra-fast inference)
- `llama-3.1-405b-reasoning` - Largest model
- `llama-3.1-70b-versatile` - Balanced performance
- `llama-3.1-8b-instant` - Lightning fast

### Mistral
- `mistral-large-latest` - Most capable
- `mistral-small-latest` - Cost-effective
- `open-mistral-7b` - Open source

### And more...
- **Fireworks**: Llama models with optimized inference
- **Perplexity**: Online-enabled models 
- **xAI (Grok)**: Real-time information
- **Cohere**: Command models

## 🔌 API Endpoints

### GET `/models`
List all available models with pricing and context information.

```bash
curl http://localhost:3001/models
```

### POST `/generate`
Generate text with any model.

```bash
curl -X POST http://localhost:3001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "prompt": "Explain quantum computing in simple terms",
    "maxTokens": 500
  }'
```

### POST `/stream`
Stream responses for real-time applications.

```bash
curl -X POST http://localhost:3001/stream \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "prompt": "Write a short story about AI"
  }'
```

### POST `/batch`
Process multiple prompts in parallel.

```bash
curl -X POST http://localhost:3001/batch \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "prompts": ["What is AI?", "What is ML?", "What is DL?"]
  }'
```

### POST `/test-model`
Quick test to verify a model is working.

```bash
curl -X POST http://localhost:3001/test-model \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini"}'
```

## 🔧 Integration with Python Backend

Update your Python backend to use the bridge server:

```python
import requests

class VercelAIBridge:
    def __init__(self, bridge_url="http://localhost:3001"):
        self.bridge_url = bridge_url
    
    def list_models(self):
        response = requests.get(f"{self.bridge_url}/models")
        return response.json()
    
    def generate_text(self, model, prompt, **kwargs):
        response = requests.post(f"{self.bridge_url}/generate", json={
            "model": model,
            "prompt": prompt,
            **kwargs
        })
        return response.json()
    
    def test_model(self, model):
        response = requests.post(f"{self.bridge_url}/test-model", json={
            "model": model
        })
        return response.json()

# Usage
bridge = VercelAIBridge()
models = bridge.list_models()
result = bridge.generate_text("gpt-4o-mini", "Hello, world!")
```

## 🛠️ Development

```bash
# Development mode with auto-restart
npm run dev

# Run tests
npm test

# Check health
curl http://localhost:3001/health
```

## 🔑 Environment Variables

Required API keys (add the ones you want to use):

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
COHERE_API_KEY=...
FIREWORKS_API_KEY=...
PERPLEXITY_API_KEY=...
XAI_API_KEY=...
```

## 🎯 Benefits

1. **40+ Models**: Access to the largest collection of AI models
2. **Unified API**: Single interface for all providers
3. **Cost Effective**: Choose the right model for each task
4. **Real-time**: Streaming support for chat applications
5. **Reliable**: Built on Vercel's production-ready SDK
6. **Scalable**: Easy to deploy and scale

## 🚀 Next Steps

1. Start the bridge server
2. Test with your existing Python backend
3. Update your model selection UI to show all available models
4. Implement cost optimization by choosing cheaper models for simple tasks
