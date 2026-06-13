import axios from 'axios';

// !!! IMPORTANT: Use the SAME key as backend/.env !!!
const API_KEY = 'your_api_key_here';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const getHistory = async (limit = 100) => {
  try {
    const response = await api.get('/api/history', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error.response?.data || error.message);
    return { history: [], count: 0 };
  }
};

export const getWeeklyReport = async () => {
  try {
    const response = await api.get('/api/weekly-report');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly report:', error.response?.data || error.message);
    return { report: null, sentiment_trend: [] };
  }
};

export const getStats = async () => {
  try {
    const response = await api.get('/api/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error.response?.data || error.message);
    return {};
  }
};

export const checkHealth = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return null;
  }
};