"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, RefreshCw, AlertCircle } from "lucide-react"

export default function WalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  const connectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Wait for page to fully load
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Check if any wallet is available
      if (typeof window === "undefined") {
        throw new Error("Please run this in a browser environment.")
      }

      // Check for various wallet providers
      const hasMetaMask = window.ethereum?.isMetaMask
      const hasWallet = window.ethereum
      const hasCoinbase = window.ethereum?.isCoinbaseWallet

      if (!hasWallet) {
        throw new Error(
          "No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet extension.",
        )
      }

      // Add delay to prevent rapid requests that trigger circuit breaker
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Request account access with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout. Please try again.")), 10000),
      )

      const accountsPromise = window.ethereum.request({
        method: "eth_requestAccounts",
      })

      const accounts = await Promise.race([accountsPromise, timeoutPromise])

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet and try again.")
      }

      setAccount(accounts[0])
    } catch (err: any) {
      console.error("Wallet connection error:", err)

      // Handle specific error types
      if (err.message?.includes("No Web3 wallet detected")) {
        setError(err.message)
      } else if (err.message?.includes("circuit breaker") || err.code === "UNKNOWN_ERROR") {
        setError(
          "Wallet is temporarily unavailable due to safety measures. Please wait 30 seconds and try again, or restart your wallet extension.",
        )
      } else if (err.code === 4001) {
        setError("Connection rejected. Please approve the connection in your wallet.")
      } else if (err.code === -32002) {
        setError("Connection request already pending. Please check your wallet for a pending request.")
      } else if (err.message?.includes("timeout")) {
        setError("Connection timed out. Please ensure your wallet is unlocked and try again.")
      } else {
        setError(err.message || "Failed to connect wallet. Please try again.")
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const checkWalletAvailability = () => {
    if (typeof window === "undefined") return { available: false, type: "none" }

    if (window.ethereum?.isMetaMask) {
      return { available: true, type: "MetaMask" }
    } else if (window.ethereum?.isCoinbaseWallet) {
      return { available: true, type: "Coinbase Wallet" }
    } else if (window.ethereum) {
      return { available: true, type: "Web3 Wallet" }
    }

    return { available: false, type: "none" }
  }

  const walletInfo = checkWalletAvailability()

  const disconnectWallet = () => {
    setAccount(null)
    setError(null)
  }

  const retryConnection = async () => {
    // Wait longer before retry to give circuit breaker time to reset
    await new Promise((resolve) => setTimeout(resolve, 2000))
    connectWallet()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6" />
            Wallet Connection
          </CardTitle>
          <CardDescription>Connect your Web3 wallet to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {account ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">Connected to {walletInfo.type}</p>
                <p className="text-xs text-green-600 font-mono break-all">{account}</p>
              </div>
              <Button onClick={disconnectWallet} variant="outline" className="w-full">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {!walletInfo.available ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No Web3 wallet detected. Please install a wallet extension to continue.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Popular wallet options:</p>
                    <div className="space-y-2">
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">MetaMask</div>
                        <div className="text-sm text-gray-600">Most popular Web3 wallet</div>
                      </a>
                      <a
                        href="https://www.coinbase.com/wallet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">Coinbase Wallet</div>
                        <div className="text-sm text-gray-600">User-friendly option</div>
                      </a>
                    </div>
                  </div>

                  <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Page After Installing
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">{walletInfo.type} detected and ready to connect</p>
                  </div>

                  <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
                    {isConnecting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      `Connect ${walletInfo.type}`
                    )}
                  </Button>

                  {error?.includes("circuit breaker") && (
                    <Button onClick={retryConnection} variant="outline" className="w-full" disabled={isConnecting}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Connection (Wait 30s)
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-2">
            <p>
              <strong>Troubleshooting tips:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Restart your wallet extension</li>
              <li>Switch networks and switch back</li>
              <li>Clear browser cache</li>
              <li>Disable and re-enable the extension</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
