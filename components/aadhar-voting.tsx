"use client"

import { useState } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface AadharVotingProps {
  contract: ethers.Contract | null
  isVotingOpen: boolean
  candidatesInitialized: boolean
  onVoteSuccess: () => void
}

export function AadharVoting({ contract, isVotingOpen, candidatesInitialized, onVoteSuccess }: AadharVotingProps) {
  const [aadharNumber, setAadharNumber] = useState<string>("")
  const [selectedParty, setSelectedParty] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [status, setStatus] = useState<string>("")

  const handleVote = async () => {
    if (!contract || !aadharNumber || selectedParty === null) return

    // Validate Aadhar number (12 digits)
    if (!/^\d{12}$/.test(aadharNumber)) {
      setStatus("Error: Aadhar number must be exactly 12 digits")
      return
    }

    setLoading(true)
    setStatus("")

    try {
      setStatus("Casting vote with Aadhar...")

      let tx
      if (selectedParty === 1) {
        tx = await contract.voteParty1(aadharNumber)
      } else {
        tx = await contract.voteParty2(aadharNumber)
      }

      setStatus("Transaction submitted! Waiting for confirmation...")
      await tx.wait()
      setStatus("Vote successfully cast with Aadhar!")

      // Reset form
      setAadharNumber("")
      setSelectedParty(null)
      onVoteSuccess()
    } catch (error: any) {
      console.error("Error voting with Aadhar:", error)
      if (error.message.includes("already voted")) {
        setStatus("Error: This Aadhar number has already voted")
      } else if (error.message.includes("Voting is closed")) {
        setStatus("Error: Voting is currently closed")
      } else if (error.message.includes("Invalid Aadhar")) {
        setStatus("Error: Invalid Aadhar number format")
      } else {
        setStatus("Error casting vote. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const checkAadharStatus = async () => {
    if (!contract || !aadharNumber) return

    if (!/^\d{12}$/.test(aadharNumber)) {
      setStatus("Error: Aadhar number must be exactly 12 digits")
      return
    }

    try {
      const hasVoted = await contract.hasAadharVoted(aadharNumber)
      if (hasVoted) {
        setStatus("This Aadhar number has already voted")
      } else {
        setStatus("This Aadhar number is eligible to vote")
      }
    } catch (error) {
      console.error("Error checking Aadhar status:", error)
      setStatus("Error checking Aadhar status")
    }
  }

  const getStatusMessage = () => {
    if (!candidatesInitialized) return "Candidates not yet initialized by authorities"
    if (!isVotingOpen) return "Voting is currently closed"
    return null
  }

  const statusMessage = getStatusMessage()
  const canVote = candidatesInitialized && isVotingOpen

  return (
    <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5 text-green-400" />
          <span>Vote with Aadhar Number</span>
          {!isVotingOpen && <Clock className="h-5 w-5 text-amber-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusMessage ? (
          <div className={`text-center mb-4 ${!candidatesInitialized ? "text-blue-400" : "text-red-400"}`}>
            {statusMessage}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Aadhar Input */}
            <div className="space-y-2">
              <Label htmlFor="aadhar" className="text-sm font-medium">
                Aadhar Number (12 digits)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="aadhar"
                  value={aadharNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 12)
                    setAadharNumber(value)
                  }}
                  placeholder="Enter 12-digit Aadhar number"
                  className="bg-gray-700 border-gray-600"
                  disabled={loading}
                  maxLength={12}
                />
                <Button
                  onClick={checkAadharStatus}
                  disabled={!aadharNumber || aadharNumber.length !== 12 || loading}
                  variant="outline"
                  className="border-gray-600"
                >
                  Check
                </Button>
              </div>
              <p className="text-xs text-gray-400">Enter your 12-digit Aadhar number to vote</p>
            </div>

            {/* Party Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Select Party</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedParty === 1
                      ? "border-green-500 bg-green-900/20"
                      : canVote
                        ? "border-gray-700 hover:border-gray-600"
                        : "border-gray-700 opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => canVote && setSelectedParty(1)}
                >
                  <div className="text-center">
                    <div className="font-medium text-green-400">Party 1</div>
                    {selectedParty === 1 && <CheckCircle className="h-5 w-5 text-green-500 mx-auto mt-2" />}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedParty === 2
                      ? "border-purple-500 bg-purple-900/20"
                      : canVote
                        ? "border-gray-700 hover:border-gray-600"
                        : "border-gray-700 opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => canVote && setSelectedParty(2)}
                >
                  <div className="text-center">
                    <div className="font-medium text-purple-400">Party 2</div>
                    {selectedParty === 2 && <CheckCircle className="h-5 w-5 text-purple-500 mx-auto mt-2" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Vote Button */}
            <Button
              onClick={handleVote}
              disabled={!canVote || !aadharNumber || aadharNumber.length !== 12 || selectedParty === null || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Casting Vote..." : "Cast Vote with Aadhar"}
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {status && (
          <div
            className={`mt-4 text-sm flex items-center gap-2 p-3 rounded-lg ${
              status.includes("Error")
                ? "text-red-400 bg-red-900/20"
                : status.includes("success") || status.includes("eligible")
                  ? "text-green-400 bg-green-900/20"
                  : status.includes("already voted")
                    ? "text-amber-400 bg-amber-900/20"
                    : "text-blue-400 bg-blue-900/20"
            }`}
          >
            {status.includes("Error") ? (
              <AlertCircle className="h-4 w-4" />
            ) : status.includes("success") || status.includes("eligible") ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-400 animate-spin"></div>
            )}
            <span>{status}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
