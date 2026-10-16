import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dolan Archives',
  description: 'A personal academic writing and research archive.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
