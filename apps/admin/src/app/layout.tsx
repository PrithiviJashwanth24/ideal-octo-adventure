import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FitCheck Admin',
  description: 'FitCheck Platform Intelligence Console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0A0A0B' }}>{children}</body>
    </html>
  );
}
