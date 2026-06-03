import sqlite3
from datetime import datetime, timedelta
import json
from typing import List, Dict, Any

DB_PATH = "mindmirror.db"

def init_database():
    """Initialize SQLite database with all required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Analysis history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            platform TEXT NOT NULL,
            text TEXT NOT NULL,
            sentiment_score REAL,
            sentiment_label TEXT,
            emotions TEXT,
            manipulation_score REAL,
            manipulation_type TEXT,
            urgency_score REAL,
            outrage_score REAL,
            fear_score REAL,
            url TEXT
        )
    ''')
    
    # Weekly stats table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS weekly_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_start TEXT NOT NULL,
            total_posts INTEGER,
            manipulative_posts INTEGER,
            avg_manipulation_score REAL,
            top_manipulation_type TEXT,
            echo_chamber_score REAL
        )
    ''')
    
    conn.commit()
    conn.close()

def save_analysis(data: Dict[str, Any]):
    """Save a single analysis to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO analyses (
            timestamp, platform, text, sentiment_score, sentiment_label,
            emotions, manipulation_score, manipulation_type,
            urgency_score, outrage_score, fear_score, url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['timestamp'],
        data['platform'],
        data['text'][:500],  # Truncate long text
        data['sentiment_score'],
        data['sentiment_label'],
        json.dumps(data['emotions']),
        data['manipulation_score'],
        data['manipulation_type'],
        data.get('urgency_score', 0),
        data.get('outrage_score', 0),
        data.get('fear_score', 0),
        data.get('url', '')
    ))
    
    conn.commit()
    conn.close()

def get_history(limit: int = 100) -> List[Dict]:
    """Retrieve analysis history"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT timestamp, platform, text, sentiment_label, manipulation_score, 
               manipulation_type, emotions, url
        FROM analyses
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            'timestamp': row[0],
            'platform': row[1],
            'text': row[2],
            'sentiment': row[3],
            'manipulation_score': row[4],
            'manipulation_type': row[5],
            'emotions': json.loads(row[6]),
            'url': row[7]
        })
    
    return history

def get_weekly_report() -> Dict:
    """Generate weekly aggregated report"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    
    cursor.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN manipulation_score > 0.5 THEN 1 ELSE 0 END) as manipulative,
            AVG(manipulation_score) as avg_score,
            AVG(urgency_score) as avg_urgency,
            AVG(outrage_score) as avg_outrage,
            AVG(fear_score) as avg_fear
        FROM analyses
        WHERE timestamp > ?
    ''', (week_ago,))
    
    stats = cursor.fetchone()
    
    # Get top manipulation type
    cursor.execute('''
        SELECT manipulation_type, COUNT(*) as count
        FROM analyses
        WHERE timestamp > ? AND manipulation_type IS NOT NULL
        GROUP BY manipulation_type
        ORDER BY count DESC
        LIMIT 1
    ''', (week_ago,))
    
    top_type = cursor.fetchone()
    
    conn.close()
    
    return {
        'total_posts': stats[0] or 0,
        'manipulative_posts': stats[1] or 0,
        'avg_manipulation_score': round(stats[2] or 0, 3),
        'urgency_score': round(stats[3] or 0, 3),
        'outrage_score': round(stats[4] or 0, 3),
        'fear_score': round(stats[5] or 0, 3),
        'top_manipulation_type': top_type[0] if top_type else 'None'
    }

def get_sentiment_trend(days: int = 7) -> List[Dict]:
    """Get sentiment trend over time"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT date(timestamp) as day, 
               AVG(sentiment_score) as avg_sentiment,
               COUNT(*) as count
        FROM analyses
        WHERE timestamp > datetime('now', ?)
        GROUP BY date(timestamp)
        ORDER BY day
    ''', (f'-{days} days',))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [{'day': row[0], 'sentiment': row[1], 'count': row[2]} for row in rows]