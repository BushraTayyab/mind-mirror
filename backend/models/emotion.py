from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class EmotionDetector:
    def __init__(self):
        print("Loading emotion detection model...")
        try:
            # Using GoEmotions model
            self.model_name = "bhadresh-savani/distilbert-base-uncased-emotion"
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.eval()
            
            self.emotions = ['anger', 'fear', 'joy', 'sadness', 'surprise', 'disgust']
            logger.info("✅ Emotion detection model loaded")
        except Exception as e:
            logger.error(f"❌ Failed to load emotion model: {e}")
            raise
        
    def analyze(self, text: str) -> Dict:
        """Detect emotions in text"""
        try:
            if len(text) > 512:
                text = text[:512]
            
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.sigmoid(logits)
            
            # Get emotion scores
            emotion_scores = {}
            for i, emotion in enumerate(self.emotions):
                score = probs[0][i].item()
                if score > 0.3:
                    emotion_scores[emotion] = score
            
            if emotion_scores:
                dominant = max(emotion_scores, key=emotion_scores.get)
            else:
                dominant = "neutral"
                emotion_scores = {"neutral": 1.0}
            
            return {
                'dominant': dominant,
                'scores': emotion_scores
            }
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}")
            return {'dominant': 'neutral', 'scores': {'neutral': 1.0}}