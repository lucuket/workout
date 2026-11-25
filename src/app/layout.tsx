import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import PwaRegister from '@/components/layout/PwaRegister';
import { withBasePath } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'ApexLift - Gym Workout Tracker',
  description: 'Mobile-first PWA gym workout tracker with offline logging, analytics, and plate calculator',
  manifest: withBasePath('/manifest.json'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ApexLift',
  },
  icons: {
    icon: withBasePath('/icons/icon-192.svg'),
    apple: withBasePath('/icons/icon-192.svg'),
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-zinc-950">
        <PwaRegister />
        <Header />
        <main className="flex-1 pb-24 max-w-xl mx-auto w-full px-4 pt-4">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
