import type { Metadata } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

import Navigation from '@/components/Navigation'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gather — Local Meetup RSVP',
  description: 'Find local meetups, RSVP, and connect with your community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="antialiased min-h-screen flex flex-col relative overflow-x-hidden">
        
        <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border" style={{ boxShadow: 'var(--shadow-nav)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/events" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:rounded-lg">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold font-serif" aria-hidden="true">G</span>
                  <span className="font-serif text-xl font-semibold text-ink group-hover:text-primary transition-colors duration-200">
                    Gather
                  </span>
                </Link>
              </div>
              <Navigation />
            </div>
          </div>
        </nav>

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          {children}
        </main>
        
        {/* Subtle warm background texture */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[50%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[35%] rounded-full bg-accent/8 blur-[90px]" />
        </div>
      </body>
    </html>
  )
}
