import { MainLayout } from '@/components/layout/main-layout';
import EnhancedMoodCreator from '@/components/mood/EnhancedMoodCreator';
import Head from 'next/head';

export default function EnhancedMoodPage() {
  // Function to handle mood creation
  const handleCreateMood = async (moodData: {
    text: string;
    emoji: string;
    gradientColors: string[];
    abstractArt: string;
    sentiment: number;
  }) => {
    // In a real app, this would send the data to an API
    console.log('Mood created:', moodData);
    // For demo purposes, just log the data
    alert('Mood created successfully!');
  };

  return (
    <>
      <Head>
        <title>Enhanced Mood Creator - MoodMash</title>
        <meta
          name="description"
          content="Create expressive moods with advanced sentiment analysis and art generation"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainLayout>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Enhanced Mood Creator</h1>
          </div>
          <p className="text-muted-foreground">
            Express yourself with our advanced mood creation tool that analyzes your sentiment and generates custom visuals.
          </p>
          <EnhancedMoodCreator onCreateMood={handleCreateMood} />
        </div>
      </MainLayout>
    </>
  );
} 