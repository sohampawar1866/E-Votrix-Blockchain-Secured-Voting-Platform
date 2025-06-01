"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, AlertCircle } from "lucide-react"

interface ConnectWalletProps {
  account: string
  setAccount: (account: string) => void
  setSigner: (signer: ethers.Signer) => void
  setContract: (contract: ethers.Contract) => void
  contractAddress: string
  contractABI: any[]
}

export function ConnectWallet({
  account,
  setAccount,
  setSigner,
  setContract,
  contractAddress,
  contractABI,
}: ConnectWalletProps) {
  const [error, setError] = useState<string>("")
  const [connecting, setConnecting] = useState<boolean>(false)

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed. Please install MetaMask to use this dApp.")
      return
    }

    setConnecting(true)
    setError("")

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

      // Check if we're on the right network (Sepolia)
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      if (chainId !== "0xaa36a7") {
        // Sepolia chainId
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }], // Sepolia
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xaa36a7",
                  chainName: "Sepolia Testnet",
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, contractABI, signer)

      setAccount(accounts[0])
      setSigner(signer)
      setContract(contract)
    } catch (error) {
      console.error("Error connecting to wallet:", error)
      setError("Failed to connect wallet. Please try again.")
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-400" />
            <span className="font-medium">Wallet Connection</span>
          </div>

          {account ? (
            <div className="flex flex-col items-center md:items-end">
              <span className="text-sm text-green-400">Connected</span>
              <span className="text-xs text-gray-400 truncate max-w-[200px]">{account}</span>
            </div>
          ) : (
            <Button onClick={connectWallet} disabled={connecting} className="bg-blue-600 hover:bg-blue-700">
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
