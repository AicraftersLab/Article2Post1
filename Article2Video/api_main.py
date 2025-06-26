from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import uuid
import shutil
import tempfile
import json
from datetime import datetime
import logging
import re
import time
from PIL import Image
from io import BytesIO

# Import our existing modules
from services.web_scraper import scrape_text_from_url
from core.text_processor import clean_encoding_issues
from utils.json_utils import save_and_clean_json
from core.image_generator import generate_image_for_text, generate_images_for_bullet_points
from core.social_post_generator import create_social_media_posts, PLATFORM_CONFIGS
from core.logo_overlay import add_logo_to_image, save_logo, load_logo
from core.frame_overlay import apply_frame_with_text, save_frame, load_frame
from services.openai_client import summarize_with_openai, regenerate_bullet_point_with_openai
from config.config import config

# Simple cache management functions
def clear_cache():
    """Clear all cache files"""
    import shutil
    cache_dirs = ["cache/img", "cache/social_posts", "cache/custom"]
    for cache_dir in cache_dirs:
        if os.path.exists(cache_dir):
            try:
                for file in os.listdir(cache_dir):
                    if file.endswith(('.jpg', '.png', '.mp3', '.mp4')):
                        os.remove(os.path.join(cache_dir, file))
                logger.info(f"Cleared cache directory: {cache_dir}")
            except Exception as e:
                logger.error(f"Error clearing cache {cache_dir}: {e}")

def save_article_to_json(article_id, article_data):
    """Save article data to JSON file for image generation"""
    try:
        # Create the data structure for image generation
        image_data = {
            "article_id": article_id,
            "title": article_data["title"],
            "bullet_point": article_data["bullet_points"][0]["text"] if article_data["bullet_points"] else "",
            "full_summary": article_data.get("full_summary", ""),
            "full_text": article_data.get("full_text", ""),
            "tone": article_data.get("tone", "Neutral"),
            "created_at": article_data.get("created_at", datetime.now().isoformat()),
            "word_count": len(article_data["bullet_points"][0]["text"].split()) if article_data["bullet_points"] else 0
        }
        
        # Save to JSON file
        json_file_path = f"cache/articles_data.json"
        
        # Load existing data if file exists
        existing_data = {}
        if os.path.exists(json_file_path):
            try:
                with open(json_file_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load existing JSON data: {e}")
        
        # Add new article data
        existing_data[str(article_id)] = image_data
        
        # Save updated data
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Article {article_id} data saved to {json_file_path}")
        
    except Exception as e:
        logger.error(f"Error saving article to JSON: {e}")

def load_article_from_json(article_id):
    """Load article data from JSON file for image generation"""
    try:
        json_file_path = f"cache/articles_data.json"
        if not os.path.exists(json_file_path):
            return None
            
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return data.get(str(article_id))
        
    except Exception as e:
        logger.error(f"Error loading article from JSON: {e}")
        return None

def clear_cache_selective(article_id=None, bullet_point_ids=None):
    """Clear selective cache files for specific article or bullet points"""
    try:
        if article_id:
            # Clear files related to specific article
            cache_patterns = [
                f"cache/img/point_{article_id}_*.jpg",
                f"cache/social_posts/*_{article_id}_*.jpg"
            ]
            import glob
            for pattern in cache_patterns:
                for file in glob.glob(pattern):
                    os.remove(file)
                    logger.info(f"Removed cache file: {file}")
    except Exception as e:
        logger.error(f"Error in selective cache clear: {e}")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Article2Post API",
    description="Convert articles to optimized social media posts with AI-generated content",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (for generated videos, images, etc.)
if os.path.exists("cache"):
    app.mount("/static", StaticFiles(directory="cache"), name="static")

# Pydantic models for request/response
class ArticleProcessRequest(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None
    slide_count: int = 1
    words_per_point: int = 20
    language: str = "fr"

class ImageGenerationRequest(BaseModel):
    text: str
    bullet_point_id: Optional[str] = None

class BulletPoint(BaseModel):
    id: int
    text: str
    order: Optional[int] = None
    image_path: Optional[str] = None

class SocialPostGenerationRequest(BaseModel):
    article_id: int
    bullet_points: List[BulletPoint]
    platforms: List[str] = ["instagram", "facebook", "linkedin", "twitter"]
    language: str = "fr"
    skip_image_generation: bool = False

class SocialPost(BaseModel):
    platform: str
    caption: str
    hashtags: List[str]
    call_to_action: str
    image_path: Optional[str] = None
    character_count: int
    hashtag_count: int
    timestamp: float
    config_used: Optional[Dict[str, Any]] = None

class SocialPostResponse(BaseModel):
    id: int
    article_id: int
    status: str
    posts: Dict[str, SocialPost]
    download_urls: Optional[Dict[str, str]] = None

class ArticleResponse(BaseModel):
    id: int
    title: str
    summary: str
    bullet_points: List[BulletPoint]
    full_text: Optional[str] = None
    full_summary: Optional[str] = None

# Video response model removed - focusing on social posts only

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

class BulletPointUpdateRequest(BaseModel):
    text: str
    keywords: Optional[List[str]] = []

class BulletPointRegenerateRequest(BaseModel):
    article_id: int
    bullet_point_id: int
    language: str
    words_per_point: int
    context: Optional[str] = None

class BulletPointsRegenerateAllRequest(BaseModel):
    article_id: int
    slide_count: int = 1
    words_per_point: int = 20
    language: str = "fr"

class LogoUploadRequest(BaseModel):
    article_id: int
    logo_position: str = "top_right"  # top_right, top_left, bottom_right, bottom_left, center
    logo_size_width: Optional[int] = None  # If None, uses original logo size
    logo_size_height: Optional[int] = None  # If None, uses original logo size

class LogoResponse(BaseModel):
    status: str
    message: str
    logo_applied: bool
    image_path: Optional[str] = None

# 🎨 NOUVEAUX MODÈLES POUR LES FRAMES
class FrameUploadRequest(BaseModel):
    article_id: int
    bullet_point_text: str
    logo_position: str = "top_right"  # Position du logo sur le frame
    logo_size_width: Optional[int] = None
    logo_size_height: Optional[int] = None

class FrameResponse(BaseModel):
    status: str
    message: str
    frame_applied: bool
    logo_applied: bool
    image_path: Optional[str] = None
    text_content: Optional[str] = None
    text_lines: Optional[int] = None
    font_size: Optional[int] = None

# In-memory storage for development (replace with database in production)
articles_db: Dict[str, Dict[str, Any]] = {}  # Changed to string keys to match JSON
social_posts_db: Dict[int, Dict[str, Any]] = {}
next_article_id = 1
next_social_post_id = 1

def load_articles_from_json():
    """Load articles from JSON file into memory"""
    global articles_db
    try:
        if os.path.exists("articles_db.json"):
            with open("articles_db.json", "r", encoding="utf-8") as f:
                articles_db = json.load(f)
            logger.info(f"Loaded {len(articles_db)} articles from articles_db.json")
        else:
            logger.info("No articles_db.json found, starting with empty database")
    except Exception as e:
        logger.error(f"Error loading articles from JSON: {e}")
        articles_db = {}

# Set up environment and validate configuration
@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("Starting Article2SocialPost API...")
    
    # Set up directories
    config.setup_directories()
    
    # Load existing articles from JSON
    load_articles_from_json()
    
    # Set API keys as environment variables if they exist
    if config.OPENAI_API_KEY:
        os.environ["OPENAI_API_KEY"] = config.OPENAI_API_KEY
    if config.GEMINI_API_KEY:
        os.environ["GEMINI_API_KEY"] = config.GEMINI_API_KEY
    
    # Validate API keys
    if not config.validate_api_keys():
        logger.warning("Some API keys are missing. Functionality may be limited.")
    
    logger.info("Article2SocialPost API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources"""
    logger.info("Shutting down Article2SocialPost API...")

# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "Article2Post API is running", 
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "api_keys_configured": config.validate_api_keys()
    }

# Article processing endpoints
@app.post("/api/articles/process/", response_model=ArticleResponse)
def process_article_sync(request: ArticleProcessRequest):
    """
    Process an article from URL or text and generate bullet points.
    NOTE: This is a synchronous endpoint to avoid blocking the event loop.
    """
    global next_article_id
    
    try:
        logger.info(f"Processing article request: URL={bool(request.url)}, Text={bool(request.text)}")
        
        # Extract article content
        if request.url:
            logger.info(f"Scraping article from URL: {request.url}")
            raw_text = scrape_text_from_url(request.url)
            article_text = clean_encoding_issues(raw_text)
            title = f"Article from {request.url}"
        elif request.text:
            logger.info("Processing article from provided text")
            article_text = clean_encoding_issues(request.text)
            title = "User provided text"
        else:
            raise HTTPException(status_code=400, detail="Either URL or text must be provided")
        
        if not article_text.strip():
            raise HTTPException(status_code=400, detail="No content could be extracted from the article")
        
        logger.info(f"Article content length: {len(article_text)} characters")
        
        # Generate summary using OpenAI
        logger.info(f"Generating summary: {request.slide_count} slides, {request.words_per_point} words per slide, language: {request.language}")
        summary_data = summarize_with_openai(
            article_text, 
            request.language
        )
        
        if not summary_data or "bullet_point" not in summary_data:
            raise HTTPException(status_code=500, detail="Failed to generate article summary")
        
        # Create article record
        article_id = next_article_id
        next_article_id += 1
        
        # Create bullet point from the single bullet_point returned
        bullet_points_data = [{
            "id": 1,
            "text": summary_data.get("bullet_point", "No summary available"),
            "order": 1,
                "image_path": None,
                "audio_path": None
        }]

        # Create Pydantic models for the response
        bullet_point_models = [BulletPoint(**bp) for bp in bullet_points_data]

        # Store article
        article = {
            "id": article_id,
            "title": title,
            "summary": summary_data.get("bullet_point", "No summary available"),
            "bullet_points": bullet_points_data, # Store the structured data
            "full_text": article_text,
            "full_summary": summary_data.get("full_summary", ""),  # Store the complete article summary
            "tone": summary_data.get("tone", "Neutral"),
            "created_at": datetime.now().isoformat()
        }
        articles_db[str(article_id)] = article
        
        # Save article data to JSON file for image generation
        save_article_to_json(article_id, article)
        
        logger.info(f"Article processed successfully with ID: {article_id}")
        
        return ArticleResponse(
            id=article_id,
            title=article["title"],
            summary=article["summary"],
            bullet_points=bullet_point_models,
            full_text=article_text,
            full_summary=article.get("full_summary", "")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing article: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing article: {str(e)}")

@app.get("/api/articles/{article_id}/")
async def get_article(article_id: int):
    """Get a specific article by ID"""
    article_key = str(article_id)
    if article_key not in articles_db:
        raise HTTPException(status_code=404, detail="Article not found")
    
    article = articles_db[article_key]
    bullet_points = []
    
    # Handle both string and dictionary formats
    for i, bp in enumerate(article["bullet_points"]):
        if isinstance(bp, str):
            # Convert string to BulletPoint model
            bullet_points.append(BulletPoint(
                id=i+1, 
                text=bp, 
                order=i+1,
                image_path=None,
                audio_path=None
            ))
        else:
            # Convert dictionary to BulletPoint model
            bullet_points.append(BulletPoint(
                id=bp.get('id', i+1),
                text=bp.get('text', ''),
                order=bp.get('order', i+1),
                image_path=bp.get('image_path'),
                audio_path=bp.get('audio_path')
            ))
    
    return ArticleResponse(
        id=article["id"],
        title=article["title"],
        summary=article["summary"],
        bullet_points=bullet_points,
        full_text=article.get("full_text"),
        full_summary=article.get("full_summary", "")
    )

@app.get("/api/articles/")
async def get_articles():
    """Get all articles"""
    articles = []
    for article in articles_db.values():
        bullet_points = []
        
        # Handle both string and dictionary formats
        for i, bp in enumerate(article["bullet_points"]):
            if isinstance(bp, str):
                # Convert string to BulletPoint model
                bullet_points.append(BulletPoint(
                    id=i+1, 
                    text=bp, 
                    order=i+1,
                    image_path=None,
                    audio_path=None
                ))
            else:
                # Convert dictionary to BulletPoint model
                bullet_points.append(BulletPoint(
                    id=bp.get('id', i+1),
                    text=bp.get('text', ''),
                    order=bp.get('order', i+1),
                    image_path=bp.get('image_path'),
                    audio_path=bp.get('audio_path')
                ))
                
        articles.append(ArticleResponse(
            id=article["id"],
            title=article["title"],
            summary=article["summary"],
            bullet_points=bullet_points,
            full_text=article.get("full_text"),
            full_summary=article.get("full_summary", "")
        ))
    return articles

# Video generation removed - focusing on social media posts only

# Social Media Post generation endpoints
@app.post("/api/social-posts/generate/", response_model=SocialPostResponse)
async def generate_social_posts_endpoint(request: SocialPostGenerationRequest, background_tasks: BackgroundTasks):
    """
    Generate social media posts from article bullet points.
    This is an asynchronous operation.
    """
    global next_social_post_id
    
    try:
        logger.info(f"Generating social posts for article {request.article_id}, platforms: {request.platforms}")
        
        # Validate that the article exists
        if request.article_id not in articles_db:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Validate platforms
        valid_platforms = list(PLATFORM_CONFIGS.keys())
        invalid_platforms = [p for p in request.platforms if p not in valid_platforms]
        if invalid_platforms:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid platforms: {invalid_platforms}. Valid platforms: {valid_platforms}"
            )
        
        # Create social post entry
        social_post_id = next_social_post_id
        next_social_post_id += 1
        
        social_posts_db[social_post_id] = {
            "id": social_post_id,
            "article_id": request.article_id,
            "status": "processing",
            "platforms": request.platforms,
            "created_at": datetime.now().isoformat(),
            "posts": {},
            "download_urls": {}
        }
        
        # Start background task for social post generation
        background_tasks.add_task(
            generate_social_posts_task,
            social_post_id=social_post_id,
            article_id=request.article_id,
            bullet_points=[bp.dict() for bp in request.bullet_points],
            platforms=request.platforms,
            language=request.language,
            skip_image_generation=request.skip_image_generation
        )
        
        return SocialPostResponse(
            id=social_post_id,
            article_id=request.article_id,
            status="processing",
            posts={},
            download_urls=None
        )
        
    except Exception as e:
        logger.error(f"Error starting social post generation: {e}")
        raise HTTPException(status_code=500, detail=f"Error starting social post generation: {str(e)}")

async def generate_social_posts_task(social_post_id: int, article_id: int, 
                                   bullet_points: List[Dict[str, Any]], platforms: List[str],
                                   language: str, skip_image_generation: bool = False):
    """
    Background task for generating social media posts
    """
    try:
        logger.info(f"Starting social post generation task for social_post_id: {social_post_id}")
        
        # Get article data
        article = articles_db[article_id]
        
        # Prepare article data for social post generation
        article_data = {
            "summary": [bp['text'] for bp in bullet_points],
            "full_text": article.get("full_text", ""),
            "title": article.get("title", "")
        }
        
        # Generate social media posts
        posts_result = create_social_media_posts(
            article_data=article_data,
            platforms=platforms,
            language=language,
            skip_image_generation=skip_image_generation
        )
        
        # Process the results
        if "error" in posts_result:
            social_posts_db[social_post_id]["status"] = "failed"
            social_posts_db[social_post_id]["error"] = posts_result["error"]
            return
        
        # Convert to SocialPost models and update database
        formatted_posts = {}
        download_urls = {}
        
        for platform, post_data in posts_result.items():
            if "error" in post_data:
                logger.error(f"Error generating post for {platform}: {post_data['error']}")
                continue
                
            formatted_posts[platform] = SocialPost(
                platform=post_data["platform"],
                caption=post_data["caption"],
                hashtags=post_data["hashtags"],
                call_to_action=post_data["call_to_action"],
                image_path=post_data.get("image_path"),
                character_count=post_data["character_count"],
                hashtag_count=post_data["hashtag_count"],
                timestamp=post_data["timestamp"],
                config_used=post_data.get("config_used")
            )
            
            # Create download URL for the post image if it exists
            if post_data.get("image_path"):
                download_urls[platform] = f"/api/social-posts/{social_post_id}/download/{platform}/"
        
        # Update the database
        social_posts_db[social_post_id].update({
                    "status": "completed",
            "posts": {platform: post.dict() for platform, post in formatted_posts.items()},
            "download_urls": download_urls
        })
        
        logger.info(f"Social post generation completed for social_post_id: {social_post_id}")
            
    except Exception as e:
        logger.error(f"Error in social post generation task: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        social_posts_db[social_post_id]["status"] = "failed"
        social_posts_db[social_post_id]["error"] = str(e)

@app.get("/api/social-posts/{social_post_id}/")
async def get_social_post(social_post_id: int):
    """Get social post status and details"""
    if social_post_id not in social_posts_db:
        raise HTTPException(status_code=404, detail="Social post not found")
    
    social_post = social_posts_db[social_post_id]
    
    # Convert posts data back to SocialPost models for response
    formatted_posts = {}
    for platform, post_data in social_post.get("posts", {}).items():
        formatted_posts[platform] = SocialPost(**post_data)
    
    return SocialPostResponse(
        id=social_post["id"],
        article_id=social_post["article_id"],
        status=social_post["status"],
        posts=formatted_posts,
        download_urls=social_post.get("download_urls")
    )

@app.get("/api/social-posts/{social_post_id}/download/{platform}/")
async def download_social_post_image(social_post_id: int, platform: str):
    """Download generated social post image"""
    if social_post_id not in social_posts_db:
        raise HTTPException(status_code=404, detail="Social post not found")
    
    social_post = social_posts_db[social_post_id]
    if social_post["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Social post not ready for download. Status: {social_post['status']}")
    
    posts = social_post.get("posts", {})
    if platform not in posts:
        raise HTTPException(status_code=404, detail=f"Platform {platform} not found in social post")
    
    image_path = posts[platform].get("image_path")
    if not image_path:
        raise HTTPException(status_code=404, detail=f"No image available for platform {platform}")
    
    abs_image_path = os.path.abspath(image_path)
    if not os.path.exists(abs_image_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(
        path=abs_image_path,
        media_type='image/jpeg',
        filename=f"social_post_{platform}_{social_post['article_id']}.jpg"
    )

@app.get("/api/platforms/")
async def get_available_platforms():
    """Get list of available social media platforms and their configurations"""
    return {
        "platforms": list(PLATFORM_CONFIGS.keys()),
        "configs": PLATFORM_CONFIGS
    }

# Image generation endpoints
@app.post("/api/images/generate/")
def generate_image(request: ImageGenerationRequest):
    """
    Generate an image for a given text, ensuring the correct naming convention.
    """
    try:
        logger.info(f"Received request to generate image for text: '{request.text[:50]}...' with bullet_point_id: {request.bullet_point_id}")
        
        # Validate that text is not empty
        if not request.text or not request.text.strip():
            logger.error("Empty or whitespace-only text provided for image generation")
            raise HTTPException(status_code=422, detail="Text field cannot be empty or contain only whitespace")
        
        output_filename = None
        bp_id_int = None

        if request.bullet_point_id:
            try:
                # The ID from the frontend is the correct index for the bullet point
                bp_id_int = int(request.bullet_point_id)
                # Use the standardized naming convention: point_XX.jpg
                output_filename = f"cache/img/point_{bp_id_int:02d}.jpg"
                logger.info(f"Using standardized filename for regenerated image: {output_filename}")
            except (ValueError, TypeError) as e:
                logger.warning(f"Could not parse bullet_point_id '{request.bullet_point_id}': {e}. A hash-based filename will be used instead.")
        
        # Call the image generator, forcing regeneration with the correct filename
        result_path = generate_image_for_text(
            text=request.text,
            output_file=output_filename,  # Pass the specific, correct filename
            index=bp_id_int,             # Pass the index as a fallback
            force_regenerate=True
        )
        
        # Double-check that the result path uses the correct naming convention
        if bp_id_int:
            # Fix the path if it doesn't match our convention
            correct_path = os.path.join("cache/img", f"point_{bp_id_int:02d}.jpg")
            if os.path.exists(result_path) and result_path != correct_path:
                try:
                    # Rename the file to follow our convention
                    shutil.copy(result_path, correct_path)
                    os.remove(result_path)
                    result_path = correct_path
                    logger.info(f"Renamed image file to follow naming convention: {result_path}")
                except Exception as rename_error:
                    logger.error(f"Error renaming image file: {rename_error}")
        
        # CRITICAL FIX: Update the database with the image path
        if bp_id_int and result_path and os.path.exists(result_path):
            # Find the article that contains this bullet point
            for article_id, article_data in articles_db.items():
                bullet_points = article_data.get("bullet_points", [])
                
                # Convert bullet points to dictionary format if they're strings
                for i, bp in enumerate(bullet_points):
                    if isinstance(bp, str):
                        bullet_points[i] = {
                            'id': i + 1,
                            'text': bp,
                            'order': i + 1,
                            'image_path': None,
                            'audio_path': None
                        }
                
                # Update the specific bullet point with the image path
                for bp in bullet_points:
                    if isinstance(bp, dict) and bp.get('id') == bp_id_int:
                        bp['image_path'] = os.path.basename(result_path)  # Store just the filename
                        logger.info(f"Updated database: bullet point {bp_id_int} in article {article_id} now has image_path: {bp['image_path']}")
                        break
                
                # Save the updated article data
                save_article_to_json(article_id, article_data)
        
        # The result_path is the full path; we need to return a URL path for the frontend
        image_url_path = os.path.basename(result_path)
        
        logger.info(f"Image regenerated and saved to: {result_path}")
        
        return JSONResponse(content={
            "message": "Image generated successfully",
            "image_url": f"/static/img/{image_url_path}"
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /images/generate/ endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {str(e)}")

@app.get("/api/images/bullet-point/{bullet_point_id}/")
async def get_image_for_bullet_point(bullet_point_id: str):
    """Get image for a specific bullet point"""
    # Check if we have a cached image for this bullet point
    image_path = f"cache/clg/point_{bullet_point_id}.jpg"
    
    if os.path.exists(image_path):
        return {
            "image_url": f"/static/clg/point_{bullet_point_id}.jpg",
            "image_id": bullet_point_id
        }
    else:
        # Generate placeholder image URL using picsum
        return {
            "image_url": f"https://picsum.photos/seed/{bullet_point_id}/800/450",
            "image_id": bullet_point_id
        }

# Bullet Point Management endpoints
@app.put("/api/articles/{article_id}/bullet-points/{bullet_point_id}/")
async def update_bullet_point(article_id: int, bullet_point_id: int, request: BulletPointUpdateRequest):
    """
    Update the text of a specific bullet point.
    """
    try:
        if article_id not in articles_db:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article = articles_db[article_id]
        bullet_points = article["bullet_points"]
        
        # Check if bullet point exists (1-indexed)
        if bullet_point_id < 1 or bullet_point_id > len(bullet_points):
            raise HTTPException(status_code=404, detail="Bullet point not found")
        
        # Convert bullet points to dictionary format if they're strings
        for i, bp in enumerate(bullet_points):
            if isinstance(bp, str):
                # Convert string to dictionary
                bullet_points[i] = {
                    'id': i + 1,
                    'text': bp,
                    'order': i + 1,
                    'image_path': None,
                    'audio_path': None
                }
        
        # Update the bullet point text (convert to 0-indexed)
        # The text should already contain quotes for highlighted words from the frontend
        idx = bullet_point_id - 1
        if isinstance(bullet_points[idx], dict):
            bullet_points[idx]['text'] = request.text
            bullet_points[idx]['image_path'] = None  # Reset image path when text changes
        else:
            bullet_points[idx] = request.text
        
        logger.info(f"Updated bullet point {bullet_point_id} for article {article_id}: {request.text}")
        
        return {"message": "Bullet point updated successfully", "new_text": request.text}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating bullet point: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating bullet point: {str(e)}")

@app.post("/api/articles/{article_id}/bullet-points/{bullet_point_id}/regenerate/")
async def regenerate_bullet_point(article_id: int, bullet_point_id: int, request: BulletPointRegenerateRequest):
    """Regenerate a specific bullet point using OpenAI"""
    try:
        if article_id not in articles_db:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article = articles_db[article_id]
        
        # Handle both string and dictionary formats for bullet points
        bullet_points = article['bullet_points']
        
        # Convert bullet points to dictionary format if they're strings
        structured_bullet_points = []
        for i, bp in enumerate(bullet_points):
            if isinstance(bp, str):
                # Convert string to dictionary
                structured_bullet_points.append({
                    'id': i + 1,
                    'text': bp,
                    'order': i + 1,
                    'image_path': None,
                    'audio_path': None
                })
            else:
                # Already a dictionary
                structured_bullet_points.append(bp)
        
        # Replace the original bullet points with the structured version
        article['bullet_points'] = structured_bullet_points
        
        # Find the bullet point to regenerate
        target_bullet_point = None
        for bp in structured_bullet_points:
            if bp['id'] == bullet_point_id:
                target_bullet_point = bp
                break
        
        if not target_bullet_point:
            raise HTTPException(status_code=404, detail=f"Bullet point with ID {bullet_point_id} not found")
        
        # Get the original text
        original_text = target_bullet_point['text']
        
        # Get context from either the request or the article's full text
        context = request.context
        if not context:
            context = article.get("full_text", "")
        
        # Call the new specific OpenAI function for regeneration
        new_text = regenerate_bullet_point_with_openai(
            original_text=original_text,
            context=context,
            language=request.language,
            words_per_point=request.words_per_point
        )

        if not new_text or not isinstance(new_text, str):
            raise HTTPException(status_code=500, detail="Failed to regenerate bullet point content from OpenAI.")

        # Update the bullet point text in our "database"
        target_bullet_point["text"] = new_text

        # Clear associated cached files (image, audio) for this bullet point
        clear_cache_selective(article_id, [bullet_point_id])
        # Also remove any custom uploaded image association
        target_bullet_point["image_path"] = None
        
        # Save the updated article data back to the 'DB'
        save_and_clean_json(articles_db, 'articles_db.json')

        return JSONResponse(content={"message": "Bullet point regenerated successfully", "new_text": new_text}, status_code=200)

    except Exception as e:
        logger.error(f"Error regenerating bullet point: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/articles/{article_id}/bullet-points/{bullet_point_id}/upload-image/")
async def upload_bullet_point_image(article_id: int, bullet_point_id: int, file: UploadFile = File(...)):
    """
    Uploads an image for a specific bullet point, replacing the existing one.
    Processes the image to match the dimensions and format of AI-generated images.
    The uploaded image will be saved as point_XX.jpg in cache/img/ directory.
    """
    try:
        # Validate article and bullet point existence
        if article_id not in articles_db:
            raise HTTPException(status_code=404, detail=f"Article with id {article_id} not found.")

        article = articles_db[article_id]
        
        # Handle both string and dictionary formats for bullet points
        bullet_points = article['bullet_points']
        
        # Convert bullet points to dictionary format if they're strings
        structured_bullet_points = []
        for i, bp in enumerate(bullet_points):
            if isinstance(bp, str):
                # Convert string to dictionary
                structured_bullet_points.append({
                    'id': i + 1,
                    'text': bp,
                    'order': i + 1,
                    'image_path': None,
                    'audio_path': None
                })
            else:
                # Already a dictionary
                structured_bullet_points.append(bp)
        
        # Replace the original bullet points with the structured version
        article['bullet_points'] = structured_bullet_points
        
        # Find the bullet point to update
        bullet_point_to_update = None
        for bp in structured_bullet_points:
            if bp['id'] == bullet_point_id:
                bullet_point_to_update = bp
                break
        
        if not bullet_point_to_update:
            raise HTTPException(status_code=404, detail=f"Bullet point with id {bullet_point_id} not found in article {article_id}.")

        # Use the new naming convention for the uploaded image
        # Format: point_XX.jpg where XX is the zero-padded bullet point ID
        filename = f"point_{bullet_point_id:02d}.jpg"
        save_locations = [
            os.path.join("cache", "img", filename),
            os.path.join("Article2Video", "cache", "img", filename),
            os.path.join("static", "img", filename)
        ]
        
        # Create directories if they don't exist
        for file_path in save_locations:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Read the file content once
        file_content = await file.read()
        
        # Process the image to match generated image dimensions
        try:
            from PIL import Image
            from io import BytesIO
            
            # Open the uploaded image
            image = Image.open(BytesIO(file_content))
            
            # Define target dimensions (same as generated images) - landscape format
            target_width = 1920
            target_height = 1080
            
            # Calculate dimensions to maintain aspect ratio
            original_aspect = image.width / image.height
            target_aspect = target_width / target_height
            
            if original_aspect > target_aspect:
                # Original image is wider than target
                new_width = int(target_height * original_aspect)
                new_height = target_height
                image = image.resize((new_width, new_height))
                left = (new_width - target_width) // 2
                image = image.crop((left, 0, left + target_width, target_height))
            else:
                # Original image is taller than target
                new_height = int(target_width / original_aspect)
                new_width = target_width
                image = image.resize((new_width, new_height))
                top = (new_height - target_height) // 2
                image = image.crop((0, top, target_width, top + target_height))
            
            # Convert to RGB if needed (for PNG with transparency)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Save the processed image to a BytesIO object
            processed_image = BytesIO()
            image.save(processed_image, format='JPEG', quality=95)
            processed_image.seek(0)
            file_content = processed_image.read()
            
            logger.info(f"Successfully processed uploaded image to {target_width}x{target_height}")
        except Exception as e:
            logger.warning(f"Error processing image: {e}. Using original image.")
        
        # Save the processed image to all required locations
        for file_path in save_locations:
            try:
                with open(file_path, "wb") as buffer:
                    buffer.write(file_content)
                logger.info(f"Saved uploaded image to {file_path}")
            except Exception as e:
                logger.warning(f"Failed to save to {file_path}: {e}")
        
        # Update the image path in the article data with the new naming convention
        bullet_point_to_update['image_path'] = filename

        # Save the updated article data back to the 'DB'
        save_and_clean_json(articles_db, 'articles_db.json')

        return JSONResponse(content={
            "message": "Image uploaded successfully", 
            "image_path": filename
        }, status_code=200)

    except HTTPException as http_exc:
        raise http_exc # Re-raise HTTPException to keep status code and detail
    except Exception as e:
        logger.error(f"Error uploading image for bullet point: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.delete("/api/articles/{article_id}/bullet-points/{bullet_point_id}/delete-image/")
async def delete_bullet_point_image(article_id: int, bullet_point_id: int):
    """
    Delete the image file for a specific bullet point and clear its image_path.
    """
    try:
        if article_id not in articles_db:
            raise HTTPException(status_code=404, detail=f"Article with id {article_id} not found.")
        article = articles_db[article_id]
        bullet_points = article['bullet_points']
        # Find the bullet point
        bullet_point = None
        for bp in bullet_points:
            if bp['id'] == bullet_point_id:
                bullet_point = bp
                break
        if not bullet_point:
            raise HTTPException(status_code=404, detail=f"Bullet point with id {bullet_point_id} not found.")
        # Determine the filename
        filename = f"point_{bullet_point_id:02d}.jpg"
        deleted = False
        for folder in ["cache/img", "static/img", "Article2Video/cache/img", "Article2Video/static/img"]:
            file_path = os.path.join(folder, filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    deleted = True
                except Exception as e:
                    pass
        # Clear the image_path
        bullet_point['image_path'] = ''
        save_and_clean_json(articles_db, 'articles_db.json')
        return {"message": "Image deleted successfully", "deleted": deleted}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

@app.post("/api/articles/{article_id}/bullet-points/regenerate-all/")
async def regenerate_all_bullet_points(article_id: int, request: BulletPointsRegenerateAllRequest):
    """Regenerate all bullet points for an article"""
    try:
        if article_id not in articles_db:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article = articles_db[article_id]
        article_text = article.get("full_text", "")
        
        if not article_text:
            raise HTTPException(status_code=400, detail="No article text available for regeneration")
        
        # Use the same summarization logic as the original article processing
        logger.info(f"Regenerating all bullet points for article {article_id}")
        summary_data = summarize_with_openai(
            article_text, 
            request.language
        )
        
        if not summary_data or "bullet_point" not in summary_data:
            raise HTTPException(status_code=500, detail="Failed to regenerate bullet points")
        
        # Update the article with new bullet point
        article["bullet_points"] = [{
            "id": 1,
            "text": summary_data.get("bullet_point", "No summary available"),
            "order": 1,
            "image_path": None,
            "audio_path": None
        }]
        
        # Convert to response format
        bullet_points = [BulletPoint(
            id=1,
            text=summary_data.get("bullet_point", "No summary available"),
            order=1
        )]
        
        logger.info(f"Successfully regenerated {len(bullet_points)} bullet points for article {article_id}")
        
        return {
            "article_id": article_id,
            "bullet_points": bullet_points,
            "count": len(bullet_points)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating all bullet points: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error regenerating all bullet points: {str(e)}")

@app.get("/api/articles/{article_id}/keywords/")
async def extract_keywords(article_id: int):
    """Extract potential keywords from article for highlighting"""
    try:
        if article_id not in articles_db:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article = articles_db[article_id]
        article_text = article.get("full_text", "")
        
        if not article_text:
            return {"keywords": []}
        
        # Simple keyword extraction - you can enhance this with NLP libraries
        from collections import Counter
        
        # Extract words (remove common stop words)
        stop_words = {
            'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
            'ce', 'cette', 'ces', 'cet', 'il', 'elle', 'ils', 'elles', 'on', 'nous', 'vous', 'je', 'tu',
            'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur', 'leurs',
            'qui', 'que', 'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi', 'combien',
            'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'vers', 'chez', 'entre', 'parmi',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'
        }
        
        # Extract words and filter
        words = re.findall(r'\b[A-Za-zÀ-ÿ]{3,}\b', article_text.lower())
        filtered_words = [word for word in words if word not in stop_words]
        
        # Get most common words
        word_counts = Counter(filtered_words)
        common_words = [word for word, count in word_counts.most_common(20) if count > 1]
        
        # Extract quoted phrases (already highlighted content)
        quoted_phrases = re.findall(r'"([^"]+)"', article_text)
        
        # Combine and deduplicate
        all_keywords = list(set(common_words + quoted_phrases))
        
        return {"keywords": all_keywords[:30]}  # Limit to 30 keywords
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting keywords: {str(e)}")

# Music API endpoints removed - focusing on social media posts only

# File upload endpoints
@app.post("/api/uploads/image/")
async def upload_image(file: UploadFile = File(...), purpose: str = Form(...)):
    """Upload custom images (logo, outro, frame)"""
    try:
        logger.info(f"Uploading image for purpose: {purpose}")
        
        # Validate purpose
        valid_purposes = ["logo", "outro", "frame", "slide"]
        if purpose not in valid_purposes:
            raise HTTPException(status_code=400, detail=f"Invalid purpose. Must be one of: {valid_purposes}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size
        file_content = await file.read()
        if len(file_content) > config.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {config.MAX_FILE_SIZE} bytes")
        
        # Save file
        filename = f"{purpose}.png"
        file_path = f"cache/custom/{filename}"
        
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        logger.info(f"Image uploaded successfully: {file_path}")
        return {
            "file_url": f"/static/custom/{filename}",
            "file_id": f"{purpose}_{uuid.uuid4()}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

# Utility endpoints
@app.post("/api/cache/clear/")
async def clear_cache_endpoint():
    """Clear the application cache"""
    try:
        clear_cache()
        return {"status": "success", "message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {str(e)}")

# ==========================================
# LOGO MANAGEMENT ENDPOINTS
# ==========================================

@app.post("/api/logo/upload/")
async def upload_logo(file: UploadFile = File(...)):
    """Upload and save a logo for persistent use"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        contents = await file.read()
        logo_image = Image.open(BytesIO(contents))
        
        # Save as persistent logo
        success = save_logo(logo_image)
        
        if success:
            return {
                "status": "success",
                "message": "Logo uploaded and saved successfully",
                "filename": file.filename
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save logo")
            
    except Exception as e:
        logger.error(f"Error uploading logo: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading logo: {str(e)}")

@app.get("/api/logo/current/")
async def get_current_logo():
    """Get information about the current persistent logo"""
    try:
        logo = load_logo()
        
        if logo:
            return {
                "status": "success",
                "has_logo": True,
                "logo_size": logo.size,
                "message": "Persistent logo found"
            }
        else:
            return {
                "status": "success",
                "has_logo": False,
                "message": "No persistent logo found"
            }
            
    except Exception as e:
        logger.error(f"Error checking logo: {e}")
        raise HTTPException(status_code=500, detail=f"Error checking logo: {str(e)}")

@app.post("/api/logo/apply/{article_id}/")
async def apply_logo_to_article(
    article_id: int,
    request: LogoUploadRequest
):
    """Apply logo to article image"""
    logger.info(f"Applying logo to article {article_id}")
    
    try:
        # 🎯 VÉRIFICATION PRÉALABLE : S'assurer qu'une image existe
        image_path = None
        
        # 1. Chercher l'image dans l'article demandé
        if str(article_id) in articles_db:
            article = articles_db[str(article_id)]
            if "bullet_points" in article:
                for bullet_point in article["bullet_points"]:
                    if bullet_point.get("image_path") and os.path.exists(bullet_point["image_path"]):
                        image_path = bullet_point["image_path"]
                        logger.info(f"Found image for article {article_id}: {image_path}")
                        break
        
        # 2. Si pas d'image dans l'article demandé, chercher dans d'autres articles
        if not image_path:
            logger.info(f"No image found for article {article_id}, searching for any article with image...")
            for aid, article in articles_db.items():
                if "bullet_points" in article:
                    for bullet_point in article["bullet_points"]:
                        if bullet_point.get("image_path") and os.path.exists(bullet_point["image_path"]):
                            image_path = bullet_point["image_path"]
                            logger.info(f"Found alternative image from article {aid}: {image_path}")
                            break
                if image_path:
                    break
        
        # 3. Si toujours pas d'image, vérifier les images dans le cache
        if not image_path:
            cache_img_dir = "cache/img"
            if os.path.exists(cache_img_dir):
                for img_file in os.listdir(cache_img_dir):
                    if img_file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        potential_path = os.path.join(cache_img_dir, img_file)
                        if os.path.exists(potential_path):
                            image_path = potential_path
                            logger.info(f"Found image in cache: {image_path}")
                            break
        
        # 4. Si aucune image n'existe, retourner une erreur claire
        if not image_path:
            error_msg = (
                f"❌ ERREUR : Aucune image trouvée pour appliquer le logo.\n"
                f"🔧 SOLUTION : Générez d'abord une image pour l'article {article_id} "
                f"avant d'essayer d'appliquer un logo.\n"
                f"📝 ÉTAPES À SUIVRE :\n"
                f"   1. Retournez à l'étape de génération d'image\n"
                f"   2. Cliquez sur 'Générer l'image'\n"
                f"   3. Attendez que l'image soit complètement générée\n"
                f"   4. Puis revenez appliquer le logo"
            )
            logger.warning(error_msg)
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "NO_IMAGE_FOUND",
                    "message": error_msg,
                    "article_id": article_id,
                    "solution": "Generate image first, then apply logo"
                }
            )
        
        # 5. Appliquer le logo sur l'image trouvée
        logo_size = None
        if request.logo_size_width and request.logo_size_height:
            logo_size = (request.logo_size_width, request.logo_size_height)
        
        result = add_logo_to_image(
            image_path=image_path,
            logo_size=logo_size,
            position=request.logo_position
        )
        
        if result["status"] != "success":
            raise HTTPException(status_code=500, detail=result["message"])
        
        result_path = result["output_path"]
        
        # 6. Mettre à jour la base de données avec le chemin de l'image avec logo
        if str(article_id) in articles_db:
            article = articles_db[str(article_id)]
            if "bullet_points" in article:
                for bullet_point in article["bullet_points"]:
                    bullet_point["image_path"] = result_path
            
            # Sauvegarder les changements
            save_article_to_json(article_id, article)
        
        logger.info(f"Logo applied successfully to {result_path}")
        return {
            "success": True,
            "message": f"Logo appliqué avec succès sur l'image",
            "image_path": result_path,
            "article_id": article_id,
            "position": request.logo_position
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (comme NO_IMAGE_FOUND)
        raise
    except Exception as e:
        logger.error(f"Error applying logo: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "LOGO_APPLICATION_FAILED",
                "message": f"Erreur lors de l'application du logo: {str(e)}",
                "article_id": article_id
            }
        )

@app.delete("/api/logo/remove/")
async def remove_persistent_logo():
    """Remove the persistent logo"""
    try:
        logo_path = "cache/persistent_logo.png"
        if os.path.exists(logo_path):
            os.remove(logo_path)
            return {
                "status": "success",
                "message": "Persistent logo removed successfully"
            }
        else:
            return {
                "status": "success",
                "message": "No persistent logo to remove"
            }
            
    except Exception as e:
        logger.error(f"Error removing logo: {e}")
        raise HTTPException(status_code=500, detail=f"Error removing logo: {str(e)}")

# 🎨 NOUVEAUX ENDPOINTS POUR LES FRAMES

@app.post("/api/frame/upload/")
async def upload_frame(file: UploadFile = File(...)):
    """Upload and save a frame for future use"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process the frame
        frame_data = await file.read()
        frame_image = Image.open(BytesIO(frame_data))
        
        # Save persistent frame
        success = save_frame(frame_image)
        
        if success:
            return {
                "status": "success",
                "message": "Frame uploaded and saved successfully",
                "filename": file.filename,
                "size": frame_image.size
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save frame")
            
    except Exception as e:
        logger.error(f"Error uploading frame: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading frame: {str(e)}")

@app.get("/api/frame/current/")
async def get_current_frame():
    """Get information about the current persistent frame"""
    try:
        frame = load_frame()
        
        if frame:
            return {
                "status": "success",
                "message": "Frame found",
                "has_frame": True,
                "size": frame.size,
                "path": "cache/frame.png"
            }
        else:
            return {
                "status": "success",
                "message": "No frame found",
                "has_frame": False
            }
            
    except Exception as e:
        logger.error(f"Error getting frame info: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting frame info: {str(e)}")

@app.post("/api/frame/apply/{article_id}/", response_model=FrameResponse)
async def apply_frame_to_article(
    article_id: int,
    request: FrameUploadRequest
):
    """Apply frame with text and logo to an article's image (AUTOMATIQUE)"""
    try:
        logger.info(f"🎨 Application frame intelligent pour article {article_id}")
        
        # 1. Récupérer les données complètes de l'article
        article_data = None
        if str(article_id) in articles_db:
            article_data = articles_db[str(article_id)]
            logger.info(f"📄 Article trouvé: {article_data.get('title', 'Sans titre')}")
        
        # 2. Trouver l'image de l'article (même logique que pour le logo)
        image_path = None
        
        if str(article_id) in articles_db:
            article = articles_db[str(article_id)]
            if "bullet_points" in article:
                for bullet_point in article["bullet_points"]:
                    if bullet_point.get("image_path") and os.path.exists(bullet_point["image_path"]):
                        image_path = bullet_point["image_path"]
                        logger.info(f"Found image for article {article_id}: {image_path}")
                        break
        
        # 3. Si pas d'image dans l'article demandé, chercher dans d'autres articles
        if not image_path:
            logger.info(f"No image found for article {article_id}, searching for any article with image...")
            for aid, article in articles_db.items():
                if "bullet_points" in article:
                    for bullet_point in article["bullet_points"]:
                        if bullet_point.get("image_path") and os.path.exists(bullet_point["image_path"]):
                            image_path = bullet_point["image_path"]
                            logger.info(f"Found alternative image from article {aid}: {image_path}")
                            break
                if image_path:
                    break
        
        # 4. Si toujours pas d'image, vérifier les images dans le cache
        if not image_path:
            cache_img_dir = "cache/img"
            if os.path.exists(cache_img_dir):
                for img_file in os.listdir(cache_img_dir):
                    if img_file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        potential_path = os.path.join(cache_img_dir, img_file)
                        if os.path.exists(potential_path):
                            image_path = potential_path
                            logger.info(f"Found image in cache: {image_path}")
                            break
        
        # 5. Si aucune image n'existe, retourner une erreur claire
        if not image_path:
            error_msg = (
                f"❌ ERREUR : Aucune image trouvée pour appliquer le frame.\n"
                f"🔧 SOLUTION : Générez d'abord une image pour l'article {article_id} "
                f"avant d'essayer d'appliquer un frame.\n"
                f"📝 ÉTAPES À SUIVRE :\n"
                f"   1. Retournez à l'étape de génération d'image\n"
                f"   2. Cliquez sur 'Générer l'image'\n"
                f"   3. Attendez que l'image soit complètement générée\n"
                f"   4. Puis revenez appliquer le frame"
            )
            logger.warning(error_msg)
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "NO_IMAGE_FOUND",
                    "message": error_msg,
                    "article_id": article_id,
                    "solution": "Generate image first, then apply frame"
                }
            )
        
        # 6. 🎨 UTILISATION DU SYSTÈME INTELLIGENT
        from core.logo_overlay import logo_overlay
        
        logo_size = None
        if request.logo_size_width and request.logo_size_height:
            logo_size = (request.logo_size_width, request.logo_size_height)
        
        # 🎨 NOUVEAU : Passer les données de l'article pour génération automatique
        logger.info("🤖 Utilisation du système de frame intelligent automatique")
        
        # Le texte sera automatiquement extrait des bullet points si non fourni
        bullet_text = request.bullet_point_text if request.bullet_point_text.strip() else None
        
        # Appliquer frame + logo en une seule opération AVEC INTELLIGENCE
        result = logo_overlay.apply_logo_and_frame(
            base_image_path=image_path,
            bullet_point_text=bullet_text,  # Peut être None pour auto-extraction
            logo_size=logo_size,
            position=request.logo_position,
            article_data=article_data  # 🎨 DONNÉES POUR GÉNÉRATION AUTOMATIQUE
        )
        
        if result["status"] != "success":
            raise HTTPException(status_code=500, detail=result["message"])
        
        result_path = result["output_path"]
        
        # 7. Mettre à jour la base de données avec le chemin de l'image avec frame + logo
        if str(article_id) in articles_db:
            article = articles_db[str(article_id)]
            if "bullet_points" in article:
                for bullet_point in article["bullet_points"]:
                    bullet_point["image_path"] = result_path
            
            # Sauvegarder les changements
            save_article_to_json(article_id, article)
        
        # 8. Informations sur le frame intelligent utilisé
        smart_frame_info = ""
        if result.get("frame_result", {}).get("smart_frame_used"):
            detected_category = "société"  # Sera détecté automatiquement
            smart_frame_info = f" (Frame intelligent généré - Catégorie: {detected_category})"
        
        logger.info(f"✅ Frame intelligent + Logo appliqués avec succès à {result_path}{smart_frame_info}")
        
        return FrameResponse(
            status="success",
            message=f"Frame intelligent avec texte et logo appliqués avec succès{smart_frame_info}",
            frame_applied=True,
            logo_applied=True,
            image_path=result_path,
            text_content=result.get("text_content"),
            text_lines=result.get("frame_result", {}).get("text_lines"),
            font_size=result.get("frame_result", {}).get("font_size")
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error applying intelligent frame: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "SMART_FRAME_APPLICATION_FAILED",
                "message": f"Erreur lors de l'application du frame intelligent: {str(e)}",
                "article_id": article_id
            }
        )

@app.delete("/api/frame/remove/")
async def remove_persistent_frame():
    """Remove the persistent frame"""
    try:
        frame_path = "cache/frame.png"
        if os.path.exists(frame_path):
            os.remove(frame_path)
            return {
                "status": "success",
                "message": "Persistent frame removed successfully"
            }
        else:
            return {
                "status": "success",
                "message": "No persistent frame to remove"
            }
            
    except Exception as e:
        logger.error(f"Error removing frame: {e}")
        raise HTTPException(status_code=500, detail=f"Error removing frame: {str(e)}")

# Error handlers
from pydantic import ValidationError

@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "body": str(exc.body) if hasattr(exc, 'body') else None
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

def update_video_status(video_id, status, message="", video_path=None):
    """
    Update the status of a video in the database.
    
    Args:
        video_id (int): ID of the video
        status (str): New status value
        message (str): Status message
        video_path (str): Path to the generated video file
    """
    try:
        if video_id in videos_db:
            videos_db[video_id]["status"] = status
            videos_db[video_id]["message"] = message
            videos_db[video_id]["updated_at"] = datetime.now().isoformat()
            
            # Update the video path if provided
            if video_path:
                videos_db[video_id]["video_path"] = video_path
                
            logger.info(f"Video {video_id} status updated to {status}: {message}")
            
            # If the video is completed, update the download URL
            if status.lower() == "completed" and video_path:
                relative_path = video_path.replace("\\", "/")
                # Make sure the path is relative to the static directory
                if "cache/" in relative_path:
                    relative_path = relative_path.split("cache/")[1]
                videos_db[video_id]["download_url"] = f"/static/{relative_path}"
                logger.info(f"Video {video_id} download URL set to /static/{relative_path}")
        else:
            logger.warning(f"Attempted to update status for non-existent video ID: {video_id}")
    except Exception as e:
        logger.error(f"Error updating video status: {e}")

if __name__ == "__main__":
    import uvicorn
    
    # Reduce watchfiles logging noise
    logging.getLogger("watchfiles").setLevel(logging.WARNING)
    
    # Validate configuration before starting
    if not config.validate_api_keys():
        logger.warning("API keys not configured. Some functionality may be limited.")
    
    logger.info(f"Starting server on {config.HOST}:{config.PORT}")
    uvicorn.run(
        "api_main:app", 
        host=config.HOST, 
        port=config.PORT, 
        reload=config.DEBUG,  # Set to False to disable auto-reload and stop watchfiles messages
        log_level="info"
    ) 