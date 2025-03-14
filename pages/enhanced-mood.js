import React from 'react';
import EnhancedMoodCreator from '../src/components/mood/EnhancedMoodCreator';

export default function EnhancedMoodPage() {
  const handleCreateMood = async (moodData) => {
    console.log('Mood created:', moodData);
    alert('Mood created successfully!');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Enhanced Mood Creator
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        Express yourself with our advanced mood creation tool that analyzes your sentiment and generates custom visuals.
      </p>
      <EnhancedMoodCreator onCreateMood={handleCreateMood} />
    </div>
  );
} 