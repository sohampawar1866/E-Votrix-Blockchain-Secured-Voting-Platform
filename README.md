🗳️ Evotrix - Blockchain Voting System
Evotrix is a secure and transparent blockchain-based voting platform built on Ethereum's Sepolia testnet. It leverages smart contracts to enable trustworthy elections with multi-authority verification, Aadhar-based voter authentication, and real-time vote counting.

✨ Key Features
🔐 Multi-Authority Verification: Multiple trusted authorities must approve voting operations

👤 Secure Voter Authentication: Deterministic voter address generation using Aadhar numbers

🛡️ Double Voting Prevention: One vote per voter enforcement with cryptographic security

📊 Real-Time Vote Tracking: Live vote counting and election status updates

⚡ Emergency Controls: Immediate voting suspension and emergency stop capabilities

🏆 Transparent Results: Immutable winner declaration with tie handling

🔍 Complete Auditability: All voting activities logged on blockchain

🚀 Technology Stack
Blockchain: Ethereum Sepolia Testnet

Smart Contracts: Solidity 0.8.24

Frontend: Next.js 15 with TypeScript

Web3 Integration: Ethers.js v6

UI Framework: Chakra UI / Shadcn UI

Wallet Integration: MetaMask

Development: Hardhat, Remix IDE

🛠️ Getting Started
Prerequisites
Node.js 18+ installed

MetaMask browser extension

Sepolia testnet ETH for gas fees

Installation
Clone the repository

bash
git clone https://github.com/yourusername/evotrix.git
cd evotrix
Install dependencies

bash
npm install
Configure environment variables
Create a .env.local file:

bash
NEXT_PUBLIC_SEPOLIA_RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
NEXT_PUBLIC_CONTRACT_ADDRESS="YOUR_DEPLOYED_CONTRACT_ADDRESS"
NEXT_PUBLIC_CHAIN_ID="11155111"
Run the development server

bash
npm run dev
Open your browser
Navigate to http://localhost:3000

🔧 Smart Contract Deployment
Compile the contract

bash
npx hardhat compile
Deploy to Sepolia

bash
npx hardhat run scripts/deploy.js --network sepolia
Update contract address
Replace NEXT_PUBLIC_CONTRACT_ADDRESS in your .env.local file

📱 Usage
For Authorities
Connect MetaMask wallet to Sepolia testnet

Verify your authority status with a purpose

Toggle voting status (open/close elections)

Monitor election progress and finalize results

For Voters
Connect MetaMask wallet

Enter your 12-digit Aadhar number

Generate your unique voter address

Cast your vote for Party 1 or Party 2

View live election results

🏗️ Project Structure
text
evotrix/
├── contracts/
│   └── evotrix.sol          # Main voting smart contract
├── components/
│   └── VotingDApp.tsx       # Main dApp interface
├── hooks/
│   ├── useWeb3.ts           # Web3 connection logic
│   ├── useContract.ts       # Contract interaction
│   └── useGreeting.ts       # Voting functions
├── context/
│   └── Web3Context.tsx      # Web3 state management
└── types/
    └── ethereum.d.ts        # TypeScript definitions
🔐 Security Features
Access Control: Role-based permissions for authorities and voters

Cryptographic Security: Deterministic address generation prevents manipulation

Multi-Signature Authority: Requires consensus from multiple authorities

Immutable Records: All votes permanently recorded on blockchain

Emergency Protocols: Immediate voting suspension capabilities

🌐 Live Demo
Visit the live application: Evotrix dApp

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Ethereum Foundation for blockchain infrastructure

OpenZeppelin for secure smart contract patterns

MetaMask for wallet integration

Vercel for deployment platform

📞 Contact
Soham Pawar - sohampawar.me

Project Link: https://github.com/yourusername/evotrix

🗳️ Empowering Democracy Through Blockchain Technology 🚀

Built with ❤️ for transparent and secure elections
