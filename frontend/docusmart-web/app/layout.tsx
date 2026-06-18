import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import NotificationsProvider from '@/components/ui/notifications-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DocuSmart Intelligence',
  description:
    'Triagem inteligente de sinistros de seguro auto — envio de documentos, painel do analista e assistente SAC. Projeto educacional (Hack2Hire 2026).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning={true}>
      <body className={`${inter.variable} h-full antialiased`}>
        {children}
        <NotificationsProvider />
      </body>
    </html>
  );
}
