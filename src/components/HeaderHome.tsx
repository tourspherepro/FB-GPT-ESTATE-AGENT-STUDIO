
"use client";

import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import { Loader2, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";


export default function HeaderHome() {
  const { user, userProfile, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-gradient-to-br from-cyan-500/95 via-blue-600/95 to-indigo-700/95 shadow-lg backdrop-blur-sm" : "bg-transparent"
    )}>
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
              <h1 className="font-heading text-2xl tracking-tight">EASTUDIO</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-grow justify-center items-center gap-8 text-sm font-medium">
            <Link className="text-white/80 hover:text-white transition-colors" href="/features">Features</Link>
            <Link className="text-white/80 hover:text-white transition-colors" href="/pricing">Pricing</Link>
            <Link className="text-white/80 hover:text-white transition-colors" href="/signup">Contact</Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex flex-shrink-0 items-center justify-end gap-4">
          {loading ? (
             <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : !user ? (
            <>
              <Link href="/login" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Sign In</Link>
              <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-md text-white font-medium text-sm shadow hover:brightness-110 transition-transform hover:scale-105">
                Get Started Free
              </Link>
            </>
          ) : userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-white/50">
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
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          )}
          </div>
          
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-900 text-white border-slate-700 w-[250px] sm:w-[300px]">
                     <nav className="flex flex-col gap-6 text-lg font-medium mt-10">
                        <SheetClose asChild>
                            <Link className="text-white/80 hover:text-white transition-colors" href="/features">Features</Link>
                        </SheetClose>
                        <SheetClose asChild>
                            <Link className="text-white/80 hover:text-white transition-colors" href="/pricing">Pricing</Link>
                        </SheetClose>
                        <SheetClose asChild>
                            <Link className="text-white/80 hover:text-white transition-colors" href="/signup">Contact</Link>
                        </SheetClose>
                     </nav>
                     <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col gap-4">
                        {loading ? (
                            <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : !user ? (
                            <>
                                <SheetClose asChild>
                                    <Link href="/login" className="text-center w-full py-2.5 rounded-md text-white/80 bg-white/10 hover:bg-white/20 transition-colors">
                                        Sign In
                                    </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                     <Link href="/signup" className="text-center w-full py-2.5 rounded-md text-white bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-110 transition-colors">
                                        Get Started Free
                                    </Link>
                                </SheetClose>
                            </>
                        ) : (
                             <SheetClose asChild>
                                <Link href="/dashboard" className="text-center w-full py-2.5 rounded-md text-white bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-110 transition-colors">
                                    Go to Dashboard
                                </Link>
                            </SheetClose>
                        )}
                     </div>
                </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
}
