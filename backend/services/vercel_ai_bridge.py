"""
Vercel AI Bridge Service
Provides access to 40+ AI models through the Vercel AI SDK bridge server.
"""

import requests
import json
import os
from typing import Dict, List, Any, Optional
from functools import lru_cache

class VercelAIBridge:
    """
    Python client for the Vercel AI Bridge Server.
    Provides a unified interface to 40+ AI models through the Vercel AI SDK.
    """
    
    def __init__(self, bridge_url: str = None):
        # Updated to use Next.js API routes instead of separate bridge server
        self.bridge_url = (bridge_url or os.getenv('VERCEL_BRIDGE_URL', 'http://localhost:3000')).rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'FailProofLLM-Backend/1.0'
        })
        self._models_cache = None
        self._cache_timestamp = None
    
    def is_available(self) -> bool:
        """Check if the bridge server is available."""
        try:
            response = self.session.get(f"{self.bridge_url}/api/ai-bridge/health", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    @lru_cache(maxsize=1)
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get all available models with caching.
        Returns a list of models compatible with the existing backend format.
        """
        try:
            response = self.session.get(f"{self.bridge_url}/api/ai-bridge/models", timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Handle Next.js API response format
            if 'data' in data:
                data = data['data']
            
            # Transform to match existing backend model format
            models = []
            for model in data.get('models', []):
                models.append({
                    'id': model['id'],
                    'name': model['id'],  # For compatibility
                    'provider': model['provider'],
                    'pricing': model['pricing'],
                    'context_length': model['context'],
                    'type': 'chat',
                    'available': True
                })
            
            return models
            
        except Exception as e:
            print(f"Warning: Could not fetch models from Vercel bridge: {e}")
            return []
    
    def generate_text(
        self, 
        model_name: str, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate text using the specified model.
        Compatible with existing LangChain interface.
        """
        payload = {
            "model": model_name,
            "prompt": prompt,
            "maxTokens": max_tokens,
            "temperature": temperature
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        try:
            response = self.session.post(
                f"{self.bridge_url}/api/ai-bridge/generate",
                json=payload,
                timeout=60  # Longer timeout for generation
            )
            response.raise_for_status()
            data = response.json()
            
            # Handle Next.js API response format
            if 'data' in data:
                data = data['data']
            
            # Transform response to match LangChain format
            return {
                'content': data.get('content', ''),
                'response_metadata': {
                    'model': data.get('model'),
                    'usage': data.get('usage', {}),
                    'finish_reason': data.get('finishReason'),
                    'timestamp': data.get('timestamp')
                }
            }
            
        except Exception as e:
            raise Exception(f"Vercel bridge generation failed for {model_name}: {e}")
    
    def test_model(self, model_name: str) -> bool:
        """Test if a specific model is working."""
        try:
            response = self.session.post(
                f"{self.bridge_url}/test-model",
                json={"model": model_name},
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            return data.get('success', False)
        except:
            return False

# Global instance
_bridge_instance = None

def get_vercel_bridge() -> VercelAIBridge:
    """Get the global Vercel AI bridge instance."""
    global _bridge_instance
    if _bridge_instance is None:
        _bridge_instance = VercelAIBridge()
    return _bridge_instance

def is_vercel_model(model_name: str) -> bool:
    """Check if a model name corresponds to a Vercel AI SDK model."""
    # List of models that should use the Vercel AI Bridge
    vercel_models = [
        # OpenAI models
        'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o4-mini', 'o3', 'o3-mini', 'o1', 'o1-preview', 'o1-mini',
        'gpt-4o', 'gpt-4o-mini', 'gpt-4o-2024-11-20', 'chatgpt-4o-latest', 'gpt-4-turbo', 'gpt-4',
        
        # Anthropic models
        'claude-opus-4-latest', 'claude-sonnet-4-latest', 'claude-3-7-sonnet-latest',
        'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
        
        # Google models
        'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.0-pro',
        
        # xAI models
        'grok-4', 'grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-beta', 'grok-vision-beta',
        
        # Mistral models
        'pixtral-large-latest', 'mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest',
        
        # Groq models
        'llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768',
        
        # Cohere models
        'command-r-plus', 'command-r',
        
        # Fireworks models
        'llama-v3p1-405b-instruct', 'llama-v3p1-70b-instruct',
        
        # Perplexity models
        'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'
    ]
    
    return model_name in vercel_models

def get_all_available_models() -> List[Dict[str, Any]]:
    """
    Get all available models including both LangChain and Vercel AI SDK models.
    This function can be used to populate the frontend model selection.
    """
    all_models = []
    
    # Add traditional LangChain models (existing implementation)
    langchain_models = [
        {
            'id': 'gpt-3.5-turbo-langchain',
            'name': 'GPT-3.5 Turbo (LangChain)',
            'provider': 'openai-langchain',
            'pricing': '$0.50/1M input, $1.50/1M output',
            'context_length': '16k',
            'type': 'chat',
            'available': True
        }
        # Add more existing models here
    ]
    all_models.extend(langchain_models)
    
    # Add Vercel AI SDK models
    bridge = get_vercel_bridge()
    if bridge.is_available():
        vercel_models = bridge.get_available_models()
        all_models.extend(vercel_models)
    
    return all_models
