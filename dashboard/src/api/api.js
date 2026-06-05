import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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