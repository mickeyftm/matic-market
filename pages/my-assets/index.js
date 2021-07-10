import { ListWithSearchAndSort } from "@/components/ListWithSearchAndSort";
import {
  POLYGON_TOKEN_ADDRESS,
  POLYGON_TOKEN_OTHER_ADDRESS,
} from "@/constants/globals";
import { getActiveAccountAddress, getAllTokenList } from "@/utils/Accounts";
import styles from "./style.module.css";
import { SetTitle } from "@/components/SetTitle";
import SEO from "@/seo/assets";
import { getFromStore } from "@/utils/Store";
import { KEY_ALL_TOKEN_LIST, KEY_WALLET_ADDRESS } from "@/constants/types";
import { useState } from "react";
import { getAllERC20Tokens } from "@/utils/Moralis";

export default function Assets() {
  const [balances, setBalances] = useState({});
  const fetchAllTokenBalances = async (tokenListMap) => {
    const walletAddress =
      getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
    if (walletAddress) {
      const allTokens = await getAllERC20Tokens(walletAddress);
      const _balances = {};

      allTokens.forEach((token) => {
        const _tokenData =
          tokenListMap[token.tokenAddress || POLYGON_TOKEN_ADDRESS];
        if (token.tokenAddress !== POLYGON_TOKEN_OTHER_ADDRESS) {
          _balances[token.tokenAddress || POLYGON_TOKEN_ADDRESS] = {
            ...token,
            value: token.balance,
            address: token.tokenAddress || POLYGON_TOKEN_ADDRESS,
            logoURI: _tokenData ? _tokenData.logoURI : "",
          };
        }
      });

      setBalances(_balances);
      return _balances;
    }
    return {};
  };

  const getTokenList = async () => {
    return getFromStore(KEY_ALL_TOKEN_LIST) || (await getAllTokenList());
  };

  const fetchListMap = async () => {
    const tokenListMap = await getTokenList();
    const _balances = await fetchAllTokenBalances(tokenListMap);
    return _balances;
  };

  const getCachedTokenList = () => {
    if (balances) return balances;
    return {};
  };

  return (
    <div className={styles.assetsList}>
      <SetTitle title={SEO.title} description={SEO.description} />
      <ListWithSearchAndSort
        title={"My Assets"}
        headerName={"Token Symbol"}
        headerValue="Balance"
        queryPlaceholder="Search by name, symbol or paste address"
        fetchListMap={fetchListMap}
        className={styles.list}
        allowExternalSearch={false}
        getListMap={getCachedTokenList}
      />
    </div>
  );
}
