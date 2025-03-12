import { MainLayout } from '@/components/layout/main-layout';
import { MoodFeed } from '@/components/mood/mood-feed';
import { MoodCreatorModal } from '@/components/mood/mood-creator-modal';
import { Button } from '@/components/ui/button/button';
import { PlusIcon } from 'lucide-react';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>MoodMash - Share Your Mood</title>
        <meta
          name="description"
          content="A social platform enabling users to share their moods anonymously through interactive visuals"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainLayout>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Welcome to MoodMash</h1>
            <MoodCreatorModal
              trigger={
                <Button className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Create Mood
                </Button>
              }
            />
          </div>
          <p className="text-muted-foreground">
            Express yourself anonymously through color, emoji, and text. Share your feelings and
            connect with others.
          </p>
          <MoodFeed />
        </div>
      </MainLayout>
    </>
  );
}
