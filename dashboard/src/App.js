import React, { useState, useEffect } from 'react';
import { getHistory, getWeeklyReport, getStats } from './api/api';
import WeeklyReport from './components/WeeklyReport';
import EchoChart from './components/EchoChart';
import ManipulationChart from './components/ManipulationChart';
import TopicClusters from './components/TopicClusters';
import HistoryTable from './components/HistoryTable';
import SentimentTrend from './components/SentimentTrend';

function App() {
  const [history, setHistory] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [sentimentTrend, setSentimentTrend] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, reportData, statsData] = await Promise.all([
        getHistory(100),
        getWeeklyReport(),
        getStats(),
      ]);

      setHistory(historyData.history || []);
      setWeeklyReport(reportData.report);
      setSentimentTrend(reportData.sentiment_trend || []);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to connect to backend. Make sure it\'s running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <div className="text-xl text-gray-600">Loading MindMirror Pro...</div>
          <div className="text-sm text-gray-400 mt-2">Connecting to backend at localhost:8000</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🧠 MindMirror Pro</h1>
              <p className="text-red-100 mt-1">AI-Powered Social Media Manipulation Detection</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.weekly_manipulative || 0}</div>
              <div className="text-sm">Manipulative Posts (Week)</div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="container mx-auto">
            <p className="font-bold">⚠️ {error}</p>
            <p className="text-sm">Make sure to run: cd backend && python main.py</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-500 text-sm">Total Analyzed</div>
            <div className="text-3xl font-bold text-gray-800">{stats.weekly_total || 0}</div>
            <div className="text-xs text-gray-400 mt-1">Last 7 days</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-500 text-sm">Manipulation Rate</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.manipulation_rate ? `${(stats.manipulation_rate * 100).toFixed(0)}%` : '0%'}
            </div>
            <div className="text-xs text-gray-400 mt-1">of all content</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-500 text-sm">Top Tactic</div>
            <div className="text-2xl font-bold text-gray-800">{stats.top_manipulation || 'None'}</div>
            <div className="text-xs text-gray-400 mt-1">Most common manipulation</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-500 text-sm">Avg Manipulation Score</div>
            <div className="text-3xl font-bold text-orange-600">
              {weeklyReport ? `${(weeklyReport.avg_manipulation_score * 100).toFixed(0)}%` : '0%'}
            </div>
            <div className="text-xs text-gray-400 mt-1">0% = safe, 100% = manipulative</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <WeeklyReport report={weeklyReport} />
          <EchoChart history={history} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ManipulationChart history={history} />
          <SentimentTrend trend={sentimentTrend} />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <TopicClusters history={history} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <HistoryTable history={history} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>🧠 MindMirror Pro - Privacy-first AI detection. Everything runs locally on your device.</p>
          <p className="text-gray-400 mt-2">No data leaves your computer | Open source | Real-time protection</p>
        </div>
      </footer>
    </div>
  );
}

export default App;