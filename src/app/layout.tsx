import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gram - Interactive Grammar Learning',
  description: 'Learn grammar interactively with Gram',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}