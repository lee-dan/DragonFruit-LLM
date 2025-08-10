"""
Models API endpoints for listing available AI models from both LangChain and Vercel AI SDK.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from services.vercel_ai_bridge import get_all_available_models, get_vercel_bridge

router = APIRouter()

@router.get("/available")
async def get_available_models() -> Dict[str, Any]:
    """
    Get all available AI models from both LangChain and Vercel AI SDK.
    Returns models grouped by provider with pricing and capability information.
    """
    try:
        all_models = get_all_available_models()
        
        # Group models by provider
        by_provider = {}
        for model in all_models:
            provider = model.get('provider', 'unknown')
            if provider not in by_provider:
                by_provider[provider] = []
            by_provider[provider].append(model)
        
        # Calculate statistics
        total_models = len(all_models)
        total_providers = len(by_provider)
        
        # Check if Vercel bridge is available
        bridge = get_vercel_bridge()
        vercel_available = bridge.is_available()
        
        return {
            "total_models": total_models,
            "total_providers": total_providers,
            "vercel_bridge_available": vercel_available,
            "models": all_models,
            "by_provider": by_provider,
            "providers": list(by_provider.keys())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")

@router.get("/test/{model_name}")
async def test_model(model_name: str) -> Dict[str, Any]:
    """
    Test if a specific model is available and working.
    """
    try:
        bridge = get_vercel_bridge()
        
        # Check if it's a Vercel model
        if bridge.is_available():
            vercel_models = bridge.get_available_models()
            is_vercel_model = any(m['id'] == model_name for m in vercel_models)
            
            if is_vercel_model:
                # Test Vercel model
                is_working = bridge.test_model(model_name)
                return {
                    "model": model_name,
                    "available": is_working,
                    "provider_type": "vercel_ai_sdk",
                    "test_result": "success" if is_working else "failed"
                }
        
        # For LangChain models, we can add testing logic here
        # For now, just return basic info
        return {
            "model": model_name,
            "available": True,  # Assume available
            "provider_type": "langchain",
            "test_result": "not_tested"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test model {model_name}: {str(e)}")

@router.get("/providers")
async def get_providers() -> Dict[str, Any]:
    """
    Get information about all available AI providers.
    """
    try:
        all_models = get_all_available_models()
        
        # Group and count by provider
        provider_info = {}
        for model in all_models:
            provider = model.get('provider', 'unknown')
            if provider not in provider_info:
                provider_info[provider] = {
                    "name": provider,
                    "model_count": 0,
                    "models": [],
                    "pricing_range": "varies"
                }
            
            provider_info[provider]["model_count"] += 1
            provider_info[provider]["models"].append({
                "id": model['id'],
                "name": model.get('name', model['id']),
                "pricing": model.get('pricing', 'unknown'),
                "context_length": model.get('context_length', 'unknown')
            })
        
        return {
            "total_providers": len(provider_info),
            "providers": list(provider_info.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch providers: {str(e)}")

@router.get("/bridge/status")
async def get_bridge_status() -> Dict[str, Any]:
    """
    Get the status of the Vercel AI Bridge server.
    """
    try:
        bridge = get_vercel_bridge()
        is_available = bridge.is_available()
        
        if is_available:
            vercel_models = bridge.get_available_models()
            return {
                "status": "connected",
                "bridge_url": bridge.bridge_url,
                "available_models": len(vercel_models),
                "message": "Vercel AI Bridge is connected and working"
            }
        else:
            return {
                "status": "disconnected",
                "bridge_url": bridge.bridge_url,
                "available_models": 0,
                "message": "Vercel AI Bridge is not available. Make sure the bridge server is running."
            }
            
    except Exception as e:
        return {
            "status": "error",
            "bridge_url": "unknown",
            "available_models": 0,
            "message": f"Error checking bridge status: {str(e)}"
        }
