def get_openai_summarization_prompt(article_text, language):
    """
    Generate the OpenAI prompt for article summarization with optimal JSON schema
    
    Args:
        article_text (str): The text of the article to summarize
        language (str): The language to generate the summary in
        
    Returns:
        dict: The formatted prompt as a dictionary for OpenAI
    """
    # Fixed optimal word count for social media consistency
    OPTIMAL_WORD_COUNT = 15
    
    system_content = f"""You are an expert social media content creator.

Transform any article into ONE impactful bullet point + complete summary.

REQUIREMENTS:
- Bullet point: EXACTLY {OPTIMAL_WORD_COUNT} words, impactful, journalistic style
- Summary: 50-100 words, informative, complete context
- Language: {language} with proper formatting
- Tone: Detect and specify (Informative/Dramatic/Urgent/Neutral)

JSON SCHEMA:
{{
  "summary": {{
    "bullet_point": "Exactly {OPTIMAL_WORD_COUNT} words...",
    "full_summary": "Complete article summary...",
    "tone": "Detected tone",
    "word_count": {OPTIMAL_WORD_COUNT}
  }}
}}"""

    user_content = f"""Article: {article_text}

Generate the JSON response with exactly {OPTIMAL_WORD_COUNT} words bullet point and complete summary in {language}."""
    
    return {
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content}
        ],
        "response_format": {"type": "json_object"}
    } 