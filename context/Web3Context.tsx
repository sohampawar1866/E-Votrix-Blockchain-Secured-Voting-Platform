"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { ethers } from "ethers"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract"

interface VotingData {
  party1Votes: number
  party2Votes: number
  votingStatus: boolean
  authoritiesFullyVerified: boolean
  totalVotes: number
}

interface Web3ContextType {
  account: string | null
  contract: ethers.Contract | null
  isConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  votingData: VotingData | null
  loading: boolean
  error: string | null
}

const Web3Context = createContext<Web3ContextType | null>(null)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [votingData, setVotingData] = useState<VotingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeConnection()
  }, [])

  useEffect(() => {
    if (!contract) return

    const updateVotingData = async () => {
      try {
        if (!contract) return

        const [party1, party2, systemStatus] = await Promise.all([
          contract.vote_count_party1(),
          contract.vote_count_party2(),
          contract.getSystemStatus(),
        ])

        setVotingData({
          party1Votes: Number(party1),
          party2Votes: Number(party2),
          votingStatus: systemStatus.votingStatus,
          authoritiesFullyVerified: systemStatus.authoritiesFullyVerified,
          totalVotes: Number(party1) + Number(party2),
        })

        // Clear any previous errors if data loads successfully
        setError(null)
      } catch (error: any) {
        console.error("Error updating voting data:", error)
        if (error.code === "CALL_EXCEPTION") {
          setError("Contract call failed. Please check if the contract is deployed correctly.")
        } else if (error.code === "NETWORK_ERROR") {
          setError("Network error. Please check your internet connection.")
        } else {
          setError("Failed to load voting data. Please refresh and try again.")
        }
      }
    }

    contract.on("VoteCast", updateVotingData)
    contract.on("VotingStatusChanged", updateVotingData)
    contract.on("AuthorityVerified", updateVotingData)

    updateVotingData()

    return () => {
      contract.removeAllListeners()
    }
  }, [contract])

  const initializeConnection = async () => {
    if (typeof window.ethereum === "undefined") return

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      })

      if (accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
        await setupContract()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", () => window.location.reload())
    } catch (error) {
      console.error("Initialization failed:", error)
    }
  }

  const setupContract = async () => {
    try {
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
        setError(
          "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment variables.",
        )
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Auto-detect network - no chain ID needed!
      const network = await provider.getNetwork()
      console.log("Connected to network:", network.name, "Chain ID:", network.chainId)

      // Validate and checksum the contract address
      let validAddress: string
      try {
        validAddress = ethers.getAddress(CONTRACT_ADDRESS)
      } catch (addressError) {
        setError(`Invalid contract address: ${CONTRACT_ADDRESS}. Please check your contract address.`)
        return
      }

      const contractInstance = new ethers.Contract(validAddress, CONTRACT_ABI, signer)

      // Test contract connection
      try {
        await contractInstance.vote_count_party1()
        setContract(contractInstance)
        setError(null)
      } catch (contractError) {
        setError(
          "Contract not found at this address. Please verify the contract is deployed and the address is correct.",
        )
        console.error("Contract test failed:", contractError)
      }
    } catch (error) {
      console.error("Contract setup failed:", error)
      setError("Failed to setup contract connection")
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask not installed")
      return
    }

    try {
      setLoading(true)
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      setAccount(accounts[0])
      setIsConnected(true)
      await setupContract()

      localStorage.setItem("metamask_connected", "true")
      setError(null)
    } catch (error: any) {
      console.error("Connection failed:", error)
      setError("Failed to connect wallet")
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setContract(null)
    setIsConnected(false)
    setVotingData(null)
    localStorage.removeItem("metamask_connected")
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setAccount(accounts[0])
      setupContract()
    }
  }

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        isConnected,
        connectWallet,
        disconnectWallet,
        votingData,
        loading,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider")
  }
  return context
}
