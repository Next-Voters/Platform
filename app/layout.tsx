import { type Metadata, type Viewport } from 'next'
import { Plus_Jakarta_Sans, Dancing_Script } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Root from '@/components/common/root'
import { AuthProvider } from '@/wrappers/AuthProvider'
import { SubscriptionProvider } from '@/wrappers/SubscriptionProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Next Voters',
    template: '%s | Next Voters',
  },
  description:
    'Next Voters helps students and young voters understand legislation, public policy, and North American politics through clear summaries and nonpartisan analysis. Get free civic education and policy alerts.',
  keywords: [
    'civic education',
    'political literacy',
    'public policy explained',
    'legislation summaries',
    'voter education',
    'youth politics',
    'North American politics',
    'nonpartisan political analysis',
    'student civic engagement',
    'policy analysis',
    'Gen Z voting',
    'civic alerts',
  ],
  authors: [{ name: 'Hemit Patel' }, { name: 'Krishiv Thakuria' }],
  creator: 'Next Voters',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: 'Next Voters',
    description:
      'Understand legislation and public policy with clear summaries built for students and everyday voters. Subscribe to free civic alerts.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Next Voters',
    url: 'https://nextvoters.com',
    images: ['/logo/nextvoters.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next Voters | Civic Education & Policy Analysis',
    description:
      'Clear explanations of legislation and public policy for the next generation of voters. Free civic alerts.',
    images: ['/logo/nextvoters.png'],
  },
  metadataBase: new URL('https://nextvoters.com'),
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dancingScript.variable}`}
    >
      <body className="antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18024404483"
          strategy="beforeInteractive"
        />
        <Script id="gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18024404483');
          `}
        </Script>
        <AuthProvider>
          <SubscriptionProvider>
            <Root>{children}</Root>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
