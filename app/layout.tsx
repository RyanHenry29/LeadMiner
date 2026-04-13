import type { Metadata, Viewport } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _syne = Syne({ subsets: ['latin'], variable: '--font-display' })
const _dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: {
    default: 'LeadMiner',
    template: '%s | LeadMiner',
  },
  description: 'Plataforma SaaS para captura e gestao de leads comerciais. Encontre clientes potenciais, organize seu CRM e automatize suas vendas.',
  keywords: ['leads', 'prospeccao', 'CRM', 'vendas', 'automacao', 'WhatsApp', 'negocios'],
  authors: [{ name: 'LeadMiner' }],
  creator: 'LeadMiner',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
