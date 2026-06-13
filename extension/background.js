// MindMirror Pro Background Service Worker
console.log('🧠 MindMirror Pro background worker STARTED');

const API_URL = 'http://127.0.0.1:8000';
const API_KEY = 'YOUR_API_KEY';

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeText') {
        console.log(`📨 Analyzing: ${request.text.substring(0, 50)}...`);
        
        fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                text: request.text.substring(0, 500),
                platform: request.platform,
                url: request.url
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log(`✅ Result: ${data.manipulation?.type} (${Math.round(data.manipulation?.score * 100)}%)`);
            
            if (data.manipulation?.is_manipulative) {
                chrome.action.setBadgeText({ text: '⚠️' });
                chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
                setTimeout(() => chrome.action.setBadgeText({ text: '' }), 10000);
            }
        })
        .catch(err => console.error('❌ API Error:', err));
        
        sendResponse({ received: true });
        return true;
    }
});

// Test backend
fetch(`${API_URL}/api/health`)
    .then(() => console.log('✅ Backend connected'))
    .catch(() => console.log('❌ Backend offline'));