import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as requested
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // For notifications
import { PHProvider } from './providers'; // PostHog (if used, otherwise remove)

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CustomsEX-p Assistant',
  description: 'Sistema de Examenes Previos by Jordy Stvaer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <PHProvider>
        <body className={`${inter.variable} font-sans antialiased grid-bg`}>
          {children}
          <Toaster />
        </body>
      </PHProvider>
    </html>
  );
}
