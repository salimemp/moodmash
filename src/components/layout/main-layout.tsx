'use client';

import { ReactNode, useState } from 'react';
import { useTheme } from '@/lib/providers/theme-provider';
import { Button } from '@/components/ui/button/button';
import { MoonIcon, SunIcon, UserIcon, LogOutIcon, LogInIcon, MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from '@/components/ui/modal/dialog';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme, setTheme } = useTheme();
  const session = useSession()?.data;
  const status = useSession()?.status || 'unauthenticated';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold">MoodMash</Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-primary">
                Home
              </Link>
              <Link href="/explore" className="text-sm font-medium hover:text-primary">
                Explore
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="text-sm font-medium hover:text-primary">
                    Profile
                  </Link>
                </>
              )}
            </nav>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </Button>
              
              {status === 'loading' ? (
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse"></div>
              ) : session ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {session.user?.image ? (
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || 'User'} 
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5" />
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-56 p-0">
                    <div className="p-4 border-b">
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link href="/profile" className="w-full">
                        <Button variant="ghost" className="w-full justify-start">
                          <UserIcon className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={handleSignOut}
                      >
                        <LogOutIcon className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button asChild>
                  <Link href="/auth/signin">
                    <LogInIcon className="mr-2 h-4 w-4" />
                    Sign in
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container py-4 space-y-4">
              <nav className="flex flex-col space-y-4">
                <Link 
                  href="/" 
                  className="text-sm font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  className="text-sm font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explore
                </Link>
                {session && (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="text-sm font-medium hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-sm font-medium hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                )}
              </nav>
              
              <div className="pt-4 border-t">
                {status === 'loading' ? (
                  <div className="h-9 w-full bg-muted animate-pulse rounded"></div>
                ) : session ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {session.user?.image ? (
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || 'User'} 
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 p-1 bg-muted rounded-full" />
                      )}
                      <div>
                        <p className="font-medium">{session.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleSignOut}
                    >
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/auth/signin">
                      <LogInIcon className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="container py-6">
        {children}
      </main>
      <footer className="border-t bg-background">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MoodMash App
        </div>
      </footer>
    </div>
  );
} 