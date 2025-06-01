"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ConnectWallet } from "@/components/connect-wallet"
import { VotingInterface } from "@/components/voting-interface"
import { ResultsDisplay } from "@/components/results-display"
import { AuthorityPanel } from "@/components/authority-panel"
import { AadharVoting } from "@/components/aadhar-voting"
import { contractABI } from "@/lib/contract-abi"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [candidates, setCandidates] = useState<{ id: number; name: string; voteCount: number }[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [votingStatus, setVotingStatus] = useState<string>("")
  const [isVotingOpen, setIsVotingOpen] = useState<boolean>(false)
  const [isAuthority, setIsAuthority] = useState<boolean>(false)
  const [candidatesInitialized, setCandidatesInitialized] = useState<boolean>(false)
  const [votingStats, setVotingStats] = useState({
    totalVotes: 0,
    party1Votes: 0,
    party2Votes: 0,
    isVotingOpen: false,
    areResultsFinalized: false,
  })

  const contractAddress = "0xF35D3AeBe878088D01B618076BBb6B4ed76bda47" // Your deployed Evotrix contract

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          setProvider(provider)

          const signer = await provider.getSigner()
          setSigner(signer)

          const contract = new ethers.Contract(contractAddress, contractABI, signer)
          setContract(contract)

          const address = await signer.getAddress()
          setAccount(address)

          // Check if user is an authority with error handling
          try {
            // First check if the function exists
            if (typeof contract.isAuthority === "function") {
              const authorityStatus = await contract.isAuthority(address)
              setIsAuthority(authorityStatus)
            } else {
              console.log("isAuthority function not available in contract")
              setIsAuthority(false)
            }
          } catch (error) {
            console.log("Could not check authority status:", error)
            setIsAuthority(false)
          }

          await loadContractData(contract)

          // Listen for vote events with error handling
          try {
            contract.on("VoteCast", (voter, candidateId, totalVotes) => {
              console.log("Vote cast event:", { voter, candidateId, totalVotes })
              updateCandidateVotes(Number(candidateId), Number(totalVotes))
              loadVotingStats(contract)
            })

            // Listen for voting status changes
            contract.on("VotingStatusChanged", (status, timestamp) => {
              console.log("Voting status changed:", { status, timestamp })
              setIsVotingOpen(status)
              loadVotingStats(contract)
            })
          } catch (error) {
            console.log("Could not set up event listeners:", error)
          }

          setLoading(false)
        } catch (error) {
          console.error("Error initializing:", error)
          setLoading(false)
        }
      } else {
        console.log("Please install MetaMask")
        setLoading(false)
      }
    }

    init()

    return () => {
      if (contract) {
        try {
          contract.removeAllListeners()
        } catch (error) {
          console.log("Error removing listeners:", error)
        }
      }
    }
  }, [])

  const loadContractData = async (contract: ethers.Contract) => {
    try {
      // Check if candidates are initialized
      try {
        const candidateCount = await contract.getCandidateCount()
        setCandidatesInitialized(Number(candidateCount) > 0)

        if (Number(candidateCount) > 0) {
          await loadCandidates(contract)
        }
      } catch (error) {
        console.log("Could not load candidate count:", error)
        setCandidatesInitialized(false)
      }

      // Load voting stats
      await loadVotingStats(contract)

      // Check voting status
      try {
        const votingOpen = await contract.voting()
        setIsVotingOpen(votingOpen)
      } catch (error) {
        console.log("Could not check voting status:", error)
        setIsVotingOpen(false)
      }
    } catch (error) {
      console.error("Error loading contract data:", error)
    }
  }

  const loadCandidates = async (contract: ethers.Contract) => {
    try {
      const candidateCount = await contract.getCandidateCount()
      const candidatesArray = []

      for (let i = 1; i <= Number(candidateCount); i++) {
        try {
          const candidate = await contract.getCandidate(i)
          candidatesArray.push({
            id: Number(candidate.id),
            name: candidate.name,
            voteCount: Number(candidate.voteCount),
          })
        } catch (error) {
          console.log(`Could not load candidate ${i}:`, error)
        }
      }

      setCandidates(candidatesArray)
    } catch (error) {
      console.error("Error loading candidates:", error)
    }
  }

  const loadVotingStats = async (contract: ethers.Contract) => {
    try {
      // Try to use getVotingStats if available
      if (typeof contract.getVotingStats === "function") {
        const stats = await contract.getVotingStats()
        setVotingStats({
          totalVotes: Number(stats.totalVotes),
          party1Votes: Number(stats.party1Votes),
          party2Votes: Number(stats.party2Votes),
          isVotingOpen: stats.isVotingOpen,
          areResultsFinalized: stats.areResultsFinalized,
        })
      } else {
        // Fallback to individual function calls
        try {
          const party1Votes = await contract.vote_count_party1()
          const party2Votes = await contract.vote_count_party2()
          const votingOpen = await contract.voting()

          setVotingStats({
            totalVotes: Number(party1Votes) + Number(party2Votes),
            party1Votes: Number(party1Votes),
            party2Votes: Number(party2Votes),
            isVotingOpen: votingOpen,
            areResultsFinalized: false,
          })
        } catch (error) {
          console.log("Could not load voting stats:", error)
        }
      }
    } catch (error) {
      console.error("Error loading voting stats:", error)
    }
  }

  const castVote = async (candidateId: number) => {
    if (!contract || !signer) return

    try {
      setVotingStatus("Casting your vote...")

      // Check if voting is open
      const votingOpen = await contract.voting()
      if (!votingOpen) {
        setVotingStatus("Error: Voting is currently closed")
        return
      }

      const tx = await contract.vote(candidateId)

      // Optimistically update UI
      updateCandidateVotes(candidateId, 1, true)

      setVotingStatus("Transaction submitted! Waiting for confirmation...")
      await tx.wait()
      setVotingStatus("Vote successfully cast!")

      // Reload data to get accurate counts
      await loadContractData(contract)
    } catch (error: any) {
      console.error("Error voting:", error)
      if (error.message.includes("You have already voted")) {
        setVotingStatus("Error: You have already voted")
      } else if (error.message.includes("Voting is closed")) {
        setVotingStatus("Error: Voting is currently closed")
      } else if (error.message.includes("revert")) {
        setVotingStatus("Error: Transaction reverted. Check voting requirements.")
      } else {
        setVotingStatus("Error casting vote. Please try again.")
      }

      // Revert optimistic update if there was an error
      if (contract) {
        await loadCandidates(contract)
      }
    }
  }

  const updateCandidateVotes = (candidateId: number, newVoteCount: number, isOptimistic = false) => {
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              voteCount: isOptimistic ? candidate.voteCount + 1 : newVoteCount,
            }
          : candidate,
      ),
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Evotrix - Decentralized Voting dApp</h1>

        <ConnectWallet
          account={account}
          setAccount={setAccount}
          setSigner={setSigner}
          setContract={setContract}
          contractAddress={contractAddress}
          contractABI={contractABI}
        />

        {loading ? (
          <div className="text-center mt-8">Loading...</div>
        ) : (
          <div className="mt-8">
            {/* Voting Status Card */}
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{votingStats.totalVotes}</div>
                    <div className="text-sm text-gray-400">Total Votes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{votingStats.party1Votes}</div>
                    <div className="text-sm text-gray-400">Party 1</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{votingStats.party2Votes}</div>
                    <div className="text-sm text-gray-400">Party 2</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${isVotingOpen ? "text-green-400" : "text-red-400"}`}>
                      {isVotingOpen ? "OPEN" : "CLOSED"}
                    </div>
                    <div className="text-sm text-gray-400">Voting Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="vote" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="vote">Wallet Vote</TabsTrigger>
                <TabsTrigger value="aadhar">Aadhar Vote</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="vote" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <VotingInterface
                    candidates={candidates}
                    castVote={castVote}
                    votingStatus={votingStatus}
                    account={account}
                    isVotingOpen={isVotingOpen}
                    candidatesInitialized={candidatesInitialized}
                  />
                  <ResultsDisplay candidates={candidates} />
                </div>
              </TabsContent>

              <TabsContent value="aadhar" className="mt-6">
                <AadharVoting
                  contract={contract}
                  isVotingOpen={isVotingOpen}
                  candidatesInitialized={candidatesInitialized}
                  onVoteSuccess={() => loadContractData(contract!)}
                />
              </TabsContent>

              <TabsContent value="results" className="mt-6">
                <ResultsDisplay candidates={candidates} showDetailed={true} />
              </TabsContent>

              <TabsContent value="admin" className="mt-6">
                <AuthorityPanel
                  contract={contract}
                  account={account}
                  candidatesInitialized={candidatesInitialized}
                  isVotingOpen={isVotingOpen}
                  onStatusChange={() => loadContractData(contract!)}
                  isAuthority={isAuthority}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  )
}
