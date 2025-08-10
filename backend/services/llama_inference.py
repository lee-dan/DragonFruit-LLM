#!/usr/bin/env python3
"""
Simple Llama Inference Script (stepwise only)
Generates Llama model outputs and calculates Shannon entropy (bits) per generated token.
Now includes ShedHD hallucination detection support.
"""

import os
import sys
import torch
import torch.nn.functional as F
import numpy as np
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

try:
    from llama_cpp import Llama
except ImportError:
    print("Error: llama-cpp-python is not installed.")
    print("Install it with: pip install llama-cpp-python")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Import ShedHD model
try:
    from .shed_hd_model import EntropyClassifier
    SHEDHD_AVAILABLE = True
except ImportError:
    print("Warning: ShedHD model not available. Hallucination detection will be disabled.")
    SHEDHD_AVAILABLE = False


def setup_device():
    """Setup CUDA device (informational)."""
    if torch.cuda.is_available():
        device = torch.device('cuda')
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.cuda.empty_cache()
        print(f"Using GPU: {torch.cuda.get_device_name(0)}")
    else:
        device = torch.device('cpu')
        print("Using CPU - Note: Processing will be slower on CPU")
    return device


def format_prompt(question: str) -> str:
    """Format question into model prompt"""
    return f"<|start_header_id|>user<|end_header_id|>Answer the following question in a single brief but complete sentence.\n Question: {question}\n Answer: <|eot_id|><|start_header_id|>assistant<|end_header_id|>"


def entropy_from_top_logprobs(top_lp: Dict[str, float]) -> float:
    """Compute Shannon entropy (bits) from a dict of token->logprob (natural log)."""
    if not top_lp:
        return float("nan")
    
    # Convert logprobs to probabilities
    logprobs = np.fromiter(top_lp.values(), dtype=float)
    
    # Apply softmax to get proper probabilities
    # Subtract max for numerical stability
    logprobs_stable = logprobs - np.max(logprobs)
    exp_logprobs = np.exp(logprobs_stable)
    probs = exp_logprobs / np.sum(exp_logprobs)
    
    # Calculate entropy using log2 (bits)
    # Only consider positive probabilities
    valid_probs = probs[probs > 0]
    if len(valid_probs) == 0:
        return float("nan")
    
    entropy = -np.sum(valid_probs * np.log2(valid_probs + 1e-10))
    
    # Check for invalid values
    if not np.isfinite(entropy):
        return float("nan")
    
    return float(entropy)


def load_shedhd_model(model_path: str) -> Optional[EntropyClassifier]:
    """Load the ShedHD model for hallucination detection."""
    if not SHEDHD_AVAILABLE:
        return None
        
    if not os.path.exists(model_path):
        print(f"Warning: ShedHD model not found at {model_path}")
        return None
    
    try:
        # Setup device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load checkpoint with proper error handling
        checkpoint = torch.load(model_path, map_location=device, weights_only=False)
        
        # Get model configuration from checkpoint
        config = checkpoint.get('config', {})
        hidden_dims = config.get('hidden_dims', [128, 64])
        dropout_rate = config.get('dropout_rate', 0.4)
        
        # Initialize model with the same architecture as used in training
        model = EntropyClassifier(
            input_dim=1, 
            hidden_dims=hidden_dims, 
            dropout_rate=dropout_rate
        )
        
        # Load state dict
        model.load_state_dict(checkpoint['model_state_dict'])
        model = model.to(device)
        model.eval()
        
        print(f"ShedHD model loaded successfully from {model_path}")
        print(f"Model config: hidden_dims={hidden_dims}, dropout_rate={dropout_rate}")
        return model
        
    except Exception as e:
        print(f"Error loading ShedHD model: {e}")
        return None


def detect_hallucination_with_shedhd(
    entropy_sequence: List[float], 
    shedhd_model: EntropyClassifier
) -> Dict[str, Any]:
    """
    Detect hallucination using ShedHD model on entropy sequence.
    
    Returns:
        Dict with 'is_hallucination' (bool), 'confidence' (float), and 'attention_weights' (list)
    """
    if not entropy_sequence or len(entropy_sequence) == 0:
        return {
            'is_hallucination': False,
            'confidence': 0.0,
            'attention_weights': [],
            'error': 'No entropy sequence provided'
        }
    
    try:
        # Pad or truncate sequence to a reasonable length (e.g., 64 tokens)
        max_seq_len = 64
        if len(entropy_sequence) > max_seq_len:
            entropy_sequence = entropy_sequence[:max_seq_len]
        elif len(entropy_sequence) < max_seq_len:
            # Pad with -1 (will be masked out)
            entropy_sequence.extend([-1.0] * (max_seq_len - len(entropy_sequence)))
        
        # Convert to tensor
        input_tensor = torch.tensor(entropy_sequence, dtype=torch.float32).unsqueeze(0)
        
        with torch.no_grad():
            # Get prediction and attention weights
            outputs, attention_weights = shedhd_model(input_tensor, return_attention=True)
            
            # Apply softmax to get probabilities
            probs = F.softmax(outputs, dim=1)
            
            # Get prediction and confidence
            predicted_class = torch.argmax(outputs, dim=1).item()
            confidence = torch.max(probs, dim=1)[0].item()
            
            # Convert attention weights to list
            attention_list = attention_weights.squeeze().tolist()
            
            return {
                'is_hallucination': predicted_class == 1,  # Assuming 1 is hallucination class
                'confidence': confidence,
                'attention_weights': attention_list,
                'class_probabilities': probs.squeeze().tolist(),
                'predicted_class': predicted_class
            }
            
    except Exception as e:
        return {
            'is_hallucination': False,
            'confidence': 0.0,
            'attention_weights': [],
            'error': f'Error in ShedHD inference: {str(e)}'
        }


def detect_hallucination_from_entropy_sequence(entropy_sequence: List[float]) -> Dict[str, Any]:
    """
    Standalone function to detect hallucination from entropy sequence.
    This can be used by other services like test_runner_service.
    
    Args:
        entropy_sequence: List of entropy values (bits) for each token
        
    Returns:
        Dict with hallucination detection results
    """
    if not SHEDHD_AVAILABLE:
        return {
            'is_hallucination': False,
            'confidence': 0.0,
            'attention_weights': [],
            'error': 'ShedHD model not available'
        }
    
    shedhd_model_path = os.getenv("SHEDHD_MODEL_PATH")
    if not shedhd_model_path:
        return {
            'is_hallucination': False,
            'confidence': 0.0,
            'attention_weights': [],
            'error': 'SHEDHD_MODEL_PATH not set in environment'
        }
    
    shedhd_model = load_shedhd_model(shedhd_model_path)
    if not shedhd_model:
        return {
            'is_hallucination': False,
            'confidence': 0.0,
            'attention_weights': [],
            'error': 'Failed to load ShedHD model'
        }
    
    return detect_hallucination_with_shedhd(entropy_sequence, shedhd_model)


def generate_response_with_entropy(
    llama_model: Llama,
    question: str,
    max_tokens: int = 256,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k_probs: int = 100,
) -> Optional[dict]:
    """Stepwise generation: generate one token at a time with logprobs and compute entropy."""
    stop = ["<|eot_id|>", "<|end_header_id|>"]
    prompt = format_prompt(question)

    current = prompt
    generated_tokens: List[str] = []
    entropies: List[float] = []

    for _ in range(max_tokens):
        resp = llama_model.create_completion(
            prompt=current,
            max_tokens=1,
            temperature=temperature,
            top_p=top_p,
            stop=stop,
            logprobs=top_k_probs,
            echo=False,
        )
        ch = resp["choices"][0]
        txt = ch.get("text", "")
        finish = ch.get("finish_reason")

        # Only process if we actually generated a token
        if txt:
            # Extract entropy for this token
            lp = ch.get("logprobs", {}) or {}
            top_list = lp.get("top_logprobs", []) or []
            
            # The top_list should contain dictionaries with token->logprob mappings
            if top_list and isinstance(top_list[0], dict):
                entropy = entropy_from_top_logprobs(top_list[0])
            else:
                entropy = float("nan")
            
            # Only append entropy if it's finite
            if np.isfinite(entropy):
                entropies.append(entropy)
            
            generated_tokens.append(txt)
            current += txt

        if finish in ("stop", "eos_token") or not txt:
            break

    gen_text = "".join(generated_tokens).strip()
    finite_ents = [e for e in entropies if np.isfinite(e)]
    return {
        "text": gen_text,
        "token_entropies": entropies,
        "avg_entropy": float(np.mean(finite_ents)) if finite_ents else None,
        "std_entropy": float(np.std(finite_ents)) if finite_ents else None,
    }


def main():
    if len(sys.argv) != 2:
        print("Usage: python llama_inference.py \"Your question here\"")
        sys.exit(1)

    question = sys.argv[1]
    model_path = "/Users/aneeshvathul/local_models/Llama-3.2-1B-Instruct-Q8_0.gguf"

    if not os.path.exists(model_path):
        print(f"Error: Model file not found: {model_path}")
        sys.exit(1)

    _device = setup_device()

    # Load ShedHD model if available
    shedhd_model_path = os.getenv("SHEDHD_MODEL_PATH")
    shedhd_model = None
    if shedhd_model_path and SHEDHD_AVAILABLE:
        shedhd_model = load_shedhd_model(shedhd_model_path)
        if shedhd_model:
            print("ShedHD model loaded for hallucination detection")
        else:
            print("ShedHD model loading failed - continuing without hallucination detection")
    else:
        print("ShedHD model path not set or model not available - skipping hallucination detection")

    print(f"Loading model from: {model_path}")
    llama_model = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_gpu_layers=0,
        verbose=False,
        logits_all=True,  # needed for logprobs
    )
    print("Model loaded successfully!")

    print(f"Running prompt: {question}")
    result = generate_response_with_entropy(
        llama_model=llama_model,
        question=question,
        max_tokens=256,
        temperature=0.7,
        top_p=0.9,
        top_k_probs=100,
    )

    if result is None:
        print("Failed to generate response")
        sys.exit(1)

    print("\nGenerated text:\n" + (result["text"] or ""))

    ents = result["token_entropies"]
    if ents and any(np.isfinite(ents)):
        print("\nToken entropies (bits):")
        print(ents)
        if result["avg_entropy"] is not None:
            print(f"\nAverage entropy: {result['avg_entropy']:.4f}")
            print(f"Entropy std: {result['std_entropy']:.4f}")
        
        # Perform ShedHD hallucination detection if model is available
        if shedhd_model and ents:
            finite_ents = [e for e in ents if np.isfinite(e)]
            if finite_ents:
                print("\n" + "="*50)
                print("ShedHD Hallucination Detection")
                print("="*50)
                
                hallucination_result = detect_hallucination_with_shedhd(finite_ents, shedhd_model)
                
                if 'error' in hallucination_result:
                    print(f"Error in hallucination detection: {hallucination_result['error']}")
                else:
                    is_hallucination = hallucination_result['is_hallucination']
                    confidence = hallucination_result['confidence']
                    class_probs = hallucination_result['class_probabilities']
                    predicted_class = hallucination_result['predicted_class']
                    
                    print(f"Hallucination detected: {'YES' if is_hallucination else 'NO'}")
                    print(f"Confidence: {confidence:.4f}")
                    print(f"Predicted class: {predicted_class} (0=Truthful, 1=Hallucinated)")
                    print(f"Class probabilities: [Truthful: {class_probs[0]:.4f}, Hallucinated: {class_probs[1]:.4f}]")
                    
                    if hallucination_result['attention_weights']:
                        print(f"Attention weights (first 10): {hallucination_result['attention_weights'][:10]}")
            else:
                print("\nNo valid entropy values for hallucination detection")
    else:
        print("\nNo entropy data available")


if __name__ == "__main__":
    main()
