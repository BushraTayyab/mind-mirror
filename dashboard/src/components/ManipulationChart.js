import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ReTooltip } from 'recharts';

const ManipulationChart = ({ history }) => {
  const data = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    const counts = {
      urgency: 0,
      fear: 0,
      outrage: 0,
      us_vs_them: 0,
      scarcity: 0,
      none: 0,
    };
    
    history.forEach(item => {
      if (item.manipulation_type && item.manipulation_type !== 'none') {
        counts[item.manipulation_type] = (counts[item.manipulation_type] || 0) + 1;
      } else {
        counts.none++;
      }
    });
    
    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9'];
    
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value,
        color: COLORS[index % COLORS.length],
      }));
  }, [history]);

  if (data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">📊 Manipulation Type Distribution</h2>
        <div className="text-center text-gray-400 py-12">No manipulation detected yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">📊 Manipulation Type Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ReTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-xs text-gray-500 text-center">
        Most common manipulation tactics in your feed
      </div>
    </div>
  );
};

export default ManipulationChart;