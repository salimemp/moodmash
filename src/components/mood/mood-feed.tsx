'use client';

import { MoodCard } from './mood-card';

// Sample mood data for demonstration
const sampleMoods = [
  {
    id: '1',
    gradientColors: ['#FF9843', '#FC5678'],
    emoji: '😊',
    text: 'Feeling happy and excited today!',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likes: 24,
    comments: 5,
  },
  {
    id: '2',
    gradientColors: ['#4299E1', '#3182CE'],
    emoji: '😌',
    text: 'Peaceful and relaxed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likes: 12,
    comments: 3,
  },
  {
    id: '3',
    gradientColors: ['#805AD5', '#6B46C1'],
    emoji: '🤔',
    text: 'Contemplating life decisions',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    likes: 8,
    comments: 1,
  },
  {
    id: '4',
    gradientColors: ['#48BB78', '#38A169'],
    emoji: '🌱',
    text: 'New beginnings',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    likes: 42,
    comments: 7,
  },
];

export function MoodFeed() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recent Moods</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sampleMoods.map((mood) => (
          <MoodCard 
            key={mood.id} 
            id={mood.id}
            gradientColors={mood.gradientColors}
            emoji={mood.emoji}
            text={mood.text}
            createdAt={mood.createdAt}
            likes={mood.likes}
            comments={mood.comments}
          />
        ))}
      </div>
    </div>
  );
} 