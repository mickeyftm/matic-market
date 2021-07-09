import { POLYGON_CHAIN_ID } from "@/constants/globals";
import { KEY_ALL_TOKEN_LIST, KEY_WALLET_ADDRESS } from "@/constants/types";
import Moralis from "moralis";
import { isValidContractAddress } from "./Helpers";
import { getFromStore, putInStore } from "./Store";
import ERC20_ABI from "../public/files/erc20-abi.json";

function initMoralis() {
  Moralis.initialize(process.env.NEXT_PUBLIC_MORALIS_APP_ID);
  Moralis.serverURL = process.env.NEXT_PUBLIC_MORALIS_APP_URL;
}

export async function getAllERC20Tokens(address) {
  try {
    initMoralis();
    const options = { chain: POLYGON_CHAIN_ID, address };
    const balances = await Moralis.Web3.getAllERC20(options);
    return balances;
  } catch (e) {
    console.log("Request Rejected", e);
  }
}

export async function getTransectionStatus(transectionId) {
  initMoralis();
  const web3 = await Moralis.Web3.enable();
  const transectionStatus = await web3.eth.getTransactionReceipt(transectionId);
  console.log(transectionStatus);
  return transectionStatus;
}

export async function getERC20TokenDetails(address) {
  if (isValidContractAddress(address)) {
    const tokens = getFromStore(KEY_ALL_TOKEN_LIST);
    if (tokens && tokens[address]) {
      return tokens[address];
    }

    initMoralis();
    const web3 = await Moralis.Web3.enable();
    const contract = new web3.eth.Contract(ERC20_ABI, address);

    const walletAddress = getFromStore(KEY_WALLET_ADDRESS);
    try {
      const tokenDetails = {
        name: await contract.methods.name().call(),
        symbol: await contract.methods.symbol().call(),
        decimals: await contract.methods.decimals().call(),
        balance: await contract.methods.balanceOf(walletAddress).call(),
        address: address,
      };

      const tokens = getFromStore(KEY_ALL_TOKEN_LIST) || {};
      putInStore(KEY_ALL_TOKEN_LIST, {
        ...tokens,
        [address]: tokenDetails,
      });
      return tokenDetails;
    } catch (e) {}
  }
  return null;
}
