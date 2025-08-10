"""
Utility functions for prompt manipulation and formatting.

This module provides functions to wrap prompts with markdown formatting directives
to ensure that LLM responses are properly formatted and structured.

The markdown_prompt_wrapper function is integrated into the test runner service
to automatically wrap all prompts sent to LLMs during stress testing.
"""

def markdown_prompt_wrapper(prompt: str, include_examples: bool = True) -> str:
    """
    Wraps a prompt with a directive to output properly formatted markdown.
    
    Args:
        prompt (str): The original prompt to wrap
        include_examples (bool): Whether to include markdown formatting examples
        
    Returns:
        str: The wrapped prompt with markdown formatting directive
    """
    markdown_directive = """Please provide your response in properly formatted markdown. Use appropriate markdown syntax for:
- Headers (using #, ##, ###)
- Lists (using - or 1. 2. 3.)
- Code blocks (using ``` for multi-line or ` for inline)
- Bold text (using **text**)
- Italic text (using *text*)
- Links (using [text](url))
- Tables (using | for columns and --- for headers)
- Blockquotes (using >)

Ensure your response is well-structured and readable."""

    if include_examples:
        markdown_directive += """

Examples of proper markdown formatting:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- `inline code` for technical terms
- ```python
  # Code blocks for longer code
  def example():
      return "formatted"
  ```
- > Blockquotes for important notes
- [Link text](https://example.com) for references"""

    wrapped_prompt = f"{markdown_directive}\n\n{prompt}"
    return wrapped_prompt


def markdown_prompt_wrapper_simple(prompt: str) -> str:
    """
    A simpler version of markdown_prompt_wrapper that just adds a basic directive.
    
    Args:
        prompt (str): The original prompt to wrap
        
    Returns:
        str: The wrapped prompt with basic markdown directive
    """
    return f"Please respond using proper markdown formatting.\n\n{prompt}"


def markdown_prompt_wrapper_custom(prompt: str, custom_directive: str = None) -> str:
    """
    Wraps a prompt with a custom markdown directive.
    
    Args:
        prompt (str): The original prompt to wrap
        custom_directive (str, optional): Custom directive to use instead of default
        
    Returns:
        str: The wrapped prompt with custom markdown directive
    """
    if custom_directive is None:
        custom_directive = "Please format your response using proper markdown syntax."
    
    return f"{custom_directive}\n\n{prompt}" 