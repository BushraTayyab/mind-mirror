import re
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class ManipulationDetector:
    def __init__(self):
        print("Loading manipulation detection rules...")
        
        self.urgency_keywords = [
            r'\b(urgent|immediately|asap|right now|don\'t wait|limited time|hurry|quick|fast|now|today only)\b',
            r'\b(expires|ending soon|last chance|final call|running out)\b',
            r'\b(act now|don\'t miss|while supplies last|offer ends)\b'
        ]
        
        self.fear_keywords = [
            r'\b(scary|fear|panic|danger|threat|risk|harm|loss|damage|disaster)\b',
            r'\b(you\'ll regret|missing out|bad things|terrible|awful)\b',
            r'\b(if you don\'t|otherwise|or else|consequences)\b'
        ]
        
        self.outrage_keywords = [
            r'\b(outrage|furious|angry|mad|unacceptable|disgusting|horrible)\b',
            r'\b(can\'t believe|how dare|this is wrong|should be ashamed)\b',
            r'!{2,}',
            r'\b(typical|always|never|everyone knows|nobody cares)\b'
        ]
        
        self.us_vs_them_keywords = [
            r'\b(us|we|our|ourselves)\b.*\b(them|they|their|those people)\b',
            r'\b(real americans|true patriots|we the people)\b',
            r'\b(they want|they don\'t want you to know|the establishment)\b',
        ]
        
        self.scarcity_keywords = [
            r'\b(limited|few|rare|exclusive|only|just|hard to find)\b',
            r'\b(get yours|secure your|guaranteed|special access)\b'
        ]
        
        logger.info("✅ Manipulation detection rules loaded")
        
    def analyze(self, text: str) -> Dict:
        """Detect manipulation techniques in text"""
        text_lower = text.lower()
        
        urgency_score = self._calculate_score(text_lower, self.urgency_keywords)
        fear_score = self._calculate_score(text_lower, self.fear_keywords)
        outrage_score = self._calculate_score(text_lower, self.outrage_keywords)
        us_vs_them_score = self._calculate_score(text_lower, self.us_vs_them_keywords)
        scarcity_score = self._calculate_score(text_lower, self.scarcity_keywords)
        
        scores = [urgency_score, fear_score, outrage_score, us_vs_them_score, scarcity_score]
        manipulation_score = min(1.0, sum(scores))
        
        type_scores = {
            'urgency': urgency_score,
            'fear': fear_score,
            'outrage': outrage_score,
            'us_vs_them': us_vs_them_score,
            'scarcity': scarcity_score
        }
        
        max_type = max(type_scores, key=type_scores.get) if manipulation_score > 0.1 else 'none'
        
        return {
            'score': manipulation_score,
            'type': max_type,
            'details': {
                'urgency': urgency_score,
                'fear': fear_score,
                'outrage': outrage_score,
                'us_vs_them': us_vs_them_score,
                'scarcity': scarcity_score
            },
            'is_manipulative': manipulation_score > 0.3
        }
    
    def _calculate_score(self, text: str, patterns: list, max_score: float = 1.0) -> float:
        matches = 0
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                matches += 1
        
        score = min(max_score, matches / len(patterns))
        return score