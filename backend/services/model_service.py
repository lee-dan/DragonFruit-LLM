import os
from typing import Optional, Dict, Any, List
from langchain_openai import ChatOpenAI
from llama_cpp import Llama
import numpy as np

class ModelService:
    """Service to handle different model types (OpenAI, Claude, Llama)"""
    
    def __init__(self):
        self.llama_model = None
        self.llama_model_path = os.getenv("LLAMA_MODEL_PATH", "/Users/aneeshvathul/local_models/Llama-3.2-1B-Instruct-Q8_0.gguf")
        
    def get_model(self, model_name: str):
        """Get the appropriate model based on model name"""
        if model_name.startswith("llama"):
            return self._get_llama_model()
        else:
            return self._get_openai_model(model_name)
    
    def _get_llama_model(self) -> Llama:
        """Get or initialize Llama model"""
        if self.llama_model is None:
            if not os.path.exists(self.llama_model_path):
                raise FileNotFoundError(f"Llama model not found at: {self.llama_model_path}")
            
            self.llama_model = Llama(
                model_path=self.llama_model_path,
                n_ctx=2048,
                n_gpu_layers=0,
                verbose=False,
                logits_all=True,  # needed for logprobs
            )
        return self.llama_model
    
    def _get_openai_model(self, model_name: str) -> ChatOpenAI:
        """Get OpenAI/Claude model"""
        return ChatOpenAI(
            openai_api_key=os.getenv("OPENAI_API_KEY"), 
            model_name=model_name
        )
    
    def invoke_with_logprobs(self, model_name: str, prompt: str, **kwargs) -> Dict[str, Any]:
        """Invoke model and return response with logprobs"""
        try:
            if model_name.startswith("llama"):
                return self._invoke_llama_with_logprobs(prompt, **kwargs)
            else:
                return self._invoke_openai_with_logprobs(model_name, prompt, **kwargs)
        except Exception as e:
            print(f"Error in invoke_with_logprobs for model {model_name}: {e}")
            # Return error in expected format
            return {
                "content": f"Error calling LLM: {str(e)}",
                "response_metadata": {
                    "logprobs": {
                        "content": []
                    }
                }
            }
    
    def _invoke_llama_with_logprobs(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Invoke Llama model with logprobs"""
        try:
            llama_model = self._get_llama_model()
            
            # Format prompt for Llama
            formatted_prompt = self._format_llama_prompt(prompt)
            
            # Generate response
            response = llama_model.create_completion(
                prompt=formatted_prompt,
                max_tokens=kwargs.get("max_tokens", 256),
                temperature=kwargs.get("temperature", 0.7),
                top_p=kwargs.get("top_p", 0.9),
                stop=["<|eot_id|>", "<|end_header_id|>"],
                logprobs=kwargs.get("top_k_probs", 100),
                echo=False,
            )
            
            # Extract text and logprobs
            choice = response["choices"][0]
            text = choice.get("text", "")
            logprobs = choice.get("logprobs", {})
            
            # Convert logprobs to the format expected by the rest of the system
            formatted_logprobs = self._format_llama_logprobs(logprobs)
            
            return {
                "content": text,
                "response_metadata": {
                    "logprobs": {
                        "content": formatted_logprobs
                    }
                }
            }
        except Exception as e:
            # Fallback: return error message in expected format
            return {
                "content": f"Error calling LLM: {str(e)}",
                "response_metadata": {
                    "logprobs": {
                        "content": []
                    }
                }
            }
    
    def _invoke_openai_with_logprobs(self, model_name: str, prompt: str, **kwargs) -> Dict[str, Any]:
        """Invoke OpenAI/Claude model with logprobs"""
        try:
            llm = self._get_openai_model(model_name)
            response = llm.invoke(prompt, logprobs=True)
            
            # Convert LangChain AIMessage to dictionary format
            return {
                "content": response.content,
                "response_metadata": response.response_metadata
            }
        except Exception as e:
            # Fallback: return error message in expected format
            return {
                "content": f"Error calling LLM: {str(e)}",
                "response_metadata": {
                    "logprobs": {
                        "content": []
                    }
                }
            }
    
    def _format_llama_prompt(self, prompt: str) -> str:
        """Format prompt for Llama model"""
        return f"<|start_header_id|>user<|end_header_id|>{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>"
    
    def _format_llama_logprobs(self, logprobs: Dict) -> List[Dict]:
        """Format Llama logprobs to match OpenAI format"""
        formatted = []
        top_logprobs = logprobs.get("top_logprobs", [])
        
        for token_logprobs in top_logprobs:
            if isinstance(token_logprobs, dict):
                formatted.append(token_logprobs)
            else:
                formatted.append({})
        
        return formatted

# Global instance
model_service = ModelService() 