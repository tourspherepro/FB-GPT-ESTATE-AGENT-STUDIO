import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ClientLayout } from '@/components/client-layout';
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: 'EASTUDIO - AI Suite for Estate Agents',
  description: 'Streamline your real estate workflow with AI-powered tools for valuations, floor plans, image enhancement, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-inter antialiased">
        <FirebaseClientProvider>
          <AuthProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
