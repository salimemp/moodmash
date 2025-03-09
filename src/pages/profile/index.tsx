import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { Edit, Settings, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userMoods, setUserMoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUserMoods();
    }
  }, [session]);

  const fetchUserMoods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/moods/user');

      if (!response.ok) {
        throw new Error('Failed to fetch user moods');
      }

      const data = await response.json();
      setUserMoods(data.moods || []);
    } catch (error) {
      console.error('Error fetching user moods:', error);
      toast.error('Failed to load your moods');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated' || !session) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  const user = session.user as ExtendedUser;

  return (
    <>
      <Head>
        <title>My Profile - MoodMash</title>
        <meta name="description" content="View and manage your profile" />
      </Head>
      <MainLayout>
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex justify-between items-center">
                    <span>Profile</span>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/profile/edit')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                    {user.image ? (
                      <Image src={user.image} alt="Profile picture" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold">{user.name || 'Anonymous User'}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="w-full pt-4">
                    <p className="text-sm font-medium mb-2">Bio</p>
                    <p className="text-sm text-muted-foreground">
                      {user.bio || 'No bio yet. Click edit to add one!'}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 px-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/profile/edit')}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/account/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/account/security')}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Security
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* User Content */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>My Moods</CardTitle>
                    <CardDescription>All the moods you&apos;ve shared on MoodMash</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p>Loading your moods...</p>
                    ) : userMoods.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Mood cards would go here */}
                        <p>Your moods will be displayed here</p>
                      </div>
                    ) : (
                      <p>You haven&apos;t shared any moods yet!</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Mashes</CardTitle>
                    <CardDescription>Your mood mashups</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Your mood mashes will be displayed here</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stats</CardTitle>
                    <CardDescription>Your mood trends and statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Your mood statistics will be displayed here</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
