import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '250 Card Game Scoring App',
  description: 'Mobile-friendly scoring app for the 250/Partner card game with dynamic partnerships and flexible scoring rules',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}