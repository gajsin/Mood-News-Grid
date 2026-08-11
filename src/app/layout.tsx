import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mood News Grid — Реальные новости в 5 эмоциональных режимах',
  description:
    'Агрегатор реальных новостей из 6 рубрик с возможностью чтения в нейтральном, радостном, грустном, ироничном и удивлённом тонах с двухэтапным контролем фактов.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
