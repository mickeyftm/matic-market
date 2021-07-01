import { POLYGON_CHAIN_ID, POLYGON_TOKEN_ADDRESS } from '@/constants/globals';
import { ADD_APPROVED_TOKEN, FETCH_APPROVAL_DATA, FETCH_APPROVED_TOKEN, FETCH_TOKEN_QUOTE, QUOTE } from '@/constants/urls';
import axios from 'axios';
import Moralis from 'moralis';
import debounce from './debounce';
import { asyncDebounce } from './Helpers';

export async function haveMetaMask() {
    const provider = window.ethereum;
    if( provider ) {
        return provider.isMetaMask;
    }
    return false;
}

export async function getChainID() {
  try {
    if(await isWalletLinked()) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId;
    }
  } catch {}
  return null;
}

export async function onWalletConnect(callback) {
  window.ethereum.on('connect', callback);
}

export async function onWalletDisconnect(callback) {
  window.ethereum.on('disconnect', callback);
}

export async function onWalletAccountsChanged(callback) {
  window.ethereum.on('accountsChanged', callback);
}

export async function onWalletChainChanged(callback) {
  window.ethereum.on('chainChanged', callback);
}

export async function isWalletLinked() {
  if(await haveMetaMask()) {
    const address = await getActiveAccountAddress();
    if(address) {
      return address;
    }
    return false;
  }
  return false;
}

export async function requestWalletPermission() {
    window.ethereum
    .request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    })
    .then((permissions) => {
      const accountsPermission = permissions.find(
        (permission) => permission.parentCapability === 'eth_accounts'
      );
      if (accountsPermission) {
        console.log('eth_accounts permission successfully requested!');
      }
    })
    .catch((error) => {
      if (error.code === 4001) {
        // EIP-1193 userRejectedRequest error
        console.log('Permissions needed to continue.');
      } else {
        console.error(error);
      }
    });
}

export async function getActiveAccountAddress() {
    // await ethereum.request({ method: "eth_requestAccounts" });
    try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        return accounts[0];
    } catch {}
    return null;
}

export async function getAllERC20Tokens(address) {
  try {
    Moralis.initialize(process.env.NEXT_PUBLIC_MORALIS_APP_ID);
    Moralis.serverURL = process.env.NEXT_PUBLIC_MORALIS_APP_URL
    const options = { chain: POLYGON_CHAIN_ID, address };
    const balances = await Moralis.Web3.getAllERC20(options);
    return balances;
  } catch (e) {
    console.log("Request Rejected", e);
  }
}

export async function approveToken(tokenAddress) {
  if( tokenAddress === POLYGON_TOKEN_ADDRESS ) return true;
  const { data } = await axios.post(FETCH_APPROVAL_DATA, {
    tokenAddress
  });
  if( data.success ) {
    const paramsObj ={
      data: data.data.data,
      from: await getActiveAccountAddress(),
      to: tokenAddress
    };

    const estimatedGas = await window.ethereum.request({
      method: "eth_estimateGas",
      params: [paramsObj]
    });

    paramsObj.gas = estimatedGas;

    try {
      const transection = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [paramsObj]
      });
      
      console.log(transection);
      return transection;
    } catch {
      console.log('Request Rejected');
      return false;
    }
  }
}

export async function getApprovalForToken(token) {
  const { data } = await axios.post(FETCH_APPROVED_TOKEN, {
    walletAddress: await getActiveAccountAddress(),
    tokenAddress: token.address
  });
  
  return data;
}

export async function getTransectionStatus(transectionId) {
  Moralis.initialize(process.env.NEXT_PUBLIC_MORALIS_APP_ID);
  Moralis.serverURL = process.env.NEXT_PUBLIC_MORALIS_APP_URL;
  
  const web3 = await Moralis.Web3.enable();
  const transectionStatus = await web3.eth.getTransactionReceipt(transectionId);
  console.log(transectionStatus);
  return transectionStatus;
}

async function getTokenQuoteHelper(fromTokenAddress, toTokenAddress, amount) {
  try {
    const { data } = await axios.post(FETCH_TOKEN_QUOTE, {
      fromTokenAddress,
      toTokenAddress,
      amount
    });
    
    return {
      toTokenAmount: data.data.toTokenAmount,
      estimatedGas: data.data.estimatedGas
    }
  } catch{}
  return {};
}

export const getTokenQuote = asyncDebounce(getTokenQuoteHelper, 300);

// we are taking a leap of faith to store it in DB that user might not change it.
export async function setTokenApproved(tokenAddress, transectionId) {
  const { data } = await axios.post(ADD_APPROVED_TOKEN, {
    tokenAddress,
    walletAddress: await getActiveAccountAddress(),
    transectionId
  });
}
