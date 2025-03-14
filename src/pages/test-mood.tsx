import EnhancedMoodCreator from '@/components/mood/EnhancedMoodCreator';
import Head from 'next/head';

export default function TestMoodPage() {
  const handleCreateMood = async (moodData: {
    text: string;
    emoji: string;
    gradientColors: string[];
    abstractArt: string;
    sentiment: number;
  }) => {
    console.log('Mood created:', moodData);
    alert('Mood created successfully!');
  };

  return (
    <>
      <Head>
        <title>Test Page - MoodMash</title>
        <meta name="description" content="A test page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Test Page</h1>
        <p className="mb-4">
          This is a simple test page to verify the EnhancedMoodCreator component.
        </p>
        <div className="mt-8">
          <EnhancedMoodCreator onCreateMood={handleCreateMood} />
        </div>
      </div>
    </>
  );
} 