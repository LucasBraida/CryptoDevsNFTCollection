import { WHITELIST_CONTRACT_ADDRESS } from "./whitelistContractAddress";
import { NFT_CONTRACT_ADDRESS } from './nftContractAddress'
import WhiteList from './Whitelist.json'
import CryptoDevs from './CryptoDevs.json'

const whitelist_abi = WhiteList.abi
const nft_abi = CryptoDevs.abi

export {WHITELIST_CONTRACT_ADDRESS, whitelist_abi, NFT_CONTRACT_ADDRESS, nft_abi}
