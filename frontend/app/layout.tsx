import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'VaultX – Identity Intelligence Platform',
  description: 'Real-time fraud detection via device fingerprinting, behavioral biometrics, and AI-powered risk scoring.',
  keywords: ['fraud detection', 'identity verification', 'behavioral biometrics', 'risk scoring', 'AI security'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${outfit.variable}`}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
