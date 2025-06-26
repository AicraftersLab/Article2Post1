#!/usr/bin/env python3
"""
Social Media Post Generator
Generates optimized social media posts from articles instead of videos
"""

import os
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from services.openai_client import get_openai_api_key
from openai import OpenAI
from core.image_generator import generate_image_for_text
from utils.json_utils import save_and_clean_json

# Platform-specific configurations
PLATFORM_CONFIGS = {
    "instagram": {
        "max_caption_length": 2200,
        "max_hashtags": 30,
        "image_format": "1080x1080",  # Square
        "recommended_hashtags": 15
    },
    "facebook": {
        "max_caption_length": 63206,
        "max_hashtags": 50,
        "image_format": "1200x630",   # Landscape
        "recommended_hashtags": 10
    },
    "linkedin": {
        "max_caption_length": 3000,
        "max_hashtags": 30,
        "image_format": "1200x628",   # Professional
        "recommended_hashtags": 8
    },
    "twitter": {
        "max_caption_length": 280,
        "max_hashtags": 10,
        "image_format": "1200x675",   # Twitter card
        "recommended_hashtags": 5
    }
}

def generate_social_posts(article_data: Dict[str, Any], platforms: List[str] = None, language: str = "fr") -> Dict[str, Any]:
    """
    Generate social media posts from article data
    
    Args:
        article_data: Dictionary containing article content and bullet points
        platforms: List of social media platforms to generate posts for
        language: Language for the posts
        
    Returns:
        Dictionary containing generated posts for each platform
    """
    if platforms is None:
        platforms = ["instagram", "facebook", "linkedin", "twitter"]
    
    print(f"Generating social media posts for platforms: {platforms}")
    
    # Create output directory
    os.makedirs("cache/social_posts/", exist_ok=True)
    
    posts = {}
    
    for platform in platforms:
        try:
            print(f"Generating post for {platform}...")
            post = generate_platform_post(article_data, platform, language)
            posts[platform] = post
        except Exception as e:
            print(f"Error generating post for {platform}: {e}")
            posts[platform] = {"error": str(e)}
    
    # Save posts to file
    save_and_clean_json(posts, "cache/social_posts/generated_posts.json")
    
    return posts

def generate_platform_post(article_data: Dict[str, Any], platform: str, language: str) -> Dict[str, Any]:
    """
    Generate a single platform-specific social media post
    """
    config = PLATFORM_CONFIGS.get(platform, PLATFORM_CONFIGS["instagram"])
    
    # Extract key information from article
    bullet_points = article_data.get("summary", [])
    full_text = article_data.get("full_text", "")
    
    # 🎯 RECHERCHER L'IMAGE EXISTANTE AVEC LOGO APPLIQUÉ
    existing_image_path = None
    
    # 1. Chercher dans les bullet_points s'il y a une image avec logo
    for bullet_point in article_data.get("bullet_points", []):
        if bullet_point.get("image_path") and os.path.exists(bullet_point["image_path"]):
            existing_image_path = bullet_point["image_path"]
            print(f"Found existing image for {platform}: {existing_image_path}")
            break
    
    # 2. Si pas d'image trouvée dans l'article, chercher dans le cache img
    if not existing_image_path:
        cache_img_dir = "cache/img"
        if os.path.exists(cache_img_dir):
            for img_file in os.listdir(cache_img_dir):
                if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(cache_img_dir, img_file)
                    if os.path.exists(img_path):
                        existing_image_path = img_path
                        print(f"Found cached image for {platform}: {existing_image_path}")
                        break
    
    # Generate optimized caption
    caption = generate_optimized_caption(bullet_points, platform, language, config)
    
    # Generate hashtags
    hashtags = generate_hashtags(bullet_points, platform, language, config)
    
    # Generate call-to-action
    cta = generate_call_to_action(platform, language)
    
    # Generate image for the post (using existing image with logo if available)
    image_path = generate_post_image(bullet_points, platform, config, existing_image_path)
    
    # Create post object
    post = {
        "platform": platform,
        "caption": caption,
        "hashtags": hashtags,
        "call_to_action": cta,
        "image_path": image_path,
        "character_count": len(caption),
        "hashtag_count": len(hashtags),
        "timestamp": time.time(),
        "config_used": config
    }
    
    return post

def generate_optimized_caption(bullet_points: List[str], platform: str, language: str, config: Dict) -> str:
    """
    Generate an optimized caption for the specific platform
    """
    try:
        api_key = get_openai_api_key()
        if not api_key:
            raise ValueError("OpenAI API key not found")
        client = OpenAI(api_key=api_key)
        
        # Create platform-specific prompt
        prompt = create_caption_prompt(bullet_points, platform, language, config)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"Tu es un expert en marketing des réseaux sociaux. Génère du contenu optimisé pour {platform}."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        caption = response.choices[0].message.content.strip()
        
        # Ensure caption respects platform limits
        if len(caption) > config["max_caption_length"]:
            caption = caption[:config["max_caption_length"]-3] + "..."
        
        return caption
        
    except Exception as e:
        print(f"Error generating caption: {e}")
        # Fallback: combine bullet points
        return " ".join(bullet_points[:3]) + f" #article #{platform}"

def create_caption_prompt(bullet_points: List[str], platform: str, language: str, config: Dict) -> str:
    """
    Create a prompt for generating platform-specific captions
    """
    platform_styles = {
        "instagram": "engageant et visuel, avec des émojis et un ton inspirant",
        "facebook": "conversationnel et informatif, encourageant les interactions",
        "linkedin": "professionnel et informatif, axé sur la valeur business",
        "twitter": "concis et accrocheur, avec un angle d'actualité"
    }
    
    style = platform_styles.get(platform, "engageant")
    max_length = config["max_caption_length"]
    
    bullet_text = "\n".join([f"- {point}" for point in bullet_points])
    
    prompt = f"""
Génère un post {platform} {style} en {language} basé sur ces points clés :

{bullet_text}

Instructions :
- Maximum {max_length} caractères
- Style {style}
- Inclus un hook accrocheur au début
- Utilise des émojis appropriés (sauf LinkedIn)
- Termine par une question ou un CTA pour encourager l'engagement
- N'inclus PAS les hashtags dans le texte (ils seront ajoutés séparément)

Post {platform} :
"""
    
    return prompt

def generate_hashtags(bullet_points: List[str], platform: str, language: str, config: Dict) -> List[str]:
    """
    Generate relevant hashtags for the post
    """
    try:
        api_key = get_openai_api_key()
        if not api_key:
            raise ValueError("OpenAI API key not found")
        client = OpenAI(api_key=api_key)
        
        max_hashtags = config["recommended_hashtags"]
        bullet_text = " ".join(bullet_points)
        
        prompt = f"""
Génère {max_hashtags} hashtags pertinents en {language} pour un post {platform} basé sur ce contenu :

{bullet_text}

Instructions :
- Hashtags en {language}
- Mix de hashtags populaires et de niche
- Évite les hashtags trop génériques
- Format : #hashtag (sans espaces)
- Maximum {max_hashtags} hashtags

Hashtags :
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un expert en hashtags pour les réseaux sociaux."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=300
        )
        
        hashtags_text = response.choices[0].message.content.strip()
        
        # Extract hashtags from response
        import re
        hashtags = re.findall(r'#\w+', hashtags_text)
        
        # Limit to max hashtags
        return hashtags[:max_hashtags]
        
    except Exception as e:
        print(f"Error generating hashtags: {e}")
        # Fallback hashtags
        return [f"#{platform}", "#contenu", "#article", "#info"]

def generate_call_to_action(platform: str, language: str) -> str:
    """
    Generate a platform-specific call-to-action
    """
    ctas = {
        "instagram": {
            "fr": ["💭 Qu'en pensez-vous ?", "👉 Sauvegardez ce post !", "💬 Partagez votre avis en commentaire"],
            "en": ["💭 What do you think?", "👉 Save this post!", "💬 Share your thoughts below"]
        },
        "facebook": {
            "fr": ["Qu'en pensez-vous ? Partagez votre expérience !", "👍 Réagissez si vous êtes d'accord", "💬 Commentez pour continuer la discussion"],
            "en": ["What do you think? Share your experience!", "👍 React if you agree", "💬 Comment to continue the discussion"]
        },
        "linkedin": {
            "fr": ["Partagez votre perspective dans les commentaires.", "Qu'avez-vous appris de similaire ?", "Comment appliquez-vous cela dans votre domaine ?"],
            "en": ["Share your perspective in the comments.", "What similar insights have you learned?", "How do you apply this in your field?"]
        },
        "twitter": {
            "fr": ["Qu'en pensez-vous ? 🤔", "RT si vous êtes d'accord 🔄", "Votre avis ? 💭"],
            "en": ["What are your thoughts? 🤔", "RT if you agree 🔄", "Your take? 💭"]
        }
    }
    
    import random
    platform_ctas = ctas.get(platform, ctas["instagram"])
    language_ctas = platform_ctas.get(language, platform_ctas.get("fr", ["Qu'en pensez-vous ?"]))
    
    return random.choice(language_ctas)

def generate_post_image(bullet_points: List[str], platform: str, config: Dict, existing_image_path: str = None) -> str:
    """
    Generate a single image based on the single bullet point for social media posts
    If an existing image with logo is available, use it instead of generating a new one
    """
    try:
        # 🎯 PRIORITÉ : Utiliser l'image existante avec logo si disponible
        if existing_image_path and os.path.exists(existing_image_path):
            print(f"Using existing image with logo for {platform}: {existing_image_path}")
            
            # Copier l'image existante vers le dossier des posts sociaux
            output_path = f"cache/social_posts/{platform}_post_image.jpg"
            
            # Copier l'image avec logo vers le dossier des posts sociaux
            import shutil
            shutil.copy2(existing_image_path, output_path)
            
            print(f"✅ Image with logo copied for {platform}: {output_path}")
            return output_path
        
        # 🔄 FALLBACK : Générer une nouvelle image si aucune image avec logo n'existe
        print(f"No existing image with logo found, generating new image for {platform}")
        
        # Use the single bullet point (first and only one)
        main_content = bullet_points[0] if bullet_points else "Article content"
        
        # Create platform-specific image prompt for the bullet point
        image_prompt = create_comprehensive_image_prompt(main_content, platform)
        
        # Generate single image for the article
        output_path = f"cache/social_posts/{platform}_post_image.jpg"
        
        # Use existing image generation function
        from ..core.image_generator import generate_image_for_text
        generate_image_for_text(image_prompt, output_path)
        
        print(f"Generated new image for {platform} based on: {main_content[:50]}...")
        return output_path
        
    except Exception as e:
        print(f"Error generating image for {platform}: {e}")
        return None

def create_comprehensive_image_prompt(content: str, platform: str) -> str:
    """
    Create a comprehensive image prompt representing the entire article
    """
    platform_styles = {
        "instagram": "Modern, vibrant Instagram post with clean design and engaging visual elements",
        "facebook": "Professional Facebook post image with clear focal point and readable text overlay",
        "linkedin": "Business-appropriate LinkedIn image with professional colors and subtle branding",
        "twitter": "Eye-catching Twitter header image with concise visual message"
    }
    
    style = platform_styles.get(platform, platform_styles["instagram"])
    
    prompt = f"""
Create a {style} representing this article content: {content}

Style requirements:
- {style}
- High contrast for mobile viewing
- Minimal text overlay
- Professional photography style
- Optimized for {platform} format
- Single cohesive image representing the main theme
- Attractive and engaging for social media sharing
"""
    
    return prompt

def create_image_prompt_for_platform(content: str, platform: str) -> str:
    """
    Create platform-specific image generation prompts
    """
    platform_styles = {
        "instagram": "Modern, vibrant, mobile-friendly square image with bold colors and clean typography",
        "facebook": "Engaging landscape image with clear focal point and easy-to-read text overlay",
        "linkedin": "Professional, clean design with business-appropriate colors and subtle branding",
        "twitter": "Eye-catching header image with concise visual message and Twitter-appropriate dimensions"
    }
    
    style = platform_styles.get(platform, platform_styles["instagram"])
    
    prompt = f"""
Create a {style} representing: {content}

Style requirements:
- {style}
- High contrast for mobile viewing
- Minimal text overlay
- Professional photography style
- {PLATFORM_CONFIGS[platform]['image_format']} aspect ratio optimized
"""
    
    return prompt

# Main function to be called from the API
def create_social_media_posts(article_data: Dict[str, Any], 
                            platforms: List[str] = None, 
                            language: str = "fr",
                            skip_image_generation: bool = False) -> Dict[str, Any]:
    """
    Main function to create social media posts (replaces video generation)
    
    Args:
        article_data: The article data with bullet points
        platforms: List of platforms to generate posts for
        language: Language for the posts
        skip_image_generation: Whether to skip image generation
        
    Returns:
        Dictionary containing all generated posts
    """
    print("Starting social media post creation process...")
    print(f"Received data: {article_data}")
    
    # Ensure required directories exist
    os.makedirs("cache/social_posts/", exist_ok=True)
    os.makedirs("cache/img/", exist_ok=True)
    
    if not article_data or 'summary' not in article_data:
        print("Error: Invalid data format. 'summary' key missing.")
        return {"error": "Invalid article data"}
    
    # Generate posts for specified platforms
    posts = generate_social_posts(article_data, platforms, language)
    
    print("✅ Social media posts generated successfully!")
    return posts 