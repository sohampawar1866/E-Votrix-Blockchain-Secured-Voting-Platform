"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, ExternalLink, Loader2, AlertCircle, CheckCircle, Vote, Users, Trophy } from "lucide-react"

// Your Voting Contract ABI (Updated with security fixes)
const VOTING_CONTRACT_ABI = [
  // View functions
  "function voting() view returns (bool)",
  "function resultsFinalized() view returns (bool)",
  "function hasVoted(address) view returns (bool)",
  "function votes(address) view returns (uint8)",
  "function authorities(uint256) view returns (address)",
  "function isSigned(address) view returns (bool)",
  "function isAuthority(address) view returns (bool)",
  "function party1VoteCount() view returns (uint256)",
  "function party2VoteCount() view returns (uint256)",
  
  // Authority functions
  "function toVerify(string memory _purpose) public",
  "function has_All_Verified() view returns (bool)",
  "function toggleVoting(bool _status) public",
  "function emergencyStop() public",
  
  // Voting functions
  "function get_Voter_address(uint256 aadhar) view returns (address)",
  "function voteParty1(uint256 aadhar) public",
  "function voteParty2(uint256 aadhar) public",
  "function hasAadharVoted(uint256 aadhar) view returns (bool)",
  
  // Results functions
  "function getAllDeployedContractsParty1() view returns (address[])",
  "function getAllDeployedContractsParty2() view returns (address[])",
  "function getVoterFromParty1Contract(address partyAddress) view returns (address)",
  "function getVoterFromParty2Contract(address partyAddress) view returns (address)",
  "function vote_count_party1() view returns (uint256)",
  "function vote_count_party2() view returns (uint256)",
  "function winner() view returns (string)",
  "function finalizeResults() returns (string)",
  "function getVotingStats() view returns (uint256, uint256, uint256, bool, bool)",
  
  // Events
  "event VoteCast(address indexed voter, uint8 party, uint256 timestamp)",
  "event VotingStatusChanged(bool status, uint256 timestamp)",
  "event AuthorityVerified(address indexed authority, string purpose)",
  "event WinnerDeclared(string result, uint256 timestamp)"
]

// Replace with your deployed voting contract address
const VOTING_CONTRACT_ADDRESS = "0x2Aa7554A04fBcc129294e331d4dB0Af8b4d37eEB"

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function VotingDAppPage() {
  // Web3 state
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [balance, setBalance] = useState<string>("")
  const [network, setNetwork] = useState<string>("")
  
  // Voting state
  const [votingStatus, setVotingStatus] = useState<boolean>(false)
  const [resultsFinalized, setResultsFinalized] = useState<boolean>(false)
  const [allVerified, setAllVerified] = useState<boolean>(false)
  const [isUserAuthority, setIsUserAuthority] = useState<boolean>(false)
  const [hasUserSigned, setHasUserSigned] = useState<boolean>(false)
  const [party1Votes, setParty1Votes] = useState<number>(0)
  const [party2Votes, setParty2Votes] = useState<number>(0)
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [winner, setWinner] = useState<string>("")
  
  // Form inputs
  const [aadharNumber, setAadharNumber] = useState<string>("")
  const [voterAddress, setVoterAddress] = useState<string>("")
  const [hasAadharVoted, setHasAadharVoted] = useState<boolean>(false)
  const [verificationPurpose, setVerificationPurpose] = useState<string>("")
  
  // Loading states
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed. Please install MetaMask to continue.")
      return
    }

    setIsConnecting(true)
    setError("")

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      // Check if we're on Sepolia
      if (network.chainId !== 11155111n) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xaa36a7",
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "SepoliaETH",
                    symbol: "SEP",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            })
          }
        }
      }

      const balance = await provider.getBalance(address)

      setProvider(provider)
      setSigner(signer)
      setAccount(address)
      setBalance(ethers.formatEther(balance))
      setNetwork(network.name)

      // Initialize voting contract
      const contractInstance = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI, signer)
      setContract(contractInstance)

      // Load contract data
      await loadVotingData(contractInstance, address)
    } catch (error: any) {
      setError(`Failed to connect wallet: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const loadVotingData = async (contractInstance: ethers.Contract, userAddress: string) => {
    setIsLoading(true)
    try {
      const [
        votingStatus,
        resultsFinalized,
        allVerified,
        isAuthority,
        isSigned,
        stats
      ] = await Promise.all([
        contractInstance.voting(),
        contractInstance.resultsFinalized(),
        contractInstance.has_All_Verified(),
        contractInstance.isAuthority(userAddress),
        contractInstance.isSigned(userAddress),
        contractInstance.getVotingStats()
      ])

      setVotingStatus(votingStatus)
      setResultsFinalized(resultsFinalized)
      setAllVerified(allVerified)
      setIsUserAuthority(isAuthority)
      setHasUserSigned(isSigned)
      
      // Parse voting stats
      setTotalVotes(Number(stats[0]))
      setParty1Votes(Number(stats[1]))
      setParty2Votes(Number(stats[2]))

      // Get winner if voting is closed
      if (!votingStatus && resultsFinalized) {
        try {
          const winnerResult = await contractInstance.winner()
          setWinner(winnerResult)
        } catch (error) {
          console.log("Winner not yet declared")
        }
      }
    } catch (error: any) {
      setError(`Failed to load voting data: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateVoterAddress = async () => {
    if (!contract || !aadharNumber || aadharNumber.length !== 12) {
      setError("Please enter a valid 12-digit Aadhar number")
      return
    }

    try {
      const [voterAddr, hasVoted] = await Promise.all([
        contract.get_Voter_address(aadharNumber),
        contract.hasAadharVoted(aadharNumber)
      ])
      
      setVoterAddress(voterAddr)
      setHasAadharVoted(hasVoted)
      setSuccess(`Voter address generated: ${voterAddr}`)
      
      if (hasVoted) {
        setError("This Aadhar number has already voted!")
      }
    } catch (error: any) {
      setError(`Failed to generate voter address: ${error.message}`)
    }
  }

  const verifyAsAuthority = async () => {
    if (!contract || !verificationPurpose.trim()) {
      setError("Please enter verification purpose")
      return
    }

    if (!isUserAuthority) {
      setError("You are not an authority")
      return
    }

    setIsLoading(true)
    try {
      const tx = await contract.toVerify(verificationPurpose)
      setSuccess(`Verification submitted: ${tx.hash}`)
      await tx.wait()
      setSuccess(`Verification confirmed!`)
      setVerificationPurpose("")
      
      // Reload data
      if (signer) {
        const address = await signer.getAddress()
        await loadVotingData(contract, address)
      }
    } catch (error: any) {
      setError(`Verification failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVotingStatus = async () => {
    if (!contract || !isUserAuthority) {
      setError("Only authorities can toggle voting status")
      return
    }

    setIsLoading(true)
    try {
      const newStatus = !votingStatus
      const tx = await contract.toggleVoting(newStatus)
      setSuccess(`Voting status change submitted: ${tx.hash}`)
      await tx.wait()
      setSuccess(`Voting is now ${newStatus ? 'OPEN' : 'CLOSED'}!`)
      
      // Reload data
      if (signer) {
        const address = await signer.getAddress()
        await loadVotingData(contract, address)
      }
    } catch (error: any) {
      setError(`Failed to toggle voting: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const voteForParty = async (party: 1 | 2) => {
    if (!contract || !aadharNumber || aadharNumber.length !== 12) {
      setError("Please enter a valid 12-digit Aadhar number")
      return
    }

    if (hasAadharVoted) {
      setError("This Aadhar number has already voted")
      return
    }

    setIsLoading(true)
    try {
      const tx = party === 1 
        ? await contract.voteParty1(aadharNumber)
        : await contract.voteParty2(aadharNumber)
      
      setSuccess(`Vote submitted for Party ${party}: ${tx.hash}`)
      await tx.wait()
      setSuccess(`Vote confirmed for Party ${party}!`)
      
      // Reload data and clear form
      if (signer) {
        const address = await signer.getAddress()
        await loadVotingData(contract, address)
      }
      
      setVoterAddress("")
      setAadharNumber("")
      setHasAadharVoted(false)
    } catch (error: any) {
      setError(`Voting failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const finalizeResults = async () => {
    if (!contract || !isUserAuthority) {
      setError("Only authorities can finalize results")
      return
    }

    setIsLoading(true)
    try {
      const tx = await contract.finalizeResults()
      setSuccess(`Results finalization submitted: ${tx.hash}`)
      const receipt = await tx.wait()
      
      // Get winner after finalization
      const winnerResult = await contract.winner()
      setWinner(winnerResult)
      setSuccess(`Results finalized! ${winnerResult}`)
      
      // Reload data
      if (signer) {
        const address = await signer.getAddress()
        await loadVotingData(contract, address)
      }
    } catch (error: any) {
      setError(`Failed to finalize results: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const emergencyStop = async () => {
    if (!contract || !isUserAuthority) {
      setError("Only authorities can emergency stop")
      return
    }

    setIsLoading(true)
    try {
      const tx = await contract.emergencyStop()
      setSuccess(`Emergency stop submitted: ${tx.hash}`)
      await tx.wait()
      setSuccess(`Voting emergency stopped!`)
      
      // Reload data
      if (signer) {
        const address = await signer.getAddress()
        await loadVotingData(contract, address)
      }
    } catch (error: any) {
      setError(`Emergency stop failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setContract(null)
    setAccount("")
    setBalance("")
    setNetwork("")
    setError("")
    setSuccess("")
    // Reset all state
    setVotingStatus(false)
    setResultsFinalized(false)
    setAllVerified(false)
    setIsUserAuthority(false)
    setHasUserSigned(false)
    setParty1Votes(0)
    setParty2Votes(0)
    setTotalVotes(0)
    setWinner("")
    setAadharNumber("")
    setVoterAddress("")
    setHasAadharVoted(false)
    setVerificationPurpose("")
  }

  // Auto-connect and event listeners
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          connectWallet()
        }
      })

      window.ethereum.on("chainChanged", () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (contract && signer) {
      const interval = setInterval(async () => {
        const address = await signer.getAddress()
        await loadVotingData(contract, address)
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [contract, signer])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🗳️ Blockchain Voting System</h1>
          <p className="text-gray-600">Secure and transparent voting on Sepolia testnet</p>
          {VOTING_CONTRACT_ADDRESS === "YOUR_DEPLOYED_VOTING_CONTRACT_ADDRESS" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please update VOTING_CONTRACT_ADDRESS with your deployed contract address!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>Connect your MetaMask wallet to participate in voting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!account ? (
              <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Connected Account</p>
                    <p className="text-xs text-gray-500 font-mono">{account}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">ETH Balance</p>
                    <p className="text-lg font-bold">{Number.parseFloat(balance).toFixed(4)} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Network</p>
                    <Badge variant="secondary">{network}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <Badge variant={isUserAuthority ? "default" : "outline"}>
                      {isUserAuthority ? "Authority" : "Voter"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Voting Status Dashboard */}
        {account && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="w-5 h-5" />
                Voting Status Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Voting Status</p>
                  <Badge variant={votingStatus ? "default" : "secondary"}>
                    {votingStatus ? "OPEN" : "CLOSED"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">All Verified</p>
                  <Badge variant={allVerified ? "default" : "secondary"}>
                    {allVerified ? "YES" : "NO"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Authority Signed</p>
                  <Badge variant={hasUserSigned ? "default" : "secondary"}>
                    {hasUserSigned ? "YES" : "NO"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Results Final</p>
                  <Badge variant={resultsFinalized ? "default" : "secondary"}>
                    {resultsFinalized ? "YES" : "NO"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Votes</p>
                  <p className="text-lg font-bold">{totalVotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Vote Count */}
        {account && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Live Vote Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h3 className="text-2xl font-bold text-blue-600">Party 1</h3>
                  <p className="text-4xl font-bold text-blue-800">{party1Votes}</p>
                  <p className="text-sm text-gray-600">votes</p>
                  {totalVotes > 0 && (
                    <p className="text-xs text-gray-500">
                      {((party1Votes / totalVotes) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg border-2 border-red-200">
                  <h3 className="text-2xl font-bold text-red-600">Party 2</h3>
                  <p className="text-4xl font-bold text-red-800">{party2Votes}</p>
                  <p className="text-sm text-gray-600">votes</p>
                  {totalVotes > 0 && (
                    <p className="text-xs text-gray-500">
                      {((party2Votes / totalVotes) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Winner Declaration */}
        {winner && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Trophy className="w-5 h-5" />
                Election Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6">
                <p className="text-xl font-bold text-yellow-900">{winner}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Authority Controls */}
          {account && isUserAuthority && (
            <Card>
              <CardHeader>
                <CardTitle>Authority Controls</CardTitle>
                <CardDescription>Manage voting process as an authority</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Verification Purpose</Label>
                  <Input
                    id="purpose"
                    placeholder="Enter verification purpose..."
                    value={verificationPurpose}
                    onChange={(e) => setVerificationPurpose(e.target.value)}
                    disabled={hasUserSigned}
                  />
                </div>
                <Button
                  onClick={verifyAsAuthority}
                  disabled={isLoading || !verificationPurpose || hasUserSigned}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {hasUserSigned ? "Already Verified" : "Verify as Authority"}
                </Button>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={toggleVotingStatus}
                    disabled={isLoading || !allVerified}
                    variant="outline"
                    size="sm"
                  >
                    {votingStatus ? "Close Voting" : "Open Voting"}
                  </Button>
                  <Button
                    onClick={emergencyStop}
                    disabled={isLoading}
                    variant="destructive"
                    size="sm"
                  >
                    Emergency Stop
                  </Button>
                </div>
                
                {!votingStatus && !resultsFinalized && (
                  <Button
                    onClick={finalizeResults}
                    disabled={isLoading || !allVerified}
                    className="w-full"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Finalize Results
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voter Interface */}
          {account && (
            <Card>
              <CardHeader>
                <CardTitle>Cast Your Vote</CardTitle>
                <CardDescription>Enter your Aadhar number to vote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhar">Aadhar Number (12 digits)</Label>
                  <Input
                    id="aadhar"
                    placeholder="123456789012"
                    value={aadharNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                      setAadharNumber(value)
                      // Clear previous results when changing Aadhar
                      if (value !== aadharNumber) {
                        setVoterAddress("")
                        setHasAadharVoted(false)
                      }
                    }}
                    maxLength={12}
                  />
                  <p className="text-xs text-gray-500">{aadharNumber.length}/12 digits</p>
                </div>
                
                <Button
                  onClick={generateVoterAddress}
                  disabled={!votingStatus || !aadharNumber || aadharNumber.length !== 12}
                  className="w-full"
                  variant="outline"
                >
                  Generate Voter Address
                </Button>
                
                {voterAddress && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Generated Voter Address:</p>
                    <p className="text-xs font-mono break-all">{voterAddress}</p>
                    {hasAadharVoted && (
                      <p className="text-xs text-red-600 font-medium">⚠️ This Aadhar has already voted!</p>
                    )}
                  </div>
                )}
                
                {voterAddress && !hasAadharVoted && votingStatus && (
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button
                      onClick={() => voteForParty(1)}
                      disabled={isLoading}
                      className="h-16 text-lg bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Vote Party 1
                    </Button>
                    <Button
                      onClick={() => voteForParty(2)}
                      disabled={isLoading}
                      className="h-16 text-lg bg-red-600 hover:bg-red-700"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Vote Party 2
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contract Information */}
        {account && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Contract Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{VOTING_CONTRACT_ADDRESS}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(`https://sepolia.etherscan.io/address/${VOTING_CONTRACT_ADDRESS}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Network:</span>
                  <span>Sepolia Testnet (Chain ID: 11155111)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Your Role:</span>
                  <span>{isUserAuthority ? "Authority" : "Voter"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Voting System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">1. Authority Verification</h4>
              <p className="text-sm text-gray-600">All authorities must verify with a purpose before voting can begin</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">2. Open Voting</h4>
              <p className="text-sm text-gray-600">Authorities can toggle voting status when all are verified</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">3. Generate Voter Address</h4>
              <p className="text-sm text-gray-600">Use 12-digit Aadhar number to generate deterministic voter address</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">4. Cast Vote</h4>
              <p className="text-sm text-gray-600">Vote for Party 1 or Party 2 using your Aadhar number (one vote per Aadhar)</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">5. Finalize Results</h4>
              <p className="text-sm text-gray-600">After voting closes, authorities can finalize and declare the winner</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
