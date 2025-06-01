import type React from "react"
import { Web3Provider } from "@/context/Web3Context"
import "./globals.css"

export const metadata = {
  title: "Evotrix - Blockchain Voting System",
  description: "Secure and transparent blockchain-based voting platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  )
}
