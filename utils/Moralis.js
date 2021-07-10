import { KEY_ALL_TOKEN_LIST, KEY_WALLET_ADDRESS } from "@/constants/types";
import { isValidContractAddress } from "./Helpers";
import { getFromStore, putInStore } from "./Store";
import axios from "axios";
import { FETCH_BALANCES, FETCH_CONTRACT_DETAILS } from "@/constants/urls";

export async function getAllERC20Tokens(address) {
  try {
    const { data } = await axios.post(FETCH_BALANCES, {
      address,
    });
    if (data.success) return data.data;
  } catch (e) {
    console.error("Request Rejected", e);
  }
  return [];
}

export async function getERC20TokenDetails(address) {
  if (isValidContractAddress(address)) {
    const tokens = getFromStore(KEY_ALL_TOKEN_LIST) || {};

    if (tokens && tokens[address]) {
      return tokens[address];
    }

    const walletAddress = getFromStore(KEY_WALLET_ADDRESS);
    try {
      const { data } = await axios.post(FETCH_CONTRACT_DETAILS, {
        walletAddress,
        contractAddress: address,
      });

      if (data.success) {
        putInStore(KEY_ALL_TOKEN_LIST, {
          ...tokens,
          [address]: data.data,
        });
        return data.data;
      }
    } catch {}
  }
  return null;
}
