export const CONTRACT_ADDRESS = "0x249E2bf7Ae7DBcAA89c68EDF40A09c78A1b7e7Bd"

// Make chain ID optional - will auto-detect from MetaMask
export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || null

export const CONTRACT_ABI = [
  "function vote_count_party1() view returns (uint256)",
  "function vote_count_party2() view returns (uint256)",
  "function voting() view returns (bool)",
  "function getSystemStatus() view returns (bool, bool, bool, uint256, uint256)",
  "function voteParty1(uint256 _aadhar)",
  "function voteParty2(uint256 _aadhar)",
  "function toVerify(string memory _purpose)",
  "function toggleVoting(bool _status)",
  "function finalizeElection()",
  "event VoteCast(address indexed voter, uint256 indexed party, uint256 aadhar, uint256 timestamp)",
  "event VotingStatusChanged(bool status, address indexed changedBy, uint256 timestamp)",
  "event AuthorityVerified(address indexed authority, string purpose, uint256 timestamp)",
]

// Optional Sepolia config - only used if you want to add network switching
export const SEPOLIA_CONFIG = {
  chainId: "0xaa36a7", // Sepolia chain ID in hex
  chainName: "Sepolia Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/demo"],
  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
}
