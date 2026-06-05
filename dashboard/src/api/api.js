import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';  // Use 127.0.0.1 not localhost

// IMPORTANT: Use the SAME API key from your backend/.env
// If your backend/.env has API_KEY=test123456789, use that
const API_KEY = 'test123456789';  // ← CHANGE THIS to your actual API key

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,  // ← ADD THIS LINE
    'Content-Type': 'application/json',
  },
});

export const getHistory = async (limit = 100) => {
  try {
    const response = await api.get('/api/history', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    return { history: [], count: 0 };
  }
};

export const getWeeklyReport = async () => {
  try {
    const response = await api.get('/api/weekly-report');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    return { report: null, sentiment_trend: [] };
  }
};

export const getStats = async () => {
  try {
    const response = await api.get('/api/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {};
  }
};

// Add health check function (useful for debugging)
export const checkHealth = async () => {
  try {
    // Health endpoint doesn't require auth
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return response.data;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return null;
  }
};