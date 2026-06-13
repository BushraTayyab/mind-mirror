const API_URL = 'http://127.0.0.1:8000';
const API_KEY = 'YOUR_API_KEY';

async function loadStats() {
    const statusDiv = document.getElementById('status');
    const statsDiv = document.getElementById('stats');
    
    try {
        const health = await fetch(`${API_URL}/api/health`);
        if (health.ok) {
            statusDiv.innerHTML = '✅ Backend Connected';
            statusDiv.className = 'status online';
        } else {
            throw new Error('Health check failed');
        }
        
        const res = await fetch(`${API_URL}/api/stats`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const stats = await res.json();
        
        statsDiv.innerHTML = `
            <div class="stat-row"><strong>Total Analyzed:</strong> ${stats.weekly_total || 0}</div>
            <div class="stat-row"><strong>Manipulative:</strong> <span style="color:#dc2626">${stats.weekly_manipulative || 0}</span></div>
            <div class="stat-row"><strong>Rate:</strong> ${Math.round((stats.manipulation_rate || 0) * 100)}%</div>
            <div class="stat-row"><strong>Top Tactic:</strong> ${stats.top_manipulation || 'None'}</div>
        `;
    } catch (err) {
        statusDiv.innerHTML = '❌ Backend Offline';
        statusDiv.className = 'status offline';
        statsDiv.innerHTML = '<div class="stat-row">Failed to load stats</div>';
    }
}

document.getElementById('refreshBtn').addEventListener('click', loadStats);
document.getElementById('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://127.0.0.1:5173' });
});

loadStats();