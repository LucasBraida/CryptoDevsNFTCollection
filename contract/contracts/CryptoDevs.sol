// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    /**
     * @dev _baseTokenURI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    string _baseTokenURI;

    //price for 1 CryptoDev NFT
    uint256 public price = 0.01 ether;

    //bool indicator to pause the contract in case of an emergency
    bool public paused;

    //Max number of CryptoDevs
    uint256 public maxTokenIds = 20;

    //current number of NFTs minted
    uint256 public tokenIds;

    //interface to the whitelist contract
    IWhitelist whitelist;

    //bool indicator to start the presale for the whitelisted. Set to false until the owner starts the presale.
    bool public presaleStarted = false;

    //timestamp for when the presale will end
    uint256 public presaleTimeEnded;

    //to prevent actions when the contract is paused
    modifier onlyWhenNotPaused() {
        require(!paused, "The contract is paused at the moment");
        _;
    }

    /**
     * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
     * name in our case is `Crypto Devs` and symbol is `CD`.
     * Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
     * It also initializes an instance of whitelist interface.
     */
    constructor(string memory _baseURI, address _whitelistContract)
        ERC721("Crypto Devs", "CD")
    {
        _baseTokenURI = _baseURI;
        whitelist = IWhitelist(_whitelistContract);
    }

    /**
     * @dev startPresale starts a presale for the whitelisted addresses
     */
    function startPresale() public onlyOwner onlyWhenNotPaused {
        presaleStarted = true;

        // setting presale to 15 minutes
        presaleTimeEnded = block.timestamp + 15 minutes;
    }

    /**
     * @dev presaleMint allows a user to mint one NFT per transaction during the presale.
     */
    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp <= presaleTimeEnded,
            "Presale is not happening"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "User not whitelisted"
        );
        require(tokenIds < maxmaxTokenIds, "We are sold out");
        require(msg.value == price, "Wrong amount of Eth");
        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
     */
    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp > presaleTimeEnded,
            "Presale is not done"
        );
        require(tokenIds < maxmaxTokenIds, "We are sold out");
        require(msg.value == price, "Wrong amount of Eth");
        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }
}
