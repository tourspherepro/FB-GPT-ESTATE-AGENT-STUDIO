
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, LogOut, ArrowLeft, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, logout, loading } = useAuth();

  const navItems = [
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/signup" },
  ];

  // App-specific header for dashboard and other tool pages
  const isAppView = [
    '/dashboard',
    '/admin',
    '/ea-valuation',
    '/floor-plan-maestro',
    '/ea-image-pro',
    '/ea-360',
    '/ea-analyse',
    '/socials',
    '/eacanvass',
    '/create-post',
    '/posts',
    '/dashboard/users',
    '/profile',
  ].some(route => pathname.startsWith(route));
  
  const showBackButton = isAppView && pathname !== '/dashboard';


  if (isAppView) {
      return (
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center">
                  <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-primary">EASTUDIO</span>
                    </Link>
                    {showBackButton && (
                      <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-muted-foreground">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-end space-x-4">
                      {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : user && userProfile ? (
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                  <Avatar className="h-10 w-10">
                                  <AvatarImage src={userProfile.avatar || user.photoURL || undefined} alt={userProfile.name || user.displayName || 'User'} />
                                  <AvatarFallback>{userProfile.name?.charAt(0) || user.displayName?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56" align="end" forceMount>
                              <DropdownMenuLabel className="font-normal">
                                  <div className="flex flex-col space-y-1">
                                  <p className="text-sm font-medium leading-none">{userProfile.name || user.displayName}</p>
                                  <p className="text-xs leading-none text-muted-foreground">
                                      {userProfile.email || user.email}
                                  </p>
                                  </div>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                                  Dashboard
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push('/profile')}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                              </DropdownMenuItem>
                              {userProfile.role === 'admin' && (
                                <DropdownMenuItem onClick={() => router.push('/admin')}>
                                    Admin Settings
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={logout}>
                                  <LogOut className="mr-2 h-4 w-4" />
                                  <span>Log out</span>
                              </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      ) : null}
                  </div>
              </div>
          </header>
      );
  }

  // Special header for the features page to match its hero
  if (pathname === '/features') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-6 sm:px-8 relative z-10">
          <div className="flex h-20 items-center">
            <div className="w-1/3">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
                <h1 className="font-heading text-2xl tracking-tight">EASTUDIO</h1>
              </Link>
            </div>
            <nav className="hidden md:flex w-1/3 justify-center items-center gap-8 text-sm font-medium">
              {navItems.map((item) => (
                 <Link
                  key={item.name}
                  href={item.path}
                  className={cn("transition-colors", pathname === item.path ? "text-white" : "text-white/80 hover:text-white")}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="w-1/3 flex items-center justify-end gap-4">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : user ? (
                <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
              ) : (
                <>
                  <Link href="/login" className="text-white/80 hover:text-white transition-colors">Sign In</Link>
                  <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-md text-white font-medium shadow hover:brightness-110 transition-transform hover:scale-105">
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Default public-facing header for other pages like /pricing
  return (
    <header className="sticky top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200/80">
      <div className="container mx-auto flex h-20 items-center">
        <div className="w-1/3">
           <Link href="/" className="text-2xl font-bold text-primary">EASTUDIO</Link>
        </div>
        <nav className="hidden md:flex w-1/3 justify-center items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={cn("transition-colors", pathname === item.path ? "text-primary font-semibold" : "text-foreground/80 hover:text-primary")}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="w-1/3 flex items-center justify-end gap-3">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          ) : user ? (
             <Button onClick={() => router.push('/dashboard')}>Dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
