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
  const [addressWhitelisted, setAddressWhitelisted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [numOfWhitelisted, setNumOfWhitelisted] = useState(0)
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
        alert("Change the network to Rinkeby")
        throw new Error('Change network to rinkeby')
      }

      if (needSigner) {
        const signer = web3Provider.getSigner()
        return signer
      }

      return web3Provider
    } catch (error) {
      console.log('erro')
      console.log(error)
    }
  }

  const getNumberOfWhitelisted = async () => {
    try {
      const provider = await getProviderOrSigner()
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS, abi, provider)

      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      console.log(_numberOfWhitelisted.toNumber())
      setNumOfWhitelisted(_numberOfWhitelisted.toNumber());

    } catch (error) {
      console.log(error)
    }
  }

  const addAddressToWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true)
      const whitelistContract = new Contract(WHITELIST_CONTRACT_ADDRESS, abi, signer)

      const tx = await whitelistContract.addAddressToWhitelist()
      setLoading(true)
      await tx.wait()
      setLoading(false)

      await getNumberOfWhitelisted()
      setAddressWhitelisted(true)

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
      console.log('after break')
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
  const renderButton = () => {
    if (walletConnected) {
      if (addressWhitelisted) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, []);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
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
            {numOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}