from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import sqlite3
import json
import uvicorn
from typing import Optional
import random

app = FastAPI(title="MindMirror API", version="2.0.0")

# CORS - Allow everything for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ DATABASE SETUP ============
def init_db():
    conn = sqlite3.connect('mindmirror.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            platform TEXT,
            text TEXT,
            sentiment_score REAL,
            sentiment_label TEXT,
            emotions TEXT,
            manipulation_score REAL,
            manipulation_type TEXT,
            url TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("✅ Database ready")

init_db()

class AnalysisRequest(BaseModel):
    text: str
    platform: str
    url: Optional[str] = ""

# ============ IMPROVED MANIPULATION DETECTION ============
def detect_manipulation(text):
    text_lower = text.lower()
    
    # Strong manipulation indicators
    urgency_words = [
        'urgent', 'now', 'immediately', 'asap', 'hurry', 'limited', 'act now',
        'today only', 'last chance', "don't miss", 'breaking', 'alert', 'warning',
        'fast', 'quick', 'instant', 'expires', 'ending', 'final', 'before it\'s too late'
    ]
    
    outrage_words = [
        'exposed', 'shocking', 'truth', 'they don\'t want', 'scam', 'fake',
        'corrupt', 'evil', 'hate', 'outrage', 'angry', 'unacceptable',
        'disgusting', 'can\'t believe', 'lie', 'lying', 'betrayed'
    ]
    
    fear_words = [
        'danger', 'threat', 'risk', 'warning', 'alert', 'caution',
        'beware', 'harm', 'damage', 'loss', 'crisis', 'emergency',
        'scary', 'fear', 'panic', 'terrifying', 'nightmare', 'dead', 'death'
    ]
    
    scarcity_words = [
        'only', 'few', 'rare', 'exclusive', 'limited', 'hard to find',
        'selling fast', 'almost gone', 'waitlist', 'members only', 'one time'
    ]
    
    # Calculate scores (weighted)
    urgency = sum(2 for w in urgency_words if w in text_lower)
    outrage = sum(2 for w in outrage_words if w in text_lower)
    fear = sum(1.5 for w in fear_words if w in text_lower)
    scarcity = sum(2 for w in scarcity_words if w in text_lower)
    
    # Check for caps and exclamations (emotional intensity)
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    exclamation_count = text.count('!')
    caps_score = 1.5 if caps_ratio > 0.2 else 0
    exclamation_score = min(2, exclamation_count / 3)
    
    # Add emotional intensity to most relevant category
    if urgency > 0:
        urgency += caps_score + exclamation_score
    elif outrage > 0:
        outrage += caps_score + exclamation_score
    elif fear > 0:
        fear += caps_score + exclamation_score
    elif scarcity > 0:
        scarcity += caps_score + exclamation_score
    
    # Find the highest score
    scores = {'urgency': urgency, 'outrage': outrage, 'fear': fear, 'scarcity': scarcity}
    max_type = max(scores, key=scores.get)
    max_score = scores[max_type]
    
    # Calculate final score (0-1)
    if max_score == 0:
        # Small random score for neutral content
        final_score = random.uniform(0.05, 0.15)
        is_manipulative = False
        detected_type = 'none'
    else:
        final_score = min(0.95, max_score / 8)
        is_manipulative = final_score > 0.2  # Lowered threshold
        detected_type = max_type if is_manipulative else 'none'
    
    print(f"🔍 [{detected_type}] U:{urgency:.1f} O:{outrage:.1f} F:{fear:.1f} S:{scarcity:.1f} -> Score:{final_score:.2f}")
    
    return {
        "score": round(final_score, 2),
        "type": detected_type,
        "is_manipulative": is_manipulative,
        "details": {
            "urgency": round(min(1, urgency/5), 2),
            "outrage": round(min(1, outrage/5), 2),
            "fear": round(min(1, fear/5), 2),
            "scarcity": round(min(1, scarcity/5), 2)
        }
    }

def detect_sentiment(text):
    text_lower = text.lower()
    
    positive_words = ['good', 'great', 'awesome', 'love', 'amazing', 'best', 'wonderful', 'happy', 'beautiful', 'excellent', 'fantastic']
    negative_words = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'sad', 'angry', 'useless', 'disappointing']
    
    pos = sum(1 for w in positive_words if w in text_lower)
    neg = sum(1 for w in negative_words if w in text_lower)
    
    if pos > neg:
        return {"score": 0.7, "label": "positive", "confidence": 0.85}
    elif neg > pos:
        return {"score": -0.6, "label": "negative", "confidence": 0.8}
    else:
        return {"score": 0, "label": "neutral", "confidence": 0.6}

# ============ API ENDPOINTS ============

@app.get("/")
async def root():
    return {"status": "active", "name": "MindMirror", "version": "2.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/analyze")
async def analyze(request: AnalysisRequest):
    try:
        print(f"\n📝 Analyzing [{request.platform}]: {request.text[:60]}...")
        
        sentiment = detect_sentiment(request.text)
        manipulation = detect_manipulation(request.text)
        
        # Save to database
        conn = sqlite3.connect('mindmirror.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO analyses (timestamp, platform, text, sentiment_score, sentiment_label, 
                                 emotions, manipulation_score, manipulation_type, url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            request.platform,
            request.text[:500],
            sentiment["score"],
            sentiment["label"],
            json.dumps({"dominant": manipulation['type'], "scores": manipulation['details']}),
            manipulation["score"],
            manipulation["type"],
            request.url
        ))
        conn.commit()
        conn.close()
        
        print(f"✅ Result: {manipulation['type']} ({manipulation['score']})")
        
        return {
            "timestamp": datetime.now().isoformat(),
            "platform": request.platform,
            "text": request.text[:500],
            "sentiment": sentiment,
            "emotions": {"dominant": manipulation['type'], "scores": manipulation['details']},
            "manipulation": manipulation,
            "url": request.url
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "timestamp": datetime.now().isoformat(),
            "platform": request.platform,
            "text": request.text[:500],
            "sentiment": {"score": 0, "label": "neutral", "confidence": 0.5},
            "emotions": {"dominant": "none", "scores": {}},
            "manipulation": {"score": 0.1, "type": "none", "is_manipulative": False},
            "url": request.url
        }

@app.get("/api/stats")
async def get_stats():
    try:
        conn = sqlite3.connect('mindmirror.db')
        cursor = conn.cursor()
        
        # Total count
        cursor.execute("SELECT COUNT(*) FROM analyses")
        total = cursor.fetchone()[0] or 0
        
        # Manipulative count (score > 0.2)
        cursor.execute("SELECT COUNT(*) FROM analyses WHERE manipulation_score > 0.2")
        manipulative = cursor.fetchone()[0] or 0
        
        # Get top manipulation type (excluding 'none')
        cursor.execute("""
            SELECT manipulation_type, COUNT(*) 
            FROM analyses 
            WHERE manipulation_type != 'none' AND manipulation_type IS NOT NULL
            GROUP BY manipulation_type 
            ORDER BY COUNT(*) DESC LIMIT 1
        """)
        top_row = cursor.fetchone()
        
        # Get average manipulation score
        cursor.execute("SELECT AVG(manipulation_score) FROM analyses")
        avg_row = cursor.fetchone()
        
        conn.close()
        
        # Determine top manipulation type
        if top_row and top_row[0]:
            top_manipulation = top_row[0]
        elif total > 0:
            top_manipulation = "pending"  # Show "pending" instead of "none" when there's data
        else:
            top_manipulation = "no data"
        
        manipulation_rate = manipulative / total if total > 0 else 0
        
        return {
            "weekly_total": total,
            "weekly_manipulative": manipulative,
            "manipulation_rate": round(manipulation_rate, 2),
            "top_manipulation": top_manipulation,
            "avg_manipulation_score": round(avg_row[0] or 0, 2)
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {
            "weekly_total": 0, 
            "weekly_manipulative": 0, 
            "manipulation_rate": 0, 
            "top_manipulation": "no data",
            "avg_manipulation_score": 0
        }

@app.get("/api/history")
async def get_history(limit: int = 200):
    try:
        conn = sqlite3.connect('mindmirror.db')
        cursor = conn.cursor()
        cursor.execute("""
            SELECT timestamp, platform, text, sentiment_label, manipulation_score, 
                   manipulation_type, url, sentiment_score
            FROM analyses 
            ORDER BY timestamp DESC LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                "timestamp": row[0],
                "platform": row[1],
                "text": row[2],
                "sentiment": row[3],
                "manipulation_score": row[4],
                "manipulation_type": row[5] if row[5] else "none",
                "url": row[6],
                "sentiment_score": row[7]
            })
        return {"history": history, "count": len(history)}
    except Exception as e:
        print(f"History error: {e}")
        return {"history": [], "count": 0}

@app.get("/api/weekly-report")
async def weekly_report():
    stats = await get_stats()
    return {"report": stats, "sentiment_trend": []}

@app.post("/api/other-side")
async def get_other_side(request: dict):
    """Get counter-perspectives for a claim"""
    text = request.get("text", "")
    limit = request.get("limit", 4)
    
    # Sample counter-perspectives based on keywords
    text_lower = text.lower()
    
    if "climate" in text_lower or "global warming" in text_lower:
        perspectives = [
            {"text": "The scientific consensus is that climate change is real and human-caused. Over 97% of climate scientists agree.", "metadata": {"source": "NASA"}},
            {"text": "Renewable energy costs have dropped 89% in the last decade, making clean energy cheaper than fossil fuels.", "metadata": {"source": "International Energy Agency"}},
            {"text": "Climate action creates jobs. The renewable energy sector employs over 12 million people worldwide.", "metadata": {"source": "IRENA"}}
        ]
    elif "vaccine" in text_lower or "covid" in text_lower:
        perspectives = [
            {"text": "Vaccines undergo rigorous testing through clinical trials before approval. They save millions of lives annually.", "metadata": {"source": "WHO"}},
            {"text": "Herd immunity through vaccination protects vulnerable populations who cannot be vaccinated.", "metadata": {"source": "CDC"}},
            {"text": "Vaccine side effects are rare and monitored continuously. Benefits far outweigh risks.", "metadata": {"source": "Mayo Clinic"}}
        ]
    elif "politic" in text_lower or "election" in text_lower:
        perspectives = [
            {"text": "Democracy works best when citizens engage with multiple news sources and fact-check claims.", "metadata": {"source": "Media Literacy"}},
            {"text": "Bipartisan solutions often provide the most sustainable long-term policies for complex issues.", "metadata": {"source": "Policy Analysis"}},
            {"text": "Voter turnout increases when people feel informed about all sides of an issue.", "metadata": {"source": "Election Studies"}}
        ]
    else:
        perspectives = [
            {"text": "Consider fact-checking this claim using Snopes, FactCheck.org, or Google Fact Check Explorer.", "metadata": {"source": "Recommendation"}},
            {"text": "Seek out perspectives from experts or organizations with credentials in the relevant field.", "metadata": {"source": "Media Literacy"}},
            {"text": "Ask yourself: Who benefits from this message? What evidence supports or refutes it?", "metadata": {"source": "Critical Thinking"}},
            {"text": "Look for original sources rather than relying on second-hand interpretations.", "metadata": {"source": "Research Tips"}}
        ]
    
    return {"perspectives": perspectives[:limit], "count": len(perspectives[:limit])}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)