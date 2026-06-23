import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';

const AnalyticsDashboard = () => {
  // 1. State to store the parsed manipulation data
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Fetching raw JSON data from FastAPI Backend
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Fetching real-time classification logs from local SQLite/FastAPI
        const response = await axios.get('http://localhost:8000/api/analytics/weekly');
        
        // Data Transformation: Cleaning and parsing data for Recharts
        const formattedData = response.data.map(item => ({
          day: item.day_name,
          'Fear Mongering': parseFloat(item.fear_score * 100).toFixed(2),
          'Outrage Bait': parseFloat(item.outrage_score * 100).toFixed(2),
          'Echo Chamber Index': item.echo_index
        }));
        
        setWeeklyData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) return <div className="text-white text-center p-5">Loading Dashboard Metrics...</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-indigo-400">MindMirror Analytics Hub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CHART 1: Emotion Timeline (Line Chart) */}
        <div className="p-4 bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Emotion Timeline & Manipulation Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" stroke="#999" />
              <YAxis unit="%" stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#555' }} />
              <Legend />
              <Line type="monotone" dataKey="Fear Mongering" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="Outrage Bait" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CHART 2: Echo Chamber Score (Bar Chart) */}
        <div className="p-4 bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Weekly Echo Chamber Score (Polarization)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#555' }} />
              <Legend />
              <Bar dataKey="Echo Chamber Index" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
