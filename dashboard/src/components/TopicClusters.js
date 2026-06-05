import React, { useMemo } from 'react';

const TopicClusters = ({ history }) => {
  const topics = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Simple keyword-based topic clustering
    const keywords = {
      politics: ['trump', 'biden', 'election', 'democrat', 'republican', 'vote', 'political', 'government', 'congress', 'senate'],
      climate: ['climate', 'global warming', 'environment', 'carbon', 'renewable', 'green', 'earth', 'nature', 'sustainable'],
      technology: ['ai', 'tech', 'software', 'app', 'digital', 'internet', 'computer', 'programming', 'cyber', 'data'],
      health: ['health', 'medical', 'doctor', 'hospital', 'vaccine', 'covid', 'wellness', 'fitness', 'diet', 'mental'],
      business: ['money', 'business', 'finance', 'market', 'economy', 'invest', 'stock', 'crypto', 'startup', 'wealth'],
      entertainment: ['movie', 'show', 'celeb', 'hollywood', 'music', 'artist', 'streaming', 'netflix', 'game', 'sport'],
    };
    
    const clusterScores = {};
    
    history.forEach(item => {
      const text = item.text.toLowerCase();
      for (const [topic, words] of Object.entries(keywords)) {
        let score = 0;
        words.forEach(word => {
          if (text.includes(word)) score += 1;
        });
        if (score > 0) {
          if (!clusterScores[topic]) clusterScores[topic] = { totalScore: 0, count: 0, manipulative: 0 };
          clusterScores[topic].totalScore += score;
          clusterScores[topic].count++;
          if (item.manipulation_score > 0.5) clusterScores[topic].manipulative++;
        }
      }
    });
    
    return Object.entries(clusterScores)
      .map(([topic, data]) => ({
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        avgManipulation: data.manipulative / data.count,
        count: data.count,
        manipulationRate: ((data.manipulative / data.count) * 100).toFixed(0),
      }))
      .sort((a, b) => b.avgManipulation - a.avgManipulation)
      .slice(0, 5);
  }, [history]);

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">🏷️ Topic Clusters</h2>
        <div className="text-center text-gray-400 py-8">Analyzing topics in your feed...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🏷️ Topics with Highest Manipulation</h2>
      <div className="space-y-4">
        {topics.map((topic, idx) => (
          <div key={idx}>
            <div className="flex justify-between mb-1">
              <span className="font-medium">{topic.topic}</span>
              <span className="text-sm text-gray-600">
                {topic.manipulationRate}% manipulative ({topic.count} posts)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${topic.manipulationRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <span className="font-semibold">💡 Insight:</span> These topics show the highest rates of manipulation in your feed. Consider seeking diverse sources for these subjects.
      </div>
    </div>
  );
};

export default TopicClusters;