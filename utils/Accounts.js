import {
  EXPLORER_LINK,
  EXPLORER_TRANSECTION_LINK,
  POLYGON_CHAIN_ID,
  POLYGON_TOKEN_ADDRESS,
} from "@/constants/globals";
import {
  ADD_APPROVED_TOKEN,
  FETCH_APPROVAL_DATA,
  FETCH_APPROVED_TOKEN,
  FETCH_TOKEN_QUOTE,
  LOG_TRANSECTION,
  SWAP_TOKEN,
} from "@/constants/urls";
import axios from "axios";
import Moralis from "moralis";
import { publish } from "./EventBus";
import { asyncDebounce, fromGwei, noop } from "@/utils/Helpers";
import ERC20_ABI from "../public/files/erc20-abi.json";
import { ON_WALLET_USER_ACTION } from "@/constants/events";

export async function haveMetaMask() {
  const provider = window.ethereum;
  if (provider) {
    return provider.isMetaMask;
  }
  return false;
}

export async function getChainID() {
  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return chainId;
  } catch {}
  return null;
}

export async function onWalletConnect(callback) {
  window.ethereum.on("connect", callback);
}

export async function onWalletDisconnect(callback) {
  window.ethereum.on("disconnect", callback);
}

export async function onWalletAccountsChanged(callback) {
  window.ethereum.on("accountsChanged", callback);
}

export async function onWalletChainChanged(callback) {
  window.ethereum.on("chainChanged", callback);
}

export async function isWalletLinked() {
  if (await haveMetaMask()) {
    const address = await getActiveAccountAddress();
    if (address) {
      return address;
    }
    return false;
  }
  return false;
}

export async function requestWalletPermission( callback = noop ) {
  window.ethereum
    .request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    })
    .then((permissions) => {
      const accountsPermission = permissions.find(
        (permission) => permission.parentCapability === "eth_accounts"
      );
      if (accountsPermission) {
        callback();
        publish(ON_WALLET_USER_ACTION, { isWalletLinked: true });
        console.log("eth_accounts permission successfully requested!");
      }
    })
    .catch((error) => {
      callback();
      publish(ON_WALLET_USER_ACTION, { isWalletLinked: false });
      if (error.code === 4001) {
        // EIP-1193 userRejectedRequest error
        console.log("Permissions needed to continue.");
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

function initMoralis() {
  Moralis.initialize(process.env.NEXT_PUBLIC_MORALIS_APP_ID);
  Moralis.serverURL = process.env.NEXT_PUBLIC_MORALIS_APP_URL;
}

function isValidContractAddress(address) {
  return address && address.includes("0x") && address.length === 42;
}

export async function getERC20TokenDetails(address) {
  if (isValidContractAddress(address)) {
    initMoralis();
    const web3 = await Moralis.Web3.enable();
    const contract = new web3.eth.Contract(ERC20_ABI, address);
    try {
      const tokenDetails = {
        name: await contract.methods.name().call(),
        symbol: await contract.methods.symbol().call(),
        decimals: await contract.methods.decimals().call(),
        balance: await contract.methods
          .balanceOf(await getActiveAccountAddress())
          .call(),
        address: address,
      };
      return tokenDetails;
    } catch (e) {}
  }
  return null;
}

export const getSeedForJazzi = ( address ) => {
  return parseInt(address.substring(2, 10), 16);
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

export const getRawBalance = async (decimals = 6) => {
  try {
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [await getActiveAccountAddress(), "latest"],
    });
    return fromGwei(balance, 18, decimals);
  } catch {}
  return null;
};

export const addERC20TokenToWallet = async (token) => {
  try {
    const wasAdded = await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.logoURI,
        },
      },
    });

    if (wasAdded) {
      console.log("Thanks for your interest!");
    } else {
      console.log("Your loss!");
    }
  } catch (error) {
    console.log(error);
  }
};

export async function approveToken(tokenAddress) {
  if (tokenAddress.toLowerCase() === POLYGON_TOKEN_ADDRESS) return true;

  //fetch transection to approve
  const { data } = await axios.post(FETCH_APPROVAL_DATA, {
    tokenAddress,
  });
  if (data.success) {
    const paramsObj = {
      data: data.data.data,
      from: await getActiveAccountAddress(),
      to: tokenAddress,
    };

    //request gas fee
    const estimatedGas = await window.ethereum.request({
      method: "eth_estimateGas",
      params: [paramsObj],
    });

    paramsObj.gas = estimatedGas;

    //send transection to sign to approve
    const transection = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [paramsObj],
    });
    return transection;
  }
}

export async function swapTokens(
  fromTokenAddress,
  toTokenAddress,
  amount,
  slippage
) {
  const { data } = await axios.post(SWAP_TOKEN, {
    fromTokenAddress,
    toTokenAddress,
    fromAddress: await getActiveAccountAddress(),
    amount,
    slippage,
  });

  console.log(data);
  if (data.success) {
    let _gas = "0x" + Number(data.data.tx.gas).toString(16);
    let _value = "0x" + Number(data.data.tx.value).toString(16);

    const paramsObj = {
      ...data.data.tx,
      gas: _gas,
      value: _value,
    };

    delete paramsObj.gasPrice;

    console.log(paramsObj);

    // send transection to sign to approve
    const transection = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [paramsObj],
    });
    return transection;
  }
}

export async function logTransection(transection) {
  try {
    await axios.post(LOG_TRANSECTION, { transection });
  } catch {}
}

export const getExplorerTransectionLink = (transectionId) => {
  return `${EXPLORER_TRANSECTION_LINK}${transectionId}`;
};

export async function waitForTransection(
  transectionId,
  pollingTime = 3000,
  EVENT_NAME
) {
  if (transectionId) {
    return new Promise((resolve, reject) => {
      let timer;
      timer = setInterval(async () => {
        try {
          const status = await getTransectionStatus(transectionId);
          if (status) {
            clearInterval(timer);
            if (EVENT_NAME) {
              publish(EVENT_NAME);
            }
            resolve(status);
          }
        } catch {
          reject();
        }
      }, pollingTime);
    });
  }
  return null;
}

export async function getApprovalForToken(token) {
  const { data } = await axios.post(FETCH_APPROVED_TOKEN, {
    walletAddress: await getActiveAccountAddress(),
    tokenAddress: token.address,
  });

  return data;
}

export async function getTransectionStatus(transectionId) {
  initMoralis();
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
      amount,
    });

    return {
      toTokenAmount: data.data.toTokenAmount,
      estimatedGas: data.data.estimatedGas,
    };
  } catch {}
  return {};
}

export const getTokenQuote = asyncDebounce(getTokenQuoteHelper, 300);

// we are taking a leap of faith to store it in DB that user might not change it.
export async function setTokenApproved(tokenAddress, transectionId) {
  const { data } = await axios.post(ADD_APPROVED_TOKEN, {
    tokenAddress,
    walletAddress: await getActiveAccountAddress(),
    transectionId,
  });
}

export const switchToPolygonSafely = async () => {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: POLYGON_CHAIN_ID,
            chainName: 'Polygon (Matic Mainnet)',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            },
            rpcUrls: ['https://rpc-mainnet.maticvigil.com/'],
            blockExplorerUrls: [EXPLORER_LINK]
          }],
        });
      } catch (addError) {
        // handle "add" error
      }
    }
  }
}
