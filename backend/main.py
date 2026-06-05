from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import uvicorn
import logging

# Local imports
from database import init_database, save_analysis, get_history, get_weekly_report, get_sentiment_trend
from config import Config
from auth import verify_api_key, rate_limit


from models.sentiment import SentimentAnalyzer
from models.emotion import EmotionDetector
from models.manipulation import ManipulationDetector
# from rag.vector_store import CounterPerspectiveStore

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="MindMirror Pro API",
    version="1.0.0",
    description="Secure API for social media manipulation detection",
    docs_url="/api/docs" if Config.ENVIRONMENT == "development" else None,  # Disable docs in production
    redoc_url=None
)

# ============ CORS MIDDLEWARE (SECURE) ============
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,     # Specific origins only
    allow_credentials=True,                    # Allow cookies/auth
    allow_methods=Config.ALLOWED_METHODS,      # Only GET, POST, OPTIONS
    allow_headers=Config.ALLOWED_HEADERS,      # Specific headers only
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    max_age=3600,                              # Cache preflight for 1 hour
)

# ============ MIDDLEWARE ============
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Log security events and add security headers"""
    
    # Log CORS events (for debugging)
    origin = request.headers.get("origin")
    if origin:
        if origin in Config.ALLOWED_ORIGINS:
            logger.debug(f"✅ CORS allowed: {origin}")
        else:
            logger.warning(f"❌ CORS blocked: {origin} from {request.client.host}")
    
    # Apply rate limiting (skip for OPTIONS preflight)
    if request.method != "OPTIONS":
        try:
            await rate_limit(request)
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail}
            )
    
    # Process request
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Add rate limit headers
    from auth import request_counts
    client_ip = request.client.host if request.client else "unknown"
    remaining = max(0, Config.RATE_LIMIT_REQUESTS - len(request_counts[client_ip]))
    response.headers["X-RateLimit-Limit"] = str(Config.RATE_LIMIT_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    
    return response

# ============ REQUEST/RESPONSE MODELS ============
class AnalysisRequest(BaseModel):
    text: str
    platform: str
    url: Optional[str] = ""

class AnalysisResponse(BaseModel):
    timestamp: str
    platform: str
    text: str
    sentiment: Dict
    emotions: Dict
    manipulation: Dict
    url: str

class OtherSideRequest(BaseModel):
    text: str
    limit: Optional[int] = 3

# ============ INITIALIZATION ============
# Initialize database
init_database()
logger.info("✅ Database initialized")


try:
    sentiment_analyzer = SentimentAnalyzer()
    emotion_detector = EmotionDetector()
    manipulation_detector = ManipulationDetector()
    perspective_store = CounterPerspectiveStore()
    logger.info("✅ All AI models loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load models: {e}")

# ============ HEALTH CHECK (NO AUTH REQUIRED) ============
@app.get("/")
async def root():
    """Public health check endpoint"""
    return {
        "status": "active",
        "message": "MindMirror Pro API is running",
        "version": "1.0.0",
        "environment": Config.ENVIRONMENT,
        "requires_auth": True
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check (no auth required)"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cors_origins": len(Config.ALLOWED_ORIGINS),
        "rate_limit": f"{Config.RATE_LIMIT_REQUESTS}/{Config.RATE_LIMIT_WINDOW}s"
    }

# ============ API ENDPOINTS (ALL REQUIRE AUTH) ============
@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_text(
    request: AnalysisRequest,
    api_key: str = Depends(verify_api_key)  # API key required
):
    """Analyze text for sentiment, emotion, and manipulation"""
    try:
        logger.info(f"Analyzing text from {request.platform} (length: {len(request.text)})")
        
        
        sentiment = sentiment_analyzer.analyze(request.text)
        emotions = emotion_detector.analyze(request.text)
        manipulation = manipulation_detector.analyze(request.text)
        
        # Temporary mock response (remove when models are ready)
        sentiment = {"score": 0.5, "label": "neutral", "confidence": 0.8}
        emotions = {"dominant": "neutral", "scores": {"neutral": 1.0}}
        manipulation = {"score": 0.2, "type": "none", "is_manipulative": False}
        
        response = AnalysisResponse(
            timestamp=datetime.now().isoformat(),
            platform=request.platform,
            text=request.text[:500],
            sentiment=sentiment,
            emotions=emotions,
            manipulation=manipulation,
            url=request.url
        )
        
        # Save to database
        save_analysis(response.dict())
        logger.info(f"Analysis saved successfully")
        
        return response
    
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/history")
async def get_analysis_history(
    limit: int = 100,
    api_key: str = Depends(verify_api_key)  # API key required
):
    """Get analysis history"""
    try:
        history = get_history(limit)
        return {
            "history": history,
            "count": len(history),
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to fetch history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weekly-report")
async def weekly_report(
    api_key: str = Depends(verify_api_key)  # API key required
):
    """Get weekly aggregated report"""
    try:
        report = get_weekly_report()
        trend = get_sentiment_trend(7)
        return {
            "report": report,
            "sentiment_trend": trend,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to generate report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/other-side")
async def get_other_side(
    request: OtherSideRequest,
    api_key: str = Depends(verify_api_key)  # API key required
):
    """Get counter-perspectives using RAG"""
    try:
        
        perspectives = perspective_store.find_counter_perspectives(
            request.text, 
            request.limit
        )
        
        # Mock response (remove when FAISS is ready)
        perspectives = [
            {
                "text": "Alternative perspective would appear here",
                "metadata": {"source": "Example"},
                "similarity_score": 0.85
            }
        ]
        
        return {
            "perspectives": perspectives,
            "count": len(perspectives),
            "query": request.text[:100]
        }
    except Exception as e:
        logger.error(f"Failed to find perspectives: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats(
    api_key: str = Depends(verify_api_key)  # API key required
):
    """Get quick statistics"""
    try:
        report = get_weekly_report()
        return {
            "weekly_total": report['total_posts'],
            "weekly_manipulative": report['manipulative_posts'],
            "manipulation_rate": report['manipulative_posts'] / report['total_posts'] if report['total_posts'] > 0 else 0,
            "top_manipulation": report['top_manipulation_type'],
            "environment": Config.ENVIRONMENT
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ ERROR HANDLERS ============
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    """Generic exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.now().isoformat()
        }
    )

# ============ RUN SERVER ============
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # Only localhost, not 0.0.0.0
        port=8000,
        reload=Config.ENVIRONMENT == "development",
        log_level="info"
    )