"use client"

import { useState } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Play, Square, CheckCircle, AlertCircle } from "lucide-react"

interface AuthorityPanelProps {
  contract: ethers.Contract | null
  account: string
  candidatesInitialized: boolean
  isVotingOpen: boolean
  onStatusChange: () => void
  isAuthority?: boolean
}

export function AuthorityPanel({
  contract,
  account,
  candidatesInitialized,
  isVotingOpen,
  onStatusChange,
  isAuthority = false,
}: AuthorityPanelProps) {
  const [purpose, setPurpose] = useState<string>("")
  const [loading, setLoading] = useState<string>("")
  const [status, setStatus] = useState<string>("")

  const handleInitializeCandidates = async () => {
    if (!contract) return

    setLoading("init")
    setStatus("")

    try {
      const tx = await contract.initializeCandidates()
      setStatus("Initializing candidates...")
      await tx.wait()
      setStatus("Candidates initialized successfully!")
      onStatusChange()
    } catch (error: any) {
      console.error("Error initializing candidates:", error)
      if (error.message.includes("already initialized")) {
        setStatus("Error: Candidates already initialized")
      } else if (error.message.includes("Only authorities")) {
        setStatus("Error: Only authorities can initialize candidates")
      } else {
        setStatus("Error initializing candidates")
      }
    } finally {
      setLoading("")
    }
  }

  const handleVerify = async () => {
    if (!contract || !purpose.trim()) return

    setLoading("verify")
    setStatus("")

    try {
      const tx = await contract.toVerify(purpose)
      setStatus("Submitting verification...")
      await tx.wait()
      setStatus("Verification submitted successfully!")
      setPurpose("")
      onStatusChange()
    } catch (error: any) {
      console.error("Error verifying:", error)
      if (error.message.includes("Already verified")) {
        setStatus("Error: You have already verified")
      } else if (error.message.includes("Only authorities")) {
        setStatus("Error: Only authorities can verify")
      } else {
        setStatus("Error submitting verification")
      }
    } finally {
      setLoading("")
    }
  }

  const handleToggleVoting = async (newStatus: boolean) => {
    if (!contract) return

    setLoading("toggle")
    setStatus("")

    try {
      const tx = await contract.toggleVoting(newStatus)
      setStatus(`${newStatus ? "Opening" : "Closing"} voting...`)
      await tx.wait()
      setStatus(`Voting ${newStatus ? "opened" : "closed"} successfully!`)
      onStatusChange()
    } catch (error: any) {
      console.error("Error toggling voting:", error)
      if (error.message.includes("All authorities must verify")) {
        setStatus("Error: All authorities must verify first")
      } else if (error.message.includes("Only authorities")) {
        setStatus("Error: Only authorities can toggle voting")
      } else {
        setStatus(`Error ${newStatus ? "opening" : "closing"} voting`)
      }
    } finally {
      setLoading("")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Authority Panel
            {!isAuthority && <span className="text-sm text-amber-400 ml-2">(Authority status unknown)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authority Status Warning */}
          {!isAuthority && (
            <div className="p-3 bg-amber-900/20 border border-amber-700 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Authority status could not be verified. You may still try these functions if you are an authority.
                </span>
              </div>
            </div>
          )}

          {/* Initialize Candidates */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Initialize Candidates</Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleInitializeCandidates}
                disabled={candidatesInitialized || loading === "init"}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading === "init" ? "Initializing..." : "Initialize Candidates"}
              </Button>
              {candidatesInitialized && <CheckCircle className="h-5 w-5 text-green-400" />}
            </div>
            <p className="text-xs text-gray-400">
              {candidatesInitialized
                ? "Candidates have been initialized"
                : "Initialize Party 1 and Party 2 as candidates"}
            </p>
          </div>

          {/* Authority Verification */}
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-sm font-medium">
              Authority Verification
            </Label>
            <div className="flex gap-2">
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter verification purpose..."
                className="bg-gray-700 border-gray-600"
                disabled={loading === "verify"}
              />
              <Button
                onClick={handleVerify}
                disabled={!purpose.trim() || loading === "verify"}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading === "verify" ? "Verifying..." : "Verify"}
              </Button>
            </div>
            <p className="text-xs text-gray-400">All authorities must verify before voting can be toggled</p>
          </div>

          {/* Voting Control */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Voting Control</Label>
            <div className="flex gap-2">
              <Button
                onClick={() => handleToggleVoting(true)}
                disabled={!candidatesInitialized || isVotingOpen || loading === "toggle"}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {loading === "toggle" ? "Processing..." : "Open Voting"}
              </Button>
              <Button
                onClick={() => handleToggleVoting(false)}
                disabled={!isVotingOpen || loading === "toggle"}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                {loading === "toggle" ? "Processing..." : "Close Voting"}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Current status: {isVotingOpen ? "Voting is OPEN" : "Voting is CLOSED"}
            </p>
          </div>

          {/* Status Messages */}
          {status && (
            <div
              className={`text-sm flex items-center gap-2 p-3 rounded-lg ${
                status.includes("Error")
                  ? "text-red-400 bg-red-900/20"
                  : status.includes("success")
                    ? "text-green-400 bg-green-900/20"
                    : "text-blue-400 bg-blue-900/20"
              }`}
            >
              {status.includes("Error") ? (
                <AlertCircle className="h-4 w-4" />
              ) : status.includes("success") ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-400 animate-spin"></div>
              )}
              <span>{status}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
