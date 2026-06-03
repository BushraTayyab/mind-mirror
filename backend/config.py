import os
from dotenv import load_dotenv
from pathlib import Path
import json

# Load environment variables
load_dotenv()

class Config:
    """Central configuration management"""
    
    # API Security
    API_KEY = os.getenv("API_KEY", "")
    
    # CORS Configuration
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
    
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # Allowed HTTP methods
    ALLOWED_METHODS = ["GET", "POST", "OPTIONS"]
    
    # Allowed headers
    ALLOWED_HEADERS = [
        "Content-Type",
        "Authorization", 
        "Accept",
        "Origin",
        "X-Requested-With",
        "X-API-Key"
    ]
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.API_KEY:
            raise ValueError(
                "API_KEY not set in .env file. "
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        
        if not cls.ALLOWED_ORIGINS or cls.ALLOWED_ORIGINS == [""]:
            raise ValueError(
                "ALLOWED_ORIGINS not set in .env file. "
                "Add your extension ID and localhost origins."
            )
        
        # Filter out empty strings
        cls.ALLOWED_ORIGINS = [origin for origin in cls.ALLOWED_ORIGINS if origin]
        
        print(f"✅ Configuration loaded:")
        print(f"   - Environment: {cls.ENVIRONMENT}")
        print(f"   - Allowed origins: {len(cls.ALLOWED_ORIGINS)} origins")
        print(f"   - Rate limit: {cls.RATE_LIMIT_REQUESTS} requests/{cls.RATE_LIMIT_WINDOW}s")
    
    @classmethod
    def add_extension_origin(cls, extension_id):
        """Helper to add a new extension origin to .env"""
        origin = f"chrome-extension://{extension_id}"
        
        if origin not in cls.ALLOWED_ORIGINS:
            cls.ALLOWED_ORIGINS.append(origin)
            
            # Update .env file
            env_path = Path(".env")
            if env_path.exists():
                with open(env_path, "r") as f:
                    lines = f.readlines()
                
                for i, line in enumerate(lines):
                    if line.startswith("ALLOWED_ORIGINS="):
                        current = line.split("=", 1)[1].strip()
                        new_origins = f"{current},{origin}"
                        lines[i] = f"ALLOWED_ORIGINS={new_origins}\n"
                        break
                
                with open(env_path, "w") as f:
                    f.writelines(lines)
                
                print(f"✅ Added {origin} to .env")
                return True
        
        return False

# Validate configuration on import
Config.validate()