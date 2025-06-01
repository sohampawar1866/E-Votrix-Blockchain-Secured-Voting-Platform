// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Evotrix {
    
    struct Voter {
        bool hasVoted;
        uint256 votedParty;
        uint256 timestamp;
        address voterAddress;
    }
    
    struct Authority {
        address authorityAddress;
        bool isVerified;
        string verificationPurpose;
        uint256 verificationTime;
    }
    
    struct Election {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isFinalized;
        uint256 totalVotes;
    }
    
    struct Party {
        string name;
        string description;
        string imageUrl;
        uint256 voteCount;
        address[] voters;
    }
    
    Election public currentElection;
    Party[2] public parties;
    uint256 private electionDuration;
    
    address[] public authorities;
    mapping(address => bool) public isAuthority;
    mapping(address => bool) public isSigned;
    mapping(address => Authority) public authorityDetails;
    
    mapping(uint256 => address) public aadharToVoter;
    mapping(address => Voter) public voters;
    mapping(uint256 => bool) public hasAadharVoted;
    
    uint256 public vote_count_party1;
    uint256 public vote_count_party2;
    uint256 public totalRegisteredVoters;
    
    bool public voting;
    bool public emergencyStop;
    address public winner;
    
    event AuthorityVerified(address indexed authority, string purpose, uint256 timestamp);
    event VotingStatusChanged(bool status, address indexed changedBy, uint256 timestamp);
    event VoteCast(address indexed voter, uint256 indexed party, uint256 aadhar, uint256 timestamp);
    event ElectionCreated(string title, string description, uint256 startTime, uint256 endTime);
    event ElectionFinalized(address indexed winner, uint256 winningVotes, uint256 totalVotes, uint256 timestamp);
    event EmergencyStopActivated(address indexed authority, string reason, uint256 timestamp);
    event VoterRegistered(address indexed voter, uint256 indexed aadhar, uint256 timestamp);
    
    modifier onlyAuthority() {
        require(isAuthority[msg.sender], "Only authorities can call this function");
        _;
    }
    
    modifier votingOpen() {
        require(voting, "Voting is not open");
        require(!emergencyStop, "Emergency stop is active");
        require(block.timestamp >= currentElection.startTime, "Election has not started");
        require(block.timestamp <= currentElection.endTime, "Election has ended");
        _;
    }
    
    modifier hasNotVoted(uint256 _aadhar) {
        require(!hasAadharVoted[_aadhar], "This Aadhar has already voted");
        _;
    }
    
    modifier validAadhar(uint256 _aadhar) {
        require(_aadhar >= 100000000000 && _aadhar <= 999999999999, "Invalid Aadhar number");
        _;
    }
    
    modifier allAuthoritiesVerified() {
        require(has_All_Verified(), "All authorities must verify first");
        _;
    }
    
    constructor(
        address[] memory _authorities,
        string memory _electionTitle,
        string memory _electionDescription,
        uint256 _durationInHours
    ) {
        require(_authorities.length > 0, "At least one authority required");
        require(_durationInHours > 0, "Duration must be greater than 0");
        
        electionDuration = _durationInHours * 60 * 60;
        
        for(uint i = 0; i < _authorities.length; i++) {
            require(_authorities[i] != address(0), "Invalid authority address");
            authorities.push(_authorities[i]);
            isAuthority[_authorities[i]] = true;
        }
        
        currentElection = Election({
            title: _electionTitle,
            description: _electionDescription,
            startTime: 0,
            endTime: 0,
            isActive: false,
            isFinalized: false,
            totalVotes: 0
        });
        
        parties[0] = Party({
            name: "Party 1",
            description: "First political party",
            imageUrl: "",
            voteCount: 0,
            voters: new address[](0)
        });
        
        parties[1] = Party({
            name: "Party 2", 
            description: "Second political party",
            imageUrl: "",
            voteCount: 0,
            voters: new address[](0)
        });
        
        voting = false;
        emergencyStop = false;
    }
    
    function toVerify(string memory _purpose) public onlyAuthority {
        require(!isSigned[msg.sender], "Authority already verified");
        require(bytes(_purpose).length > 0, "Purpose cannot be empty");
        
        isSigned[msg.sender] = true;
        authorityDetails[msg.sender] = Authority({
            authorityAddress: msg.sender,
            isVerified: true,
            verificationPurpose: _purpose,
            verificationTime: block.timestamp
        });
        
        emit AuthorityVerified(msg.sender, _purpose, block.timestamp);
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
        require(voting != _status, "Voting status is already set to this value");
        
        voting = _status;
        
        if (_status) {
            currentElection.startTime = block.timestamp;
            currentElection.endTime = block.timestamp + electionDuration;
            currentElection.isActive = true;
        } else {
            currentElection.isActive = false;
        }
        
        for(uint i = 0; i < authorities.length; i++) {
            isSigned[authorities[i]] = false;
        }
        
        emit VotingStatusChanged(_status, msg.sender, block.timestamp);
    }
    
    function finalizeElection() public onlyAuthority allAuthoritiesVerified {
        require(!voting, "Voting must be closed first");
        require(!currentElection.isFinalized, "Election already finalized");
        require(currentElection.totalVotes > 0, "No votes cast");
        
        currentElection.isFinalized = true;
        
        if (vote_count_party1 > vote_count_party2) {
            winner = address(1);
        } else if (vote_count_party2 > vote_count_party1) {
            winner = address(2);
        } else {
            winner = address(0);
        }
        
        uint256 winningVotes = vote_count_party1 > vote_count_party2 ? 
                               vote_count_party1 : vote_count_party2;
        
        emit ElectionFinalized(winner, winningVotes, currentElection.totalVotes, block.timestamp);
        
        for(uint i = 0; i < authorities.length; i++) {
            isSigned[authorities[i]] = false;
        }
    }
    
    function get_Voter_address(uint256 _aadhar) public pure validAadhar(_aadhar) returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(_aadhar)))));
    }
    
    function voteParty1(uint256 _aadhar) public votingOpen validAadhar(_aadhar) hasNotVoted(_aadhar) {
        _castVote(_aadhar, 1);
    }
    
    function voteParty2(uint256 _aadhar) public votingOpen validAadhar(_aadhar) hasNotVoted(_aadhar) {
        _castVote(_aadhar, 2);
    }
    
    function _castVote(uint256 _aadhar, uint256 _party) internal {
        address voterAddress = get_Voter_address(_aadhar);
        
        hasAadharVoted[_aadhar] = true;
        voters[voterAddress] = Voter({
            hasVoted: true,
            votedParty: _party,
            timestamp: block.timestamp,
            voterAddress: voterAddress
        });
        
        if (_party == 1) {
            vote_count_party1++;
            parties[0].voteCount++;
            parties[0].voters.push(voterAddress);
        } else {
            vote_count_party2++;
            parties[1].voteCount++;
            parties[1].voters.push(voterAddress);
        }
        
        currentElection.totalVotes++;
        
        emit VoteCast(voterAddress, _party, _aadhar, block.timestamp);
    }
    
    function getSystemStatus() public view returns (
        bool votingStatus,
        bool emergencyStopStatus,
        bool authoritiesFullyVerified,
        uint256 totalAuthorities,
        uint256 verifiedAuthorities
    ) {
        uint256 verified = 0;
        
        if (authorities.length > 0) {
            for(uint i = 0; i < authorities.length; i++) {
                if (isSigned[authorities[i]]) {
                    verified++;
                }
            }
        }
        
        return (
            voting,
            emergencyStop,
            authorities.length > 0 ? has_All_Verified() : false,
            authorities.length,
            verified
        );
    }
}
