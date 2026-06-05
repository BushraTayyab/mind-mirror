import React from 'react';

const WeeklyReport = ({ report }) => {
  if (!report) return null;

  const getRiskLevel = (score) => {
    if (score < 0.2) return { text: 'Low Risk', color: 'bg-green-500' };
    if (score < 0.4) return { text: 'Moderate Risk', color: 'bg-yellow-500' };
    if (score < 0.6) return { text: 'High Risk', color: 'bg-orange-500' };
    return { text: 'Critical Risk', color: 'bg-red-500' };
  };

  const risk = getRiskLevel(report.avg_manipulation_score);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">📊 Weekly Manipulation Report</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Overall Risk Level:</span>
            <span className={`px-2 py-1 rounded text-white text-sm ${risk.color}`}>
              {risk.text}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all"
              style={{ width: `${report.avg_manipulation_score * 100}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-gray-500 text-sm">Total Posts Analyzed</div>
            <div className="text-2xl font-bold">{report.total_posts}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Manipulative Posts</div>
            <div className="text-2xl font-bold text-red-600">{report.manipulative_posts}</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Urgency Score</div>
            <div className="text-xl font-semibold">{(report.urgency_score * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Outrage Score</div>
            <div className="text-xl font-semibold">{(report.outrage_score * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Fear Score</div>
            <div className="text-xl font-semibold">{(report.fear_score * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Top Manipulation</div>
            <div className="text-xl font-semibold capitalize">{report.top_manipulation_type}</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Insight:</span>{' '}
            {report.manipulative_posts === 0 && "Great! No manipulative content detected this week."}
            {report.manipulative_posts > 0 && report.manipulative_posts < 5 && "Low levels of manipulation detected. Stay vigilant!"}
            {report.manipulative_posts >= 5 && "High levels of manipulation detected. Consider diversifying your information sources."}
            {report.avg_manipulation_score > 0.5 && "Your feed contains significant manipulative content. The 'Other Side' feature can help."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;