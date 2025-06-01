## **🌐 Live Demo**
**Visit the live application**: [Evotrix dApp - https://evotrix.sohampawar.me](https://evotrix.sohampawar.me)

# **🗳️ Evotrix - Blockchain Voting System**

**Evotrix** is a secure and transparent blockchain-based voting platform built on Ethereum's Sepolia testnet. It leverages smart contracts to enable trustworthy elections with multi-authority verification, Aadhar-based voter authentication, and real-time vote counting.

## **✨ Key Features**

- **🔐 Multi-Authority Verification**: Multiple trusted authorities must approve voting operations
- **👤 Secure Voter Authentication**: Deterministic voter address generation using Aadhar numbers
- **🛡️ Double Voting Prevention**: One vote per voter enforcement with cryptographic security
- **📊 Real-Time Vote Tracking**: Live vote counting and election status updates
- **⚡ Emergency Controls**: Immediate voting suspension and emergency stop capabilities
- **🏆 Transparent Results**: Immutable winner declaration with tie handling
- **🔍 Complete Auditability**: All voting activities logged on blockchain

## **🚀 Technology Stack**

- **Blockchain**: Ethereum Sepolia Testnet
- **Smart Contracts**: Solidity 0.8.24
- **Frontend**: Next.js 15 with TypeScript
- **Web3 Integration**: Ethers.js v6
- **UI Framework**: Chakra UI / Shadcn UI
- **Wallet Integration**: MetaMask
- **Development**: Hardhat, Remix IDE

## **🛠️ Getting Started**

### **Prerequisites**

- **Node.js 18+** installed
- **MetaMask** browser extension
- **Sepolia testnet ETH** for gas fees

### **Installation**

**1. Clone the repository**
git clone https://github.com/sohampawar1866/evotrix.git
cd evotrix

**2. Install dependencies**
npm install

**3. Configure environment variables**

Create a `.env.local` file:
NEXT_PUBLIC_SEPOLIA_RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
NEXT_PUBLIC_CONTRACT_ADDRESS="YOUR_DEPLOYED_CONTRACT_ADDRESS"
NEXT_PUBLIC_CHAIN_ID="11155111"

**4. Run the development server**
npm run dev

**5. Open your browser**
Navigate to `http://localhost:3000`

## **🔧 Smart Contract Deployment**

**1. Compile the contract**
npx hardhat compile

**2. Deploy to Sepolia**
npx hardhat run scripts/deploy.js --network sepolia

**3. Update contract address**
Replace `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env.local` file

## **📱 Usage**

### **For Authorities**
1. **Connect** MetaMask wallet to Sepolia testnet
2. **Verify** your authority status with a purpose
3. **Toggle** voting status (open/close elections)
4. **Monitor** election progress and finalize results

### **For Voters**
1. **Connect** MetaMask wallet
2. **Enter** your 12-digit Aadhar number
3. **Generate** your unique voter address
4. **Cast** your vote for Party 1 or Party 2
5. **View** live election results


## **🔐 Security Features**

- **Access Control**: Role-based permissions for authorities and voters
- **Cryptographic Security**: Deterministic address generation prevents manipulation
- **Multi-Signature Authority**: Requires consensus from multiple authorities
- **Immutable Records**: All votes permanently recorded on blockchain
- **Emergency Protocols**: Immediate voting suspension capabilities

## **🤝 Contributing**

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### **Development Guidelines**

- Follow **TypeScript** best practices
- Use **ESLint** and **Prettier** for code formatting
- Write **comprehensive tests** for smart contracts
- Document all **public functions**
- Follow **conventional commits**

## **🧪 Testing**

**Run tests**
npm test

**Run smart contract tests**
npx hardhat test

**Coverage report**
npm run coverage

## **📦 Deployment**

### **Frontend Deployment (Vercel)**
npm run build
vercel --prod

### **Smart Contract Deployment**
npx hardhat run scripts/deploy.js --network sepolia

## **🐛 Known Issues**

- **MetaMask Connection**: Ensure you're on Sepolia testnet
- **Gas Fees**: Keep sufficient Sepolia ETH for transactions
- **Browser Compatibility**: Best experience on Chrome/Firefox with MetaMask

## **🔮 Roadmap**

- [ ] **Multi-party Support**: Support for more than 2 parties
- [ ] **Mobile App**: React Native mobile application
- [ ] **Advanced Analytics**: Detailed voting analytics dashboard
- [ ] **IPFS Integration**: Decentralized storage for voting data
- [ ] **Layer 2 Support**: Polygon/Arbitrum integration for lower fees

## **🙏 Acknowledgments**

- **Ethereum Foundation** for blockchain infrastructure
- **OpenZeppelin** for secure smart contract patterns
- **MetaMask** for wallet integration
- **Vercel** for deployment platform
- **Hardhat** for development framework

## **📞 Contact**

**Soham Pawar** - [sohampawar.me](https://sohampawar.me)

**Email**: sohampawar1866@gmail.com

---

# **🗳️ Empowering Democracy Through Blockchain Technology** 🚀

### ***Built with ❤️ for transparent and secure elections***

**⭐ Star this repository if you found it helpful!**

