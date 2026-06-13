#Created For Future Updates

import numpy as np
from typing import List, Dict

class CounterPerspectiveStore:
    def __init__(self):
        print("Loading counter-perspective store...")
        self.perspectives = []
        self._load_default_perspectives()
    
    def _load_default_perspectives(self):
        """Load default perspectives"""
        self.perspectives = [
            {
                "text": "Climate change can be addressed through both individual actions and systemic policy changes.",
                "topic": "climate",
                "source": "Scientific Consensus"
            },
            {
                "text": "Economic policies have different effects on different groups. What works for one may not work for another.",
                "topic": "economics",
                "source": "Balanced Analysis"
            },
            {
                "text": "Public health measures should be evaluated based on evidence and adapted to local conditions.",
                "topic": "health",
                "source": "WHO Guidelines"
            }
        ]
    
    def add_perspective(self, text: str, metadata: Dict):
        """Add a new perspective"""
        self.perspectives.append({
            "text": text,
            "metadata": metadata
        })
    
    def find_counter_perspectives(self, query: str, k: int = 3) -> List[Dict]:
        """Find counter-perspectives (simple keyword matching for now)"""
        query_lower = query.lower()
        scored = []
        
        for p in self.perspectives:
            # Simple keyword matching
            score = 0
            for word in query_lower.split():
                if word in p["text"].lower():
                    score += 1
            
            if score > 0:
                scored.append({
                    "text": p["text"],
                    "metadata": p["metadata"],
                    "similarity_score": min(1.0, score / 10)
                })
        
        scored.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored[:k]