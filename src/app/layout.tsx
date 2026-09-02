import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-ar',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://omino.app'),
  title: {
    default: 'OMINO — AI Business OS',
    template: '%s · OMINO',
  },
  description:
    'One intelligent system for your business. Run POS, store, inventory, CRM, payments, analytics, AI, automations, and marketing from one platform.',
  openGraph: {
    title: 'OMINO — AI Business OS',
    description:
      'One intelligent system for your business. POS, store, inventory, CRM, payments, analytics, AI, automations, and marketing — unified.',
    siteName: 'OMINO',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/main/img/favicon-32.png',
    apple: '/main/img/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable} ${mono.variable} ${arabic.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
