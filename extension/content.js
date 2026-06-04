// MindMirror Pro Content Script - Scans social media posts
console.log('🧠 MindMirror Pro scanning this page');

let processedPosts = new Set();
let scanTimeout = null;

// Platform-specific selectors for finding posts
const PLATFORM_SELECTORS = {
    instagram: {
        posts: 'article',
        textElements: ['h2', 'span._a9zr', 'div._a9zr', 'span.x1lliihq'],
        name: 'Instagram'
    },
    youtube: {
        posts: 'ytd-rich-item-renderer, ytd-video-renderer',
        textElements: ['#title', '#description-text', 'yt-formatted-string'],
        name: 'YouTube'
    },
    reddit: {
        posts: 'shreddit-post, div.Post',
        textElements: ['h3', 'p', 'div[slot="text-body"]'],
        name: 'Reddit'
    }
};

// Detect which platform we're on
function getPlatform() {
    if (window.location.hostname.includes('instagram.com')) return 'instagram';
    if (window.location.hostname.includes('youtube.com')) return 'youtube';
    if (window.location.hostname.includes('reddit.com')) return 'reddit';
    return null;
}

const platform = getPlatform();
if (!platform) {
    console.log('MindMirror: Unsupported platform');
} else {
    console.log(`MindMirror: Active on ${PLATFORM_SELECTORS[platform].name}`);
    startScanning();
}

// Start scanning for posts
function startScanning() {
    // Initial scan
    setTimeout(() => scanPage(), 2000);
    
    // Set up scroll detection
    window.addEventListener('scroll', () => {
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => scanPage(), 500);
    });
    
    // Set up observer for dynamically loaded content
    const observer = new MutationObserver(() => {
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => scanPage(), 500);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Scan page for new posts
async function scanPage() {
    const selectors = PLATFORM_SELECTORS[platform];
    if (!selectors) return;
    
    const posts = document.querySelectorAll(selectors.posts);
    
    for (const post of posts) {
        const postId = getPostId(post);
        
        if (!processedPosts.has(postId)) {
            const text = extractTextFromPost(post, selectors.textElements);
            
            if (text && text.length > 20) {  // Minimum text length
                processedPosts.add(postId);
                
                // Send to background for analysis
                const analysis = await analyzeText(text);
                
                if (analysis && analysis.manipulation && analysis.manipulation.is_manipulative) {
                    showAlert(post, analysis);
                }
            }
        }
    }
}

// Extract text from post
function extractTextFromPost(post, textSelectors) {
    let text = '';
    
    for (const selector of textSelectors) {
        const elements = post.querySelectorAll(selector);
        elements.forEach(el => {
            text += el.innerText + ' ';
        });
    }
    
    // Fallback: get all text
    if (!text.trim()) {
        text = post.innerText;
    }
    
    return text.trim();
}

// Generate unique ID for a post
function getPostId(post) {
    if (post.id) return post.id;
    const text = post.innerText.substring(0, 100);
    return `${post.tagName}_${text.length}_${post.offsetTop}`;
}

// Send text to backend via background script
async function analyzeText(text) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action: 'analyzeText',
            text: text,
            platform: platform,
            url: window.location.href
        }, (response) => {
            resolve(response);
        });
    });
}

// Show visual alert on manipulative post
function showAlert(post, analysis) {
    // Don't add duplicate alerts
    if (post.querySelector('.mindmirror-alert')) return;
    
    const alert = document.createElement('div');
    alert.className = 'mindmirror-alert';
    alert.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(220, 38, 38, 0.95);
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-family: Arial, sans-serif;
        z-index: 10000;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-weight: bold;
    `;
    
    const score = (analysis.manipulation.score * 100).toFixed(0);
    alert.innerHTML = `⚠️ ${analysis.manipulation.type.toUpperCase()} (${score}%)`;
    
    alert.addEventListener('click', () => {
        showDetails(analysis);
    });
    
    // Make sure post has position relative
    if (getComputedStyle(post).position === 'static') {
        post.style.position = 'relative';
    }
    
    post.appendChild(alert);
}

// Show detailed popup
function showDetails(analysis) {
    // Remove existing popup
    const existing = document.querySelector('.mindmirror-details');
    if (existing) existing.remove();
    
    const popup = document.createElement('div');
    popup.className = 'mindmirror-details';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        color: #1f2937;
        padding: 20px;
        border-radius: 12px;
        z-index: 10001;
        max-width: 350px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        border: 2px solid #dc2626;
    `;
    
    popup.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="color: #dc2626; margin: 0;">⚠️ Manipulation Detected</h3>
            <button id="close-popup" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
        </div>
        <div style="margin: 10px 0;">
            <strong>Type:</strong> ${analysis.manipulation.type}<br>
            <strong>Confidence:</strong> ${(analysis.manipulation.score * 100).toFixed(0)}%<br>
            <strong>Sentiment:</strong> ${analysis.sentiment.label}
        </div>
        <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 12px;">
            <strong>Why?</strong> This post uses ${analysis.manipulation.type} tactics to influence you.
        </div>
        <button id="dismiss" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; margin-top: 12px; width: 100%; cursor: pointer;">
            Got it
        </button>
    `;
    
    document.body.appendChild(popup);
    
    document.getElementById('close-popup')?.addEventListener('click', () => popup.remove());
    document.getElementById('dismiss')?.addEventListener('click', () => popup.remove());
}