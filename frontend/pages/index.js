import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal";
import { providers, Contract, utils } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, whitelist_abi, NFT_CONTRACT_ADDRESS, nft_abi } from "../constants";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [isWhitelisted, setIsWhitelisted] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [presaleStarted, setPresaleStarted] = useState(false)
  const [presaleEnded, setPresaleEnded] = useState(false)
  const [tokenIdsMinted, setTokenIdsMinted] = useState(0)
  //State to prevent spamming the alert to change network
  //const [wrongChain, setWrongChain] = useState(false)
  const [addressWhitelisted, setAddressWhitelisted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [numOfWhitelisted, setNumOfWhitelisted] = useState(0)
  const wrongChain = useRef(true)
  const web3ModalRef = useRef()

  /**
   * checkIfAddressInWhitelist: Checks if the address is in whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        whitelist_abi,
        signer
      );
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      if (_joinedWhitelist) {
        return true
      } else {
        return false
      }
    } catch (err) {
      console.error(err);
      return null
    }
  };

  /**
   * checkIfPresaleStarted: checks if the presale has started by quering the `presaleStarted`
   * variable in the contract
   */
   const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner()

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        nft_abi,
        provider
      );

      const presaleStarted = await nftContract.presaleStarted()
      if(presaleStarted){
        setPresaleStarted(true)
        return true
      }

    } catch (error) {
      console.log(error)
      return false
    }
   }

   /**
   * checkIfPresaleEnded: checks if the presale has ended by quering the `presaleTimeEnded`
   * variable in the contract and comparing with the current time.
   */
    const checkIfPresaleEnded = async () => {
      try {
        const provider = await getProviderOrSigner()

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          nft_abi,
          provider
        );

        const presaleTimeEnded = await nftContract.presaleTimeEnded()
        const hasEnded = presaleTimeEnded.lt(Math.floor(Date.now() / 1000))
        if(hasEnded){
          setPresaleEnded(true)
          return true
        } else {
          return false
        }

      } catch (error) {
        console.log(error)
        return false
      }
     }

   /**
   * getOwner: calls the contract to retrieve the owner
   */
    const getOwner = async () => {
      try {
        const signer = await getProviderOrSigner(true)

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        nft_abi,
        signer
      );

      const ownerAddress = await nftContract.owner()
      const currrentAddress = await signer.getAddress()
      if (currrentAddress.toLowerCase() === ownerAddress.toLowerCase()) {
        setIsOwner(true);
      }
      } catch (error) {
        console.log(error)
      }
    }

    /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, nft_abi, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * startPresale: starts the presale for the NFT Collection
   */
   const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      if (!isOwner) {
        alert("Only the owner can start the presale")
      } else {
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          nft_abi,
          signer
        );

        const tx = await nftContract.startPresale()
        setLoading(true)
        //wait for the transaction to be mined
        await tx.wait()
        setLoading(false)
        await checkIfPresaleStarted()
      }
    } catch (error) {
      console.log(error)
    }
   }
  /**
   * presaleMint: Mint an NFT during the presale
   */
  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      //Check if the addres is whitelisted using the whitelist contract
      //This prevents a failed transaction by calling the NFT contract and waiting it to check
      const isWhitelisted = await checkIfAddressInWhitelist()
      if (!isWhitelisted) {
        alert("The address is not in the Whitelist")
      } else {
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          nft_abi,
          signer
        );

        const tx = await nftContract.presaleMint({ value: utils.parseEther("0.01") })
        setLoading(true)
        //wait for the transaction to be mined
        await tx.wait()
        setLoading(false)
      }
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * presaleMint: Mint an NFT during the presale
   */
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true)

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        nft_abi,
        signer
      );

      const tx = await nftContract.mint({ value: utils.parseEther("0.01") })
      setLoading(true)
      //wait for the transaction to be mined
      await tx.wait()
      setLoading(false)

    } catch (error) {
      console.log(error)
    }
  }
  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect()
      const web3Provider = new providers.Web3Provider(provider)

      const { chainId } = await web3Provider.getNetwork()

      if (chainId !== 4) {
        if(wrongChain.current){
          alert("Change the network to Rinkeby")
        }
        wrongChain.current = false
        
        
        throw new Error('Change network to rinkeby')
      }

      if (needSigner) {
        const signer = web3Provider.getSigner()
        return signer
      }

      return web3Provider
    } catch (error) {
      console.log(error)
    }
  }




  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {

      const { ethereum } = window

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);


    } catch (err) {
      console.log('erro')

    }
  };


  /*
      renderButton: Returns a button based on the state of the dapp
    */
      const renderButton =  () => {
        //Check if user is owner
        //getOwner()
        // If wallet is not connected, return a button which allows them to connect their wllet
        if (!walletConnected) {
          return (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          );
        }

        // If we are currently waiting for something, return a loading button
        if (loading) {
          return <button className={styles.button}>Loading...</button>;
        }

        // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
        if (isOwner && !presaleStarted) {
          return (
            <button className={styles.button} onClick={startPresale}>
              Start Presale!
            </button>
          );
        }

        // If connected user is not the owner but presale hasn't started yet, tell them that
        if (!presaleStarted) {
          return (
            <div>
              <div className={styles.description}>Presale hasnt started!</div>
            </div>
          );
        }

        // If presale started, but hasn't ended yet, allow for minting during the presale period
        if (presaleStarted && !presaleEnded) {

          return (
            <div>
              <div className={styles.description}>
                Presale has started!!! If your address is whitelisted, Mint a
                Crypto Dev 🥳
              </div>
              <button className={styles.button} onClick={presaleMint}>
                Presale Mint 🚀
              </button>
            </div>
          );
          }


        // If presale started and has ended, its time for public minting
        if (presaleStarted && presaleEnded) {
          return (
            <button className={styles.button} onClick={publicMint}>
              Public Mint 🚀
            </button>
          );
        }
      }


  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // Start Effects that need to wait for a Promise
    const startEffects = async () => {
      await connectWallet();

       // Check if presale has started and ended
       const _presaleStarted = await checkIfPresaleStarted();
       if (_presaleStarted) {
         await checkIfPresaleEnded();
       }

       await getOwner();
       await getTokenIdsMinted();

       // Set an interval which gets called every 5 seconds to check presale has ended
       const presaleEndedInterval = setInterval(async function () {
         const _presaleStarted = await checkIfPresaleStarted();
         if (_presaleStarted) {
           const _presaleEnded = await checkIfPresaleEnded();
           if (_presaleEnded) {
             clearInterval(presaleEndedInterval);
           }
         }
       }, 5 * 1000);

       // set an interval to get the number of token Ids minted every 5 seconds
       setInterval(async function () {
         await getTokenIdsMinted();
         console.log(tokenIdsMinted)
       }, 5 * 1000);
    }
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      startEffects()

    }
  }, []);

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}

