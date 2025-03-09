import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { Bell, Sun, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type NotificationSettings = {
  emailNotifications: boolean;
  moodComments: boolean;
  moodLikes: boolean;
  newFollowers: boolean;
  productUpdates: boolean;
};

type AppearanceSettings = {
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  highContrast: boolean;
};

export default function AccountSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    moodComments: true,
    moodLikes: true,
    newFollowers: true,
    productUpdates: false,
  });
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'system',
    reducedMotion: false,
    highContrast: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/settings');
    }
  }, [status, router]);

  const fetchUserSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/account/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setNotifications(data.notifications || notifications);
      setAppearance(data.appearance || appearance);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [notifications, appearance]);

  useEffect(() => {
    if (session?.user) {
      fetchUserSettings();
    }
  }, [session, fetchUserSettings]);

  const saveNotificationSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/account/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });

      if (!response.ok) {
        throw new Error('Failed to save notification settings');
      }

      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAppearanceSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/account/settings/appearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appearance),
      });

      if (!response.ok) {
        throw new Error('Failed to save appearance settings');
      }

      toast.success('Appearance settings saved');

      // Apply theme changes
      document.documentElement.classList.remove('light', 'dark');
      if (appearance.theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        document.documentElement.classList.add(systemTheme);
      } else {
        document.documentElement.classList.add(appearance.theme);
      }
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    router.push('/auth/signout');
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const updateAppearanceSetting = (key: keyof AppearanceSettings, value: boolean | string) => {
    setAppearance(prev => ({ ...prev, [key]: value }));
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-10">
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Account Settings - MoodMash</title>
        <meta name="description" content="Manage your account settings" />
      </Head>
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64">
              <nav className="flex flex-col space-y-1">
                <Button variant="ghost" className="justify-start px-4 py-2 w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="ghost" className="justify-start px-4 py-2 w-full">
                  <Sun className="h-4 w-4 mr-2" />
                  Appearance
                </Button>
              </nav>

              <div className="mt-6">
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Manage how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-notifications" className="flex-1">
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </div>
                    </label>
                    <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:bg-primary">
                      <span className="sr-only">Toggle email notifications</span>
                      <input
                        type="checkbox"
                        id="email-notifications"
                        className="peer h-full w-full cursor-pointer opacity-0 absolute"
                        checked={notifications.emailNotifications}
                        onChange={e =>
                          updateNotificationSetting('emailNotifications', e.target.checked)
                        }
                      />
                      <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transform transition-transform data-checked:translate-x-5 translate-x-0.5 peer-checked:translate-x-5" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Notify me about</h4>

                    <div className="flex items-center justify-between">
                      <label htmlFor="mood-comments" className="flex-1">
                        Comments on my moods
                      </label>
                      <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:bg-primary">
                        <span className="sr-only">Toggle mood comments notifications</span>
                        <input
                          type="checkbox"
                          id="mood-comments"
                          className="peer h-full w-full cursor-pointer opacity-0 absolute"
                          checked={notifications.moodComments}
                          onChange={e =>
                            updateNotificationSetting('moodComments', e.target.checked)
                          }
                        />
                        <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transform transition-transform data-checked:translate-x-5 translate-x-0.5 peer-checked:translate-x-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="mood-likes" className="flex-1">
                        Likes on my moods
                      </label>
                      <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:bg-primary">
                        <span className="sr-only">Toggle mood likes notifications</span>
                        <input
                          type="checkbox"
                          id="mood-likes"
                          className="peer h-full w-full cursor-pointer opacity-0 absolute"
                          checked={notifications.moodLikes}
                          onChange={e => updateNotificationSetting('moodLikes', e.target.checked)}
                        />
                        <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transform transition-transform data-checked:translate-x-5 translate-x-0.5 peer-checked:translate-x-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="new-followers" className="flex-1">
                        New followers
                      </label>
                      <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:bg-primary">
                        <span className="sr-only">Toggle new followers notifications</span>
                        <input
                          type="checkbox"
                          id="new-followers"
                          className="peer h-full w-full cursor-pointer opacity-0 absolute"
                          checked={notifications.newFollowers}
                          onChange={e =>
                            updateNotificationSetting('newFollowers', e.target.checked)
                          }
                        />
                        <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transform transition-transform data-checked:translate-x-5 translate-x-0.5 peer-checked:translate-x-5" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="product-updates" className="flex-1">
                        <div>Product updates</div>
                        <div className="text-sm text-muted-foreground">
                          New features and improvements
                        </div>
                      </label>
                      <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:bg-primary">
                        <span className="sr-only">Toggle product updates notifications</span>
                        <input
                          type="checkbox"
                          id="product-updates"
                          className="peer h-full w-full cursor-pointer opacity-0 absolute"
                          checked={notifications.productUpdates}
                          onChange={e =>
                            updateNotificationSetting('productUpdates', e.target.checked)
                          }
                        />
                        <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transform transition-transform data-checked:translate-x-5 translate-x-0.5 peer-checked:translate-x-5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={saveNotificationSettings} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize how MoodMash looks for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="theme" className="text-sm font-medium">
                      Theme
                    </label>
                    <select
                      id="theme"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={appearance.theme}
                      onChange={e => updateAppearanceSetting('theme', e.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="reduced-motion" className="flex-1">
                      <div className="font-medium">Reduced Motion</div>
                      <div className="text-sm text-muted-foreground">
                        Reduce animation and motion effects
                      </div>
                    </label>
                    <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:bg-primary">
                      <span className="sr-only">Toggle reduced motion</span>
                      <input
                        type="checkbox"
                        id="reduced-motion"
                        className="peer h-full w-full cursor-pointer opacity-0 absolute"
                        checked={appearance.reducedMotion}
                        onChange={e => updateAppearanceSetting('reducedMotion', e.target.checked)}
                      />
                      <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transform transition-transform data-checked:translate-x-5 translate-x-0.5 peer-checked:translate-x-5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="high-contrast" className="flex-1">
                      <div className="font-medium">High Contrast</div>
                      <div className="text-sm text-muted-foreground">
                        Increase contrast for better readability
                      </div>
                    </label>
                    <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:bg-primary">
                      <span className="sr-only">Toggle high contrast</span>
                      <input
                        type="checkbox"
                        id="high-contrast"
                        className="peer h-full w-full cursor-pointer opacity-0 absolute"
                        checked={appearance.highContrast}
                        onChange={e => updateAppearanceSetting('highContrast', e.target.checked)}
                      />
                      <span className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transform transition-transform data-checked:translate-x-5 translate-x-0.5 peer-checked:translate-x-5" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={saveAppearanceSettings} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
