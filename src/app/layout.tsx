
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist to Inter
import './globals.css';
import { AppProviders } from '@/components/auth-provider';

const inter = Inter({ // Changed from geistSans to inter
  variable: '--font-inter', // Changed variable name
  subsets: ['latin'],
});

// Geist Mono can be removed if not explicitly needed elsewhere, or kept if desired for mono spacing
// For now, let's assume Inter is the primary font for everything.
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'CustomsEX-p | Facturación local', // Updated title
  description: 'Sistema de EXAMENES PREVIOS para facturación local.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}> {/* Using Inter font variable */}
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
