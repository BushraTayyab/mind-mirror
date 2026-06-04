// MindMirror Pro Background Service Worker
importScripts('config.js');

console.log('🧠 MindMirror Pro background service worker started');

// Check if API key is configured
if (!CONFIG.API_KEY || CONFIG.API_KEY === 'test123456789') {
    console.warn('⚠️ Please update extension/config.js with your actual API key from backend/.env');
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeText') {
        analyzeText(request.text, request.platform, request.url)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;  // Keep channel open for async response
    }
});

// Call backend API to analyze text
async function analyzeText(text, platform, url) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                text: text,
                platform: platform,
                url: url
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Invalid API key. Check extension/config.js');
            }
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Show badge if manipulation detected
        if (data.manipulation.score > CONFIG.ALERT_THRESHOLD) {
            chrome.action.setBadgeText({ text: '⚠️' });
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
            
            // Clear badge after 3 seconds
            setTimeout(() => {
                chrome.action.setBadgeText({ text: '' });
            }, 3000);
        }
        
        if (CONFIG.DEBUG) {
            console.log(`✅ Analysis: ${data.manipulation.type} (${(data.manipulation.score * 100).toFixed(0)}%)`);
        }
        
        return data;
        
    } catch (error) {
        console.error('Analysis error:', error);
        return { error: error.message };
    }
}

// Test backend connection on startup
async function testConnection() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/health`);
        if (response.ok) {
            console.log('✅ Connected to MindMirror backend');
        } else {
            console.warn('⚠️ Backend not responding');
        }
    } catch (error) {
        console.error('❌ Cannot reach backend. Make sure it\'s running on port 8000');
    }
}

testConnection();