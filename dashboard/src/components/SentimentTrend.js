import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SentimentTrend = ({ trend }) => {
  if (!trend || trend.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">😊 Sentiment Over Time</h2>
        <div className="text-center text-gray-400 py-12">Collecting sentiment data...</div>
      </div>
    );
  }

  // Sentiment scores range from -1 (negative) to 1 (positive)
  const data = trend.map(t => ({
    day: t.day,
    sentiment: t.sentiment || 0,
    posts: t.count,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">😊 Sentiment Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis domain={[-1, 1]} tickFormatter={(value) => value.toFixed(1)} />
          <Tooltip 
            formatter={(value) => [
              value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2),
              'Sentiment Score'
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="sentiment"
            stroke="#4CAF50"
            fill="url(#sentimentGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 text-xs text-gray-500 text-center">
        Positive values = optimistic content | Negative values = pessimistic/critical content
      </div>
    </div>
  );
};

export default SentimentTrend;