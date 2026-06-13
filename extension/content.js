// MindMirror Pro Content Script
console.log('🧠 MindMirror Pro content script loaded');

let processed = new Set();
let platform = null;

// Detect platform
if (location.hostname.includes('youtube')) platform = 'youtube';
else if (location.hostname.includes('instagram')) platform = 'instagram';
else if (location.hostname.includes('reddit')) platform = 'reddit';

if (!platform) {
    console.log('MindMirror: Unsupported platform');
} else {
    console.log(`MindMirror: Active on ${platform}`);
    startScanning();
}

function startScanning() {
    scan();
    setInterval(() => scan(), 5000);
}

function scan() {
    let elements = [];
    
    if (platform === 'youtube') {
        // Get all text elements from videos and comments
        const selectors = ['#title h3', '#content-text', 'yt-formatted-string#text', '#video-title', 'span#text'];
        for (const selector of selectors) {
            elements.push(...document.querySelectorAll(selector));
        }
    }
    
    console.log(`🔍 Found ${elements.length} elements to check`);
    
    let analyzed = 0;
    
    for (let el of elements) {
        const text = el.innerText?.trim();
        if (!text || text.length < 30) continue;
        
        const id = text.substring(0, 100);
        if (processed.has(id)) continue;
        
        processed.add(id);
        analyzed++;
        
        // Send to background - don't wait for response to avoid blocking
        chrome.runtime.sendMessage({
            action: 'analyzeText',
            text: text,
            platform: platform,
            url: location.href
        }).catch(err => console.error('Send error:', err.message));
    }
    
    if (analyzed > 0) {
        console.log(`📤 Sent ${analyzed} new items for analysis`);
    }
}