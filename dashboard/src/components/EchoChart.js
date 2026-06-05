import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';

const EchoChart = ({ history }) => {
  const data = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Group by day and calculate echo chamber score (based on sentiment consistency)
    const grouped = {};
    history.forEach(item => {
      const day = new Date(item.timestamp).toLocaleDateString();
      if (!grouped[day]) {
        grouped[day] = {
          sentiments: [],
          day,
        };
      }
      grouped[day].sentiments.push(item.sentiment === 'positive' ? 1 : -1);
    });
    
    return Object.values(grouped).map(group => {
      const avgSentiment = group.sentiments.reduce((a,b) => a+b, 0) / group.sentiments.length;
      // Echo chamber score: low sentiment diversity = high echo chamber
      const sentimentVariance = Math.abs(avgSentiment);
      const echoScore = Math.min(100, sentimentVariance * 100);
      
      return {
        day: group.day,
        echoScore: Math.round(echoScore),
        sentimentDiversity: Math.round((1 - sentimentVariance) * 100),
      };
    }).slice(-14); // Last 14 days
  }, [history]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">🎭 Echo Chamber Score</h2>
        <div className="text-center text-gray-400 py-12">No data available yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🎭 Echo Chamber Score Over Time</h2>
      <div className="mb-4 text-sm text-gray-600">
        <p>Lower score = More diverse perspectives | Higher score = Potential echo chamber</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" angle={-45} textAnchor="end" height={60} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="echoScore"
            stroke="#ff0000"
            fill="#ff0000"
            fillOpacity={0.1}
          />
          <Line
            type="monotone"
            dataKey="echoScore"
            stroke="#ff0000"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-xs text-gray-500 text-center">
        Based on sentiment diversity across analyzed content
      </div>
    </div>
  );
};

export default EchoChart;