import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/card';
import { Button } from '@/components/ui/button/button';
import { PageMeta } from '@/components/SEO/PageMeta';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';
import { usePreferences } from '@/lib/hooks/usePreferences';
import { useStreamingData } from '@/lib/api/streaming';
import { api } from '@/lib/api/client';
import { useFetch } from '@/lib/hooks/useFetch';
import { toast } from 'sonner';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

// Define the notification type
interface StreamingNotification {
  type: string;
  message: string;
  timestamp: string;
  [key: string]: any; // Allow other properties
}

// Dashboard component using our custom implementations
export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { 
    preferences, 
    updatePreferences, 
    isLoading: prefsLoading, 
    isSaving: prefsSaving,
    error: prefsError,
    refetch: refetchPreferences 
  } = usePreferences();
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Use our custom fetch hook for data
  const { 
    data: dashboardData, 
    error: dashboardError, 
    isValidating,
    mutate: refreshDashboardData 
  } = useFetch(
    '/api/dashboard/stats',
    { revalidateOnFocus: true }
  );
  
  // Use our custom streaming implementation for real-time updates
  const { 
    data: streamData, 
    error: streamError, 
    isConnected: streamConnected 
  } = useStreamingData<StreamingNotification>('/api/streaming/notifications', {
    onMessage: (data) => {
      if (data.type === 'notification') {
        setNotifications((prev) => [data, ...prev].slice(0, 10));
        
        // Show toast for new notifications when they arrive
        toast.info('New notification', {
          description: data.message,
          duration: 4000,
        });
      }
    }
  });
  
  // Check auth status
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
    }
  }, [status, router]);

  // Show error toast if preferences failed to load
  useEffect(() => {
    if (prefsError) {
      toast.error('Failed to load preferences', {
        description: 'Default settings will be used. You can try refreshing the page.',
        duration: 5000,
      });
    }
  }, [prefsError]);
  
  // Toggle theme preference handler with optimistic update
  const toggleTheme = useCallback(async () => {
    if (prefsLoading || prefsSaving) return;
    
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      // Error is handled in the hook with toast notifications
      console.error('Failed to update theme preference:', error);
    }
  }, [preferences.theme, updatePreferences, prefsLoading, prefsSaving]);
  
  // Refresh all dashboard data
  const refreshAllData = useCallback(async () => {
    toast.info('Refreshing dashboard data...');
    
    try {
      await Promise.all([
        refetchPreferences(),
        refreshDashboardData()
      ]);
      toast.success('Dashboard data refreshed');
    } catch (error) {
      toast.error('Failed to refresh some data');
    }
  }, [refetchPreferences, refreshDashboardData]);
  
  // Mock triggering a notification
  const triggerNotification = useCallback(async () => {
    try {
      const toastId = toast.loading('Sending test notification...');
      await api.post('/api/test/notification', {
        message: `Test notification at ${new Date().toLocaleTimeString()}`,
      });
      toast.success('Test notification sent', { id: toastId });
    } catch (error) {
      toast.error('Failed to send test notification', {
        description: 'Please try again later.'
      });
      console.error('Failed to trigger notification:', error);
    }
  }, []);
  
  // Handle loading state
  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Show login message if not authenticated
  if (status === 'unauthenticated') {
    return null; // Redirect handled by useEffect
  }
  
  return (
    <>
      <PageMeta 
        title="Dashboard" 
        description="Your personal MoodMash dashboard" 
        structuredData={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Dashboard', url: '/dashboard' },
        ])}
      />
      
      <MainLayout>
        <div className="container py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            <Button 
              variant="outline" 
              onClick={refreshAllData}
              disabled={isValidating || prefsLoading}
              className="flex items-center gap-2"
            >
              {(isValidating || prefsLoading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Your Stats</span>
                  {dashboardError && (
                    <span className="text-red-500 flex items-center">
                      <AlertCircle className="h-4 w-4" aria-label="Error loading stats" />
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardError ? (
                  <div className="text-red-500 flex flex-col gap-2">
                    <p>Failed to load stats</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => refreshDashboardData()}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : isValidating ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
                  </div>
                ) : dashboardData ? (
                  <div className="space-y-2">
                    <p>Moods shared: {dashboardData.moodCount || 0}</p>
                    <p>Likes received: {dashboardData.likesReceived || 0}</p>
                    <p>Comments received: {dashboardData.commentsReceived || 0}</p>
                  </div>
                ) : (
                  <p>No stats available</p>
                )}
              </CardContent>
            </Card>
            
            {/* Theme Preference Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Preferences</span>
                  {prefsError && (
                    <span className="text-red-500 flex items-center">
                      <AlertCircle className="h-4 w-4" aria-label="Error loading preferences" />
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prefsLoading ? (
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Current theme:</span>
                      <span className="font-medium capitalize">{preferences.theme || 'system'}</span>
                    </div>
                    
                    <Button 
                      onClick={toggleTheme} 
                      disabled={prefsLoading || prefsSaving}
                      className="w-full"
                    >
                      {prefsSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>Switch to {preferences.theme === 'dark' ? 'Light' : 'Dark'} Mode</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Notifications Card */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className={`h-2 w-2 rounded-full ${streamConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                  title={streamConnected ? 'Connected' : 'Not connected'}>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {streamConnected ? (
                        <span className="text-green-500">
                          Connected to real-time updates
                        </span>
                      ) : (
                        <span className="text-red-500">
                          Not connected
                        </span>
                      )}
                    </span>
                    
                    <Button 
                      size="sm" 
                      onClick={triggerNotification}
                      disabled={!streamConnected}
                    >
                      Test
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                    {notifications.length > 0 ? (
                      notifications.map((notification, i) => (
                        <div key={i} className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                          <p>{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center p-4">
                        {streamConnected ? 'No notifications yet' : 'Connect to receive notifications'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </>
  );
} 