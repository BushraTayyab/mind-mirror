from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import uvicorn

from database import init_database, save_analysis, get_history, get_weekly_report, get_sentiment_trend
from models.sentiment import SentimentAnalyzer
from models.emotion import EmotionDetector
from models.manipulation import ManipulationDetector
from rag.vector_store import CounterPerspectiveStore

# Initialize FastAPI
app = FastAPI(title="MindMirror Pro API", version="1.0.0")

# Enable CORS for extension and dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_database()

# Initialize models (load once at startup)
print("🚀 Initializing MindMirror Pro backend...")
sentiment_analyzer = SentimentAnalyzer()
emotion_detector = EmotionDetector()
manipulation_detector = ManipulationDetector()
perspective_store = CounterPerspectiveStore()
print("✅ All models loaded successfully!")

# Request/Response models
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

# API Endpoints
@app.get("/")
async def root():
    return {"message": "MindMirror Pro API is running", "status": "active"}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_text(request: AnalysisRequest):
    """Analyze text for sentiment, emotion, and manipulation"""
    try:
        # Run all analyses
        sentiment = sentiment_analyzer.analyze(request.text)
        emotions = emotion_detector.analyze(request.text)
        manipulation = manipulation_detector.analyze(request.text)
        
        # Prepare response
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
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_analysis_history(limit: int = 100):
    """Get analysis history"""
    try:
        history = get_history(limit)
        return {"history": history, "count": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weekly-report")
async def weekly_report():
    """Get weekly aggregated report"""
    try:
        report = get_weekly_report()
        trend = get_sentiment_trend(7)
        return {"report": report, "sentiment_trend": trend}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/other-side")
async def get_other_side(request: OtherSideRequest):
    """Get counter-perspectives using RAG"""
    try:
        perspectives = perspective_store.find_counter_perspectives(
            request.text, 
            request.limit
        )
        return {"perspectives": perspectives, "count": len(perspectives)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """Get quick statistics"""
    try:
        report = get_weekly_report()
        return {
            "weekly_total": report['total_posts'],
            "weekly_manipulative": report['manipulative_posts'],
            "manipulation_rate": report['manipulative_posts'] / report['total_posts'] if report['total_posts'] > 0 else 0,
            "top_manipulation": report['top_manipulation_type']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)