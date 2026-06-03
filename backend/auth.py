from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from collections import defaultdict
from time import time
from config import Config

# Initialize security
security = HTTPBearer(auto_error=False)

# Rate limiting storage
request_counts = defaultdict(list)

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify API key from Authorization header"""
    
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Please provide Authorization header with Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    api_key = credentials.credentials
    
    if api_key != Config.API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key. Access denied.",
        )
    
    return api_key

def verify_api_key_query(api_key: str = None):
    """Alternative: Verify API key from query parameter (for GET requests)"""
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Please provide ?api_key=your-key in URL",
        )
    
    if api_key != Config.API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key. Access denied.",
        )
    
    return api_key

def rate_limit(request: Request):
    """Rate limiting middleware"""
    client_ip = request.client.host if request.client else "unknown"
    now = time()
    
    # Clean old requests (older than window)
    client_requests = request_counts[client_ip]
    client_requests[:] = [t for t in client_requests if now - t < Config.RATE_LIMIT_WINDOW]
    
    # Check limit
    if len(client_requests) >= Config.RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {Config.RATE_LIMIT_REQUESTS} requests per {Config.RATE_LIMIT_WINDOW} seconds."
        )
    
    # Add current request
    client_requests.append(now)
    return True


def rotate_api_key():
    """Generate a new API key (run this manually)"""
    import secrets
    new_key = secrets.token_urlsafe(32)
    print(f"New API Key: {new_key}")
    print("Update your .env file and extension config with this key")
    return new_key