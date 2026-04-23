import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antigravity AI – Identity Intelligence Platform',
  description: 'Real-time fraud detection via device fingerprinting, behavioral biometrics, and AI-powered risk scoring.',
  keywords: ['fraud detection', 'identity verification', 'behavioral biometrics', 'risk scoring', 'AI security'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
