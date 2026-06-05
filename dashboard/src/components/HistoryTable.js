import React, { useState } from 'react';

const HistoryTable = ({ history }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredHistory = history.filter(item => {
    if (filter !== 'all' && item.manipulation_type !== filter) return false;
    if (search && !item.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getManipulationBadge = (score) => {
    if (score < 0.2) return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Low</span>;
    if (score < 0.5) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Medium</span>;
    return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">High</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">📜 Detection History</h2>
      
      <div className="flex gap-4 mb-4">
        <select
          className="px-3 py-2 border rounded-lg"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="urgency">Urgency</option>
          <option value="fear">Fear</option>
          <option value="outrage">Outrage</option>
          <option value="us_vs_them">Us vs Them</option>
          <option value="scarcity">Scarcity</option>
        </select>
        
        <input
          type="text"
          placeholder="Search posts..."
          className="flex-1 px-3 py-2 border rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Time</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Platform</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Content Preview</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Manipulation</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Score</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No detection history found
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm capitalize">{item.platform}</td>
                  <td className="px-4 py-2 text-sm max-w-md truncate">
                    {item.text.substring(0, 80)}...
                  </td>
                  <td className="px-4 py-2 text-sm capitalize">{item.manipulation_type || 'none'}</td>
                  <td className="px-4 py-2 text-sm">
                    {getManipulationBadge(item.manipulation_score)}
                    <span className="ml-2 text-xs text-gray-500">
                      {(item.manipulation_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.sentiment}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredHistory.length} of {history.length} analyzed posts
      </div>
    </div>
  );
};

export default HistoryTable;