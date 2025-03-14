import React from 'react';
import EnhancedMoodCreator from '../src/components/mood/EnhancedMoodCreator';

export default function TestMoodPage() {
  const handleCreateMood = async (moodData) => {
    console.log('Mood created:', moodData);
    alert('Mood created successfully!');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Test Mood Page
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        This is a simple test page to verify the EnhancedMoodCreator component.
      </p>
      <EnhancedMoodCreator onCreateMood={handleCreateMood} />
    </div>
  );
} 