import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cottage Visit Calendar',
  description: 'Private visit planning calendar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
