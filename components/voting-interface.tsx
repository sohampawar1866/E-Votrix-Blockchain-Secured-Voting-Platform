"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, AlertCircle, Clock } from "lucide-react"

interface Candidate {
  id: number
  name: string
  voteCount: number
}

interface VotingInterfaceProps {
  candidates: Candidate[]
  castVote: (candidateId: number) => Promise<void>
  votingStatus: string
  account: string
  isVotingOpen: boolean
  candidatesInitialized: boolean
}

export function VotingInterface({
  candidates,
  castVote,
  votingStatus,
  account,
  isVotingOpen,
  candidatesInitialized,
}: VotingInterfaceProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)
  const [isVoting, setIsVoting] = useState<boolean>(false)

  const handleVote = async () => {
    if (selectedCandidate === null) return

    setIsVoting(true)
    try {
      await castVote(selectedCandidate)
    } finally {
      setIsVoting(false)
    }
  }

  const getStatusMessage = () => {
    if (!account) return "Please connect your wallet to vote"
    if (!candidatesInitialized) return "Candidates not yet initialized by authorities"
    if (!isVotingOpen) return "Voting is currently closed"
    return null
  }

  const statusMessage = getStatusMessage()
  const canVote = account && candidatesInitialized && isVotingOpen

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
          <span>Cast Your Vote (Wallet)</span>
          {!isVotingOpen && <Clock className="h-5 w-5 text-amber-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusMessage ? (
          <div
            className={`text-center mb-4 ${
              !account ? "text-amber-400" : !candidatesInitialized ? "text-blue-400" : "text-red-400"
            }`}
          >
            {statusMessage}
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCandidate === candidate.id
                      ? "border-blue-500 bg-blue-900/20"
                      : canVote
                        ? "border-gray-700 hover:border-gray-600"
                        : "border-gray-700 opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => canVote && setSelectedCandidate(candidate.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{candidate.name}</span>
                      <div className="text-sm text-gray-400">Current votes: {candidate.voteCount}</div>
                    </div>
                    {selectedCandidate === candidate.id && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleVote}
              disabled={!canVote || selectedCandidate === null || isVoting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isVoting ? "Voting..." : "Submit Vote"}
            </Button>
          </>
        )}

        {votingStatus && (
          <div
            className={`mt-4 text-sm flex items-center gap-2 ${
              votingStatus.includes("Error")
                ? "text-red-400"
                : votingStatus.includes("success")
                  ? "text-green-400"
                  : "text-blue-400"
            }`}
          >
            {votingStatus.includes("Error") ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-400 animate-spin"></div>
            )}
            <span>{votingStatus}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
