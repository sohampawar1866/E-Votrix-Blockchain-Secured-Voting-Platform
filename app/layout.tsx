import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'E-Votrix: Secure Blockchain Voting on Ethereum Sepolia',
  description: 'Created By Soham Pawar',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
