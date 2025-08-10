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
        self.bridge_url = (bridge_url or os.getenv('VERCEL_BRIDGE_URL', 'http://localhost:3001')).rstrip('/')
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
            response = self.session.get(f"{self.bridge_url}/health", timeout=2)
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
            response = self.session.get(f"{self.bridge_url}/models", timeout=10)
            response.raise_for_status()
            data = response.json()
            
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
                f"{self.bridge_url}/generate",
                json=payload,
                timeout=60  # Longer timeout for generation
            )
            response.raise_for_status()
            data = response.json()
            
            # Transform response to match LangChain format
            return {
                'content': data.get('text', ''),
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
    bridge = get_vercel_bridge()
    if not bridge.is_available():
        return False
    
    available_models = bridge.get_available_models()
    return any(model['id'] == model_name for model in available_models)

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
