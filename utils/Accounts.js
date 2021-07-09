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
  FETCH_TOKEN_LIST,
  FETCH_TOKEN_QUOTE,
  LOG_TRANSECTION,
  SWAP_TOKEN,
} from "@/constants/urls";
import axios from "axios";
import { publish } from "./EventBus";
import { asyncDebounce, noop } from "@/utils/Helpers";
import { fromGwei, getAmountInGwei } from "@/utils/calc";
import {
  ON_ALL_TOKEN_BALANCE_UPDATE,
  ON_WALLET_CONNECT,
  ON_WALLET_USER_ACTION,
} from "@/constants/events";
import { getFromStore, putInStore } from "./Store";
import {
  KEY_ALL_TOKEN_BALANCE,
  KEY_ALL_TOKEN_LIST,
  KEY_CHAIN_DETAILS,
  KEY_CHAIN_ID,
  KEY_WALLET_ADDRESS,
  KEY_WALLET_RAW_BALANCE,
} from "@/constants/types";


export function haveMetaMask() {
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
    const address =
      getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
    if (address) {
      return address;
    }
    return false;
  }
  return false;
}

export async function requestWalletPermission(callback = noop) {
  if (window.ethereum) {
    const isUnlocked = await window.ethereum._metamask.isUnlocked();
    console.log(isUnlocked);

    if (isUnlocked) {
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
    } else {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then(async (res) => {
          if (res && res.length > 0) {
            const wallet_approved_address = res[0];
            const chainId = await getChainID();
            const chainDetails = {
              id: chainId,
              isPolygonChain: POLYGON_CHAIN_ID === chainId,
            };
            putInStore(KEY_CHAIN_ID, chainId);
            putInStore(KEY_CHAIN_DETAILS, chainDetails);
            putInStore(KEY_WALLET_ADDRESS, wallet_approved_address);

            const wallet_balance = await getRawBalance();
            putInStore(KEY_WALLET_RAW_BALANCE, wallet_balance);

            publish(ON_WALLET_CONNECT, {
              ...chainDetails,
              address: wallet_approved_address,
              rawBalance: wallet_balance,
            });
            callback();
          } else {
            const isUnlocked = await window.ethereum._metamask.isUnlocked();
            if (isUnlocked) return requestWalletPermission();
          }
        })
        .catch((error) => {
          if (error.code === 4001) {
            callback();
            // EIP-1193 userRejectedRequest error
            console.log("Please connect to MetaMask.");
          } else {
            console.error(error);
          }
        });
    }
  }
}

export async function getActiveAccountAddress() {
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts[0];
  } catch {}
  return null;
}


export const getSeedForJazzi = (address) => {
  return parseInt(address.substring(2, 10), 16);
};



export const getRawBalance = async (decimals = 6) => {
  try {
    const address =
      getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
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
    const walletAddress =
      getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
    const paramsObj = {
      data: data.data.data,
      from: walletAddress,
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
  slippage,
  cancelToken = null
) {
  const walletAddress =
    getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
  
  const { data } = await axios.post(SWAP_TOKEN, {
    fromTokenAddress,
    toTokenAddress,
    fromAddress: walletAddress,
    amount,
    slippage,
  }, { cancelToken });

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
          const Moralis = await import('@/utils/Moralis');
          const status = await Moralis.getTransectionStatus(transectionId);
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

export async function getApprovalForToken(token, amount) {
  const walletAddress =
    getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
  
  const amountInGwei = getAmountInGwei(token, amount);
  const { data } = await axios.post(FETCH_APPROVED_TOKEN, {
    walletAddress,
    amount: amountInGwei,
    tokenAddress: token.address,
  });

  return data;
}



async function getTokenQuoteHelper(fromTokenAddress, toTokenAddress, amount, cancelToken = null) {
  try {
    const { data } = await axios.post(FETCH_TOKEN_QUOTE, {
      fromTokenAddress,
      toTokenAddress,
      amount,
    }, { cancelToken });

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
  const walletAddress =
    getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
  const { data } = await axios.post(ADD_APPROVED_TOKEN, {
    tokenAddress,
    walletAddress,
    transectionId,
  });
}

export const switchToPolygonSafely = async () => {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: POLYGON_CHAIN_ID,
              chainName: "Polygon (Matic Mainnet)",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              rpcUrls: ["https://rpc-mainnet.maticvigil.com/"],
              blockExplorerUrls: [EXPLORER_LINK],
            },
          ],
        });
      } catch (addError) {
        // handle "add" error
      }
    }
  }
};

export const getAllTokenList = async () => {
  try {
    const { data: response } = await axios.get(FETCH_TOKEN_LIST);
    if (response.success) {
      const tokens = response.data.tokens;
      const prevTokens = getFromStore(KEY_ALL_TOKEN_LIST);

      if (JSON.stringify(prevTokens) !== JSON.stringify(tokens)) {
        putInStore(KEY_ALL_TOKEN_LIST, tokens);
      }
      return tokens;
    }
  } catch {}

  return null;
};

export const gatherAllTokenBalances = async () => {
  const address =
    getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
  if (address) {
    const Moralis = await import('@/utils/Moralis');
    const allTokenBalance = await Moralis.getAllERC20Tokens(address);
    const balances = {};

    // pre process the balances object
    allTokenBalance.forEach((token) => {
      balances[token.tokenAddress || POLYGON_TOKEN_ADDRESS] = {
        decimals: token.decimals,
        value: token.balance,
        balance: fromGwei(token.balance, token.decimals),
      };
    });

    const prevBalances = getFromStore(KEY_ALL_TOKEN_BALANCE);
    if (JSON.stringify(prevBalances) !== JSON.stringify(balances)) {
      putInStore(KEY_ALL_TOKEN_BALANCE, balances);
      publish(ON_ALL_TOKEN_BALANCE_UPDATE, balances);
    }
    return balances;
  }
  return null;
};
