export interface VotingData {
  party1Votes: number
  party2Votes: number
  votingStatus: boolean
  authoritiesFullyVerified: boolean
  totalVotes: number
}

export interface ElectionInfo {
  title: string
  description: string
  startTime: number
  endTime: number
  isActive: boolean
  isFinalized: boolean
  totalVotes: number
}

export interface AuthorityStatus {
  addresses: string[]
  verificationStatus: boolean[]
}

export interface VoterInfo {
  hasVoted: boolean
  votedParty: number
  timestamp: number
  voterAddress: string
}
