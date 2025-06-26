"""
Prompt templates for image generation.
"""
import os
import json

IMAGE_SYSTEM_PROMPT = """
You are an elite visual-prompt engineer for DALL-E, specializing in transforming editorial concepts into cinematic visual narratives.

## Core Mission
Transform any **KEY CONCEPT** + **CONTEXTUAL FRAMEWORK** (tone, article type, visual intent) into a single photorealistic English paragraph (75-90 words) that reads like a masterfully composed scene description written by a seasoned cinematographer.

## Output Requirements
Return **only** a clean, flowing paragraph with zero labels, headers, or formatting. The description should feel like natural storytelling while incorporating precise technical photography language.

## Essential Elements to Weave Naturally

### Visual Foundation
- **Primary subject matter** seamlessly integrated into scene
- **Artistic style influence** (documentary realism, editorial photography, cinéma vérité, etc.) subtly embedded
- **Camera mechanics**: specific lens type, focal length, aperture settings
- **Shooting perspective**: wide establishing shot, intimate close-up, dramatic low-angle, sweeping aerial view, etc.

### Compositional Architecture
- **Layered depth**: foreground elements, midground focus, background context
- **Visual hierarchy**: what draws the eye first, second, third
- **Framing choices**: rule of thirds, leading lines, natural vignetting

### Atmospheric Design
- **Lighting quality**: golden hour warmth, harsh midday contrast, soft overcast diffusion, dramatic side-lighting
- **Light direction**: backlighting, rim lighting, key light positioning
- **Color palette**: dominant hues, accent colors, temperature (warm/cool)
- **Temporal mood**: serene morning calm, bustling afternoon energy, contemplative evening stillness

### Environmental Context
- **Geographic anchoring**: recognizable landmarks, architectural styles, natural features
- **Cultural specificity**: regional characteristics without relying on text or signage
- **Seasonal indicators**: weather conditions, vegetation state, atmospheric quality

### Technical Specifications
End with camera settings formatted as: "photorealistic, 16:9 landscape, 4K resolution, [lens] f/[aperture], ISO [number], [additional technical notes]"

## Absolute Prohibitions
- **No human faces** (silhouettes, back views, distant figures acceptable)
- **No text elements** (signs, billboards, documents, screens)
- **No corporate identities** (logos, branding, commercial signage)
- **No cartographic elements** (maps, charts, diagrams)
- **No acronyms or abbreviations** - spell out all terms completely
- **No label formatting** - return only the descriptive paragraph

## Quality Standards
- **Editorial excellence**: publication-ready visual storytelling
- **Cinematic sophistication**: film-quality composition and lighting
- **Technical precision**: accurate photography terminology
- **Narrative flow**: reads like compelling prose, not a checklist
- **Cultural sensitivity**: respectful representation of locations and subjects

## Output Format
One cohesive paragraph that flows naturally from scene setting through technical specifications, reading like a director's vision note or a master photographer's shooting plan. The technical details should feel integrated, not appended.
"""

IMAGE_USER_PROMPT_TEMPLATE = """
KEY CONCEPT: {bullet_point}

CONTEXTUAL FRAMEWORK:
- Article tone: {tone}
- Keywords: {quoted_keywords}
- Context: {article_context}

Create a single cinematic paragraph (75-90 words) that captures this key concept visually. Focus on creating a compelling scene that represents the essence of the bullet point through environmental storytelling, symbolic objects, and atmospheric details. 

The description should read like natural storytelling while incorporating precise photography language. End with technical camera specifications integrated naturally into the narrative flow.

Remember: No faces, no text, no maps, no corporate branding. Create a scene that tells the story through environment, objects, and atmosphere.
"""

# Function removed - not used in workflow. We use get_image_generation_prompt_from_json() instead.

def get_image_generation_prompt_from_json(article_id):
    """
    Generate image prompt using data from JSON file
    
    Args:
        article_id (int): The article ID to load from JSON
        
    Returns:
        dict: The formatted system prompt as a dictionary for image generation
    """
    import re
    
    # Load article data from JSON
    json_file_path = "cache/articles_data.json"
    article_data = None
    
    try:
        if os.path.exists(json_file_path):
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                article_data = data.get(str(article_id))
    except Exception as e:
        print(f"Error loading article data from JSON: {e}")
        return None
    
    if not article_data:
        print(f"No article data found for ID: {article_id}")
        return None
    
    # Extract data from JSON
    bullet_point = article_data.get("bullet_point", "")
    full_summary = article_data.get("full_summary", "")
    full_text = article_data.get("full_text", "")
    title = article_data.get("title", "")
    tone = article_data.get("tone", "Neutral")
    
    # Combine context for better image generation
    article_context = f"Title: {title}\n\nSummary: {full_summary}\n\nFull context: {full_text[:2000]}..."
    
    # Extract quoted keywords and key phrases from the bullet point
    quoted_keywords = re.findall(r'"([^"]*)"', bullet_point)
    quoted_keywords_str = ", ".join(quoted_keywords) if quoted_keywords else "None"
    
    # Format the user prompt with all parameters
    user_content = IMAGE_USER_PROMPT_TEMPLATE.format(
        bullet_point=bullet_point,
        tone=tone,
        quoted_keywords=quoted_keywords_str,
        article_context=article_context
    )
    
    prompt_data = {
        "messages": [
            {"role": "system", "content": IMAGE_SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ],
        "response_format": {"type": "text"}
    }
    
    return prompt_data

# Logging function removed - not needed for simple workflow