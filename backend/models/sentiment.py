from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        print("Loading sentiment model...")
        try:
            # Using DistilBERT (smaller, faster)
            self.model_name = "distilbert-base-uncased-finetuned-sst-2-english"
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.eval()  # Set to evaluation mode
            logger.info("✅ Sentiment model loaded")
        except Exception as e:
            logger.error(f"❌ Failed to load sentiment model: {e}")
            raise
        
    def analyze(self, text: str) -> Dict:
        """Analyze sentiment of text"""
        try:
            # Truncate long texts
            if len(text) > 512:
                text = text[:512]
            
            # Tokenize
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)
            
            # Inference
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1)
            
            # Get labels (SST-2: 0=negative, 1=positive)
            neg_score = probs[0][0].item()
            pos_score = probs[0][1].item()
            
            # Convert to single score (-1 to 1)
            sentiment_score = pos_score - neg_score
            
            label = "positive" if pos_score > neg_score else "negative"
            
            return {
                'score': sentiment_score,
                'label': label,
                'confidence': max(pos_score, neg_score)
            }
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {'score': 0, 'label': 'unknown', 'confidence': 0}