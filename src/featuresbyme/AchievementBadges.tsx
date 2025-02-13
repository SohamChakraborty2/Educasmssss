
import React from 'react';

interface Badge {
  name: string;
  description: string;
  icon: string; // You can use an emoji or an icon component here
}

interface AchievementBadgesProps {
  stats: {
    questions: number;
    accuracy: number;
    streak: number;
    bestStreak: number;
    avgTime: number;
  };
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ stats }) => {
  const badges: Badge[] = [];

  if (stats.bestStreak >= 5) {
    badges.push({
      name: 'Streak Master',
      description: 'Achieved a high streak!',
      icon: '🔥',
    });
  }
  if (stats.avgTime < 10 && stats.questions > 0) {
    badges.push({
      name: 'Quick Thinker',
      description: 'Answered quickly!',
      icon: '⚡',
    });
  }
  if (stats.accuracy >= 90 && stats.questions > 0) {
    badges.push({
      name: 'Accuracy Ace',
      description: 'High accuracy rate!',
      icon: '🏆',
    });
  }

  if (badges.length === 0) {
    return <div className="text-sm text-gray-400">No achievements yet. Keep practicing!</div>;
  }

  return (
    <div className="flex space-x-4 p-2">
      {badges.map((badge, index) => (
        <div key={index} className="flex flex-col items-center">
          <span className="text-2xl">{badge.icon}</span>
          <span className="text-xs">{badge.name}</span>
        </div>
      ))}
    </div>
  );
};
//Achievement Badges – A component that displays badges when certain milestones are met.
