"use client";

import Link from "next/link";
import { Linkedin, Twitter, Youtube } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Do not render the footer on specific tool/app pages that have their own or no footer
  const appRoutes = [
    '/dashboard',
    '/admin',
    '/ea-valuation',
    '/floor-plan-maestro',
    '/ea-image-pro',
    '/ea-360',
    '/ea-analyse',
    '/socials',
    '/create-post',
    '/posts',
    '/tour',
    '/dashboard/users',
    '/login',
    '/signup'
  ];

  if (appRoutes.some(route => pathname.startsWith(route))) {
    return null;
  }
  
  // Do not render footer on the homepage as it has its own
  if (pathname === '/') {
    return (
      <footer className="bg-background py-8 border-t">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>(c) estateagent.tools 2025</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto py-12 px-6 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <h3 className="font-heading text-xl tracking-tight text-foreground">EASTUDIO</h3>
                    <p className="mt-2 text-muted-foreground text-sm">For estate agents, built by estate agents.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Quick Links</h4>
                    <ul className="mt-4 space-y-2 text-sm">
                        <li><Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
                        <li><Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
                        <li><Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Follow Us</h4>
                    <div className="mt-4 flex space-x-4">
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Linkedin className="h-6 w-6" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter className="h-6 w-6" />
                        </Link>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Youtube className="h-6 w-6" />
                        </Link>
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
                <p>(c) estateagent.tools 2025</p>
            </div>
        </div>
      </footer>
  );
}