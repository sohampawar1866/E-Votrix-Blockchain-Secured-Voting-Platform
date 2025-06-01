"use client"

import { useState } from "react"
import { useWeb3 } from "@/context/Web3Context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VotingDApp() {
  const { account, contract, isConnected, connectWallet, votingData, loading, error } = useWeb3()
  const [aadhar, setAadhar] = useState("")
  const [isVoting, setIsVoting] = useState(false)
  const [message, setMessage] = useState("")
  const [authorityPurpose, setAuthorityPurpose] = useState("")

  const castVote = async (party: number) => {
    if (!contract || !aadhar) return

    try {
      setIsVoting(true)
      setMessage("Casting vote...")

      const tx = party === 1 ? await contract.voteParty1(aadhar) : await contract.voteParty2(aadhar)

      setMessage("Transaction pending...")
      await tx.wait()

      setMessage(`Vote cast successfully for Party ${party}!`)
      setAadhar("")
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsVoting(false)
    }
  }

  const verifyAuthority = async () => {
    if (!contract || !authorityPurpose) return

    try {
      const tx = await contract.toVerify(authorityPurpose)
      await tx.wait()
      setMessage("Authority verified successfully!")
      setAuthorityPurpose("")
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const toggleVoting = async (status: boolean) => {
    if (!contract) return

    try {
      const tx = await contract.toggleVoting(status)
      await tx.wait()
      setMessage(`Voting ${status ? "opened" : "closed"} successfully!`)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const finalizeElection = async () => {
    if (!contract) return

    try {
      const tx = await contract.finalizeElection()
      await tx.wait()
      setMessage("Election finalized successfully!")
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">🗳️ Evotrix Voting System</h1>
            <p className="text-gray-600">Secure blockchain-based voting platform</p>
          </div>

          {error && error.includes("Contract address not configured") && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                <div className="space-y-2">
                  <p>
                    <strong>Setup Required:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Deploy your Evotrix.sol contract in Remix IDE</li>
                    <li>Copy the deployed contract address</li>
                    <li>Add it to your environment: NEXT_PUBLIC_CONTRACT_ADDRESS=your_address</li>
                    <li>Or update lib/contract.ts directly with your address</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && !error.includes("Contract address not configured") && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Wallet Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={connectWallet} className="w-full" disabled={loading}>
                {loading ? "Connecting..." : "Connect MetaMask"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🗳️ Evotrix Voting System</h1>
          <p className="text-gray-600">Secure blockchain-based voting platform</p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Button onClick={connectWallet} className="w-full" disabled={loading}>
                {loading ? "Connecting..." : "Connect MetaMask"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Badge variant="default">
                  Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
                </Badge>
                <Button
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${account}`, "_blank")}
                  variant="outline"
                  size="sm"
                >
                  View on Etherscan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && votingData && (
          <Card>
            <CardHeader>
              <CardTitle>Live Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-3xl font-bold text-blue-600">{votingData.party1Votes}</h3>
                  <p className="text-blue-800 font-medium">Party 1 Votes</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h3 className="text-3xl font-bold text-red-600">{votingData.party2Votes}</h3>
                  <p className="text-red-800 font-medium">Party 2 Votes</p>
                </div>
              </div>
              <div className="mt-4 text-center space-x-2">
                <Badge variant={votingData.votingStatus ? "default" : "secondary"}>
                  Voting: {votingData.votingStatus ? "OPEN" : "CLOSED"}
                </Badge>
                <Badge variant={votingData.authoritiesFullyVerified ? "default" : "secondary"}>
                  Authorities: {votingData.authoritiesFullyVerified ? "VERIFIED" : "PENDING"}
                </Badge>
                <Badge variant="outline">Total Votes: {votingData.totalVotes}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {isConnected && votingData?.votingStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Enter your 12-digit Aadhar number:</label>
                <Input
                  type="text"
                  placeholder="123456789012"
                  value={aadhar}
                  onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  maxLength={12}
                />
                <p className="text-xs text-gray-500 mt-1">{aadhar.length}/12 digits entered</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => castVote(1)}
                  disabled={!aadhar || aadhar.length !== 12 || isVoting}
                  className="bg-blue-600 hover:bg-blue-700 h-16"
                >
                  {isVoting ? "Voting..." : "Vote Party 1"}
                </Button>
                <Button
                  onClick={() => castVote(2)}
                  disabled={!aadhar || aadhar.length !== 12 || isVoting}
                  className="bg-red-600 hover:bg-red-700 h-16"
                >
                  {isVoting ? "Voting..." : "Vote Party 2"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Authority Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Verification Purpose:</label>
                <Input
                  placeholder="e.g., Opening election for voting"
                  value={authorityPurpose}
                  onChange={(e) => setAuthorityPurpose(e.target.value)}
                />
                <Button onClick={verifyAuthority} disabled={!authorityPurpose} className="mt-2 w-full">
                  Verify Authority
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => toggleVoting(true)}
                  disabled={!votingData?.authoritiesFullyVerified}
                  variant="outline"
                >
                  Open Voting
                </Button>
                <Button
                  onClick={() => toggleVoting(false)}
                  disabled={!votingData?.authoritiesFullyVerified}
                  variant="outline"
                >
                  Close Voting
                </Button>
                <Button
                  onClick={finalizeElection}
                  disabled={!votingData?.authoritiesFullyVerified || votingData?.votingStatus}
                  variant="outline"
                >
                  Finalize Election
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
