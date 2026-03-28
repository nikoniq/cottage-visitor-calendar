import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'Cottage Visit Calendar',
    template: '%s | Cottage Visit Calendar',
  },
  description: 'Private visit planning calendar',
  applicationName: 'Cottage Visit Calendar',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
