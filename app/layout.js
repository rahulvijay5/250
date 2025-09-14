import { Inter } from 'next/font/google'
import Head from 'next/head'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '250 Card Game Scoring App',
  description: 'Mobile-friendly scoring app for the 250/Partner card game with dynamic partnerships and flexible scoring rules',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="favicon.ico" />
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}