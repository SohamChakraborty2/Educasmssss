
import React from 'react';

interface Recommendation {
  topic: string;
  description: string;
}

interface PersonalizedRecommendationsProps {
  stats: {
    questions: number;
    accuracy: number;
    streak: number;
    bestStreak: number;
    avgTime: number;
  };
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ stats }) => {
  const recommendations: Recommendation[] = [];

  if (stats.accuracy < 50) {
    recommendations.push({
      topic: 'Review Basics',
      description: 'Try practicing basic concepts to improve accuracy.',
    });
  }
  if (stats.streak < 2) {
    recommendations.push({
      topic: 'Practice Fundamentals',
      description: 'Focus on simple questions to build confidence.',
    });
  }
  if (stats.avgTime > 20) {
    recommendations.push({
      topic: 'Speed Drills',
      description: 'Practice with time constraints to improve speed.',
    });
  }

  if (recommendations.length === 0) {
    return <div className="text-sm text-green-400">Great job! No recommendations at this time.</div>;
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg mt-4">
      <h3 className="text-lg font-bold text-white mb-2">Recommendations</h3>
      {recommendations.map((rec, idx) => (
        <div key={idx} className="mb-1">
          <h4 className="text-sm font-semibold text-primary">{rec.topic}</h4>
          <p className="text-xs text-gray-300">{rec.description}</p>
        </div>
      ))}
    </div>
  );
};
//Personalized Recommendations – A component that suggests topics for further practice based on performance.