import os
from typing import Optional

class Config:
    """Configuration settings for the Article2Post API"""
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # CORS settings
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (alternative port)
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ]
    
    # Cache directories
    CACHE_DIR: str = "cache"
    CACHE_SUBDIRS: list = [
        "img", "aud", "clg", "vid", 
        "music", "custom", "uploads"
    ]
    
    # Music API settings
    JAMENDO_CLIENT_ID: str = "aa4f5a9d"
    JAMENDO_CLIENT_SECRET: str = "9b2368a20504b7429e01226578eac3d7"
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/gif"]
    
    # Video generation settings
    DEFAULT_LANGUAGE: str = "fr"
    DEFAULT_SLIDE_COUNT: int = 1
    DEFAULT_WORDS_PER_POINT: int = 20
    
    @classmethod
    def validate_api_keys(cls) -> bool:
        """Validate that required API keys are present"""
        missing_keys = []
        
        if not cls.OPENAI_API_KEY:
            missing_keys.append("OPENAI_API_KEY")
        if not cls.GEMINI_API_KEY:
            missing_keys.append("GEMINI_API_KEY")
            
        if missing_keys:
            print(f"Warning: Missing API keys: {', '.join(missing_keys)}")
            return False
        return True
    
    @classmethod
    def setup_directories(cls) -> None:
        """Create necessary cache directories"""
        for subdir in cls.CACHE_SUBDIRS:
            dir_path = os.path.join(cls.CACHE_DIR, subdir)
            os.makedirs(dir_path, exist_ok=True)
            print(f"Created directory: {dir_path}")

# Create global config instance
config = Config() 