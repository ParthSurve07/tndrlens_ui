import type { Metadata } from 'next';
import '@/index.css';
import '@/App.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export const metadata: Metadata = {
  title: 'TndrLens | Procurement Intelligence Platform',
  description: 'AI-Powered Procurement Analysis & Tender Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-bg text-[var(--text-color)] font-sans antialiased overflow-x-hidden min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
