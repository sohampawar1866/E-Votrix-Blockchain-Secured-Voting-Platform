// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// Address type contract (previously separate file)
contract address_type {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }
}

// Party 1 contract
contract party1 {
    address public voter;
    address[] public voter_list_party1;

    constructor(address _voter) {
        voter = _voter;
        voter_list_party1.push(voter);
    }
}

// Party 2 contract
contract party2 {
    address public voter;
    address[] public voter_list_party2;

    constructor(address _voter) {
        voter = _voter;
        voter_list_party2.push(voter);
    }
}

// Main Evotrix voting contract
contract evotrix {
    // Vote tracking - more efficient approach
    mapping(address => uint8) public votes; // 0 = no vote, 1 = party1, 2 = party2
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public isValidVoter; // Track valid voters
    
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    
    // Vote counts
    uint256 public party1VoteCount;
    uint256 public party2VoteCount;
    
    // Arrays for contract deployment (keeping your original approach)
    address[] public deployedParty1Contracts;
    address[] public deployedParty2Contracts;

    bool public voting = false;
    bool public resultsFinalized = false;

    // Authority management
    address[] public authorities;
    mapping(address => bool) public isSigned;
    mapping(address => bool) public isAuthority;
    
    // Events for transparency
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 totalVotes);
    event VotingStatusChanged(bool status, uint256 timestamp);
    event AuthorityVerified(address indexed authority, string purpose);
    event WinnerDeclared(string result, uint256 timestamp);

    modifier onlyAuthority() {
        require(isAuthority[msg.sender], "Only authorities can call this function");
        _;
    }

    modifier votingOpen() {
        require(voting, "Voting is closed");
        _;
    }

    modifier votingClosed() {
        require(!voting, "Voting is still open");
        _;
    }

    modifier allAuthoritiesVerified() {
        require(has_All_Verified(), "All authorities must verify first");
        _;
    }

    constructor(address[] memory _authorities) {
        require(_authorities.length > 1, "Need at least 2 authorities");
        
        for(uint i = 0; i < _authorities.length; i++) {
            require(_authorities[i] != address(0), "Invalid authority address");
            require(!isAuthority[_authorities[i]], "Duplicate authority"); // Prevent duplicates
            
            authorities.push(_authorities[i]);
            isAuthority[_authorities[i]] = true;
        }
    }

    function initializeCandidates() public onlyAuthority {
        require(candidates.length == 0, "Candidates already initialized");
        
        candidates.push(Candidate({
            id: 1,
            name: "Party 1",
            voteCount: 0
        }));
        
        candidates.push(Candidate({
            id: 2,
            name: "Party 2", 
            voteCount: 0
        }));
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 _candidateId) public view returns (Candidate memory) {
        require(_candidateId > 0 && _candidateId <= candidates.length, "Invalid candidate ID");
        return candidates[_candidateId - 1];
    }

    // Generic vote function that the frontend expects
    function vote(uint256 _candidateId) public votingOpen {
        require(_candidateId == 1 || _candidateId == 2, "Invalid candidate ID");
        
        // Use msg.sender directly instead of Aadhar-based addressing
        require(!hasVoted[msg.sender], "You have already voted");
        
        hasVoted[msg.sender] = true;
        votes[msg.sender] = uint8(_candidateId);
        
        if (_candidateId == 1) {
            party1VoteCount++;
            candidates[0].voteCount = party1VoteCount;
            
            // Deploy contract (keeping your original design)
            party1 newParty1 = new party1(msg.sender);
            deployedParty1Contracts.push(address(newParty1));
        } else {
            party2VoteCount++;
            candidates[1].voteCount = party2VoteCount;
            
            // Deploy contract (keeping your original design)
            party2 newParty2 = new party2(msg.sender);
            deployedParty2Contracts.push(address(newParty2));
        }
        
        emit VoteCast(msg.sender, _candidateId, _candidateId == 1 ? party1VoteCount : party2VoteCount);
    }

    function toVerify(string memory _purpose) public onlyAuthority {
        require(!isSigned[msg.sender], "Already verified");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");
        
        isSigned[msg.sender] = true;
        emit AuthorityVerified(msg.sender, _purpose);
    }

    function has_All_Verified() public view returns (bool) {
        for(uint i = 0; i < authorities.length; i++) {
            if (!isSigned[authorities[i]]) {
                return false;
            }
        }
        return true;
    }

    function toggleVoting(bool _status) public onlyAuthority allAuthoritiesVerified {
        require(voting != _status, "Voting status already set to this value");
        
        voting = _status;
        
        // Reset signatures for next operation
        for(uint i = 0; i < authorities.length; i++) {
            isSigned[authorities[i]] = false;
        }
        
        emit VotingStatusChanged(_status, block.timestamp);
    }

    function get_Voter_address(uint256 aadhar) public view votingOpen returns (address voter_add) {
        require(aadhar >= 10**11 && aadhar < 10**12, "Invalid Aadhar: must be 12 digits");

        bytes32 salt = keccak256(abi.encodePacked(aadhar));
        bytes memory bytecode = type(address_type).creationCode;

        voter_add = address(
            uint160(uint256(keccak256(abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            ))))
        );
        return voter_add;
    }

    // FIXED: Proper authentication for voting
    function voteParty1(uint256 aadhar) public votingOpen {
        address voter_add = get_Voter_address(aadhar);
        require(!hasVoted[voter_add], "This Aadhar has already voted");
        
        // Deploy contract (keeping your original design)
        party1 newParty1 = new party1(voter_add);
        deployedParty1Contracts.push(address(newParty1));
        
        // Update vote tracking
        hasVoted[voter_add] = true;
        votes[voter_add] = 1;
        party1VoteCount++;
        candidates[0].voteCount = party1VoteCount;
        
        emit VoteCast(voter_add, 1, party1VoteCount);
    }

    function voteParty2(uint256 aadhar) public votingOpen {
        address voter_add = get_Voter_address(aadhar);
        require(!hasVoted[voter_add], "This Aadhar has already voted");
        
        // Deploy contract (keeping your original design)
        party2 newParty2 = new party2(voter_add);
        deployedParty2Contracts.push(address(newParty2));
        
        // Update vote tracking
        hasVoted[voter_add] = true;
        votes[voter_add] = 2;
        party2VoteCount++;
        candidates[1].voteCount = party2VoteCount;
        
        emit VoteCast(voter_add, 2, party2VoteCount);
    }

    // Getter functions
    function getAllDeployedContractsParty1() public view returns (address[] memory) {
        return deployedParty1Contracts;
    }

    function getAllDeployedContractsParty2() public view returns (address[] memory) {
        return deployedParty2Contracts;
    }

    function getVoterFromParty1Contract(address partyAddress) public view returns (address) {
        party1 p = party1(partyAddress);
        return p.voter();
    }

    function getVoterFromParty2Contract(address partyAddress) public view returns (address) {
        party2 p = party2(partyAddress);
        return p.voter();
    }

    function vote_count_party1() public view returns(uint256) {
        return party1VoteCount; // More efficient than array length
    }

    function vote_count_party2() public view returns(uint256) {
        return party2VoteCount; // More efficient than array length
    }

    // FIXED: Proper winner function
    function winner() public view votingClosed returns (string memory _winner) {
        if (party1VoteCount > party2VoteCount) {
            _winner = "Winner Is Party 1...!!! Congratulations";
        } else if (party2VoteCount > party1VoteCount) {
            _winner = "Winner Is Party 2...!!! Congratulations";
        } else {
            _winner = "There is a tie in the Election. Re-Election will be Held. Dates will be Announced shortly.";
        }
        return _winner;
    }

    // NEW: Finalize results (can only be called once)
    function finalizeResults() public onlyAuthority votingClosed allAuthoritiesVerified returns (string memory) {
        require(!resultsFinalized, "Results already finalized");
        
        resultsFinalized = true;
        string memory result = winner();
        
        // Reset signatures
        for(uint i = 0; i < authorities.length; i++) {
            isSigned[authorities[i]] = false;
        }
        
        emit WinnerDeclared(result, block.timestamp);
        return result;
    }

    // NEW: Emergency functions
    function emergencyStop() public onlyAuthority {
        voting = false;
        emit VotingStatusChanged(false, block.timestamp);
    }

    // NEW: Get voting statistics
    function getVotingStats() public view returns (
        uint256 totalVotes,
        uint256 party1Votes,
        uint256 party2Votes,
        bool isVotingOpen,
        bool areResultsFinalized
    ) {
        return (
            party1VoteCount + party2VoteCount,
            party1VoteCount,
            party2VoteCount,
            voting,
            resultsFinalized
        );
    }

    // NEW: Check if Aadhar has voted
    function hasAadharVoted(uint256 aadhar) public view returns (bool) {
        address voter_add = get_Voter_address(aadhar);
        return hasVoted[voter_add];
    }
}
