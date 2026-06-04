// Check backend status
async function checkStatus() {
    const statusDiv = document.getElementById('status');
    
    try {
        const response = await fetch('http://127.0.0.1:8000/api/health');
        if (response.ok) {
            statusDiv.textContent = '✅ Backend Connected';
            statusDiv.className = 'status online';
            return true;
        }
    } catch (error) {
        statusDiv.textContent = '❌ Backend Offline (Run: python main.py)';
        statusDiv.className = 'status offline';
        return false;
    }
}

// Load stats
async function loadStats() {
    const statsDiv = document.getElementById('stats');
    
    try {
        // Get API key from config (simplified - you'd need to import)
        const response = await fetch('http://127.0.0.1:8000/api/stats', {
            headers: {
                'Authorization': 'Bearer test123456789'  // Update with your key
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            statsDiv.innerHTML = `
                <div style="margin-top: 8px;">
                    <div>📊 Analyzed: ${stats.weekly_total || 0} posts</div>
                    <div>⚠️ Manipulative: ${stats.weekly_manipulative || 0}</div>
                    <div>🎯 Top tactic: ${stats.top_manipulation || 'None'}</div>
                </div>
            `;
        } else {
            statsDiv.innerHTML = 'Failed to load stats';
        }
    } catch (error) {
        statsDiv.innerHTML = 'Cannot connect to backend';
    }
}

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadStats();
});

// Load on open
checkStatus();
loadStats();