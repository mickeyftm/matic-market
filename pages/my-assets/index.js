import { ListWithSearchAndSort } from "@/components/ListWithSearchAndSort";
import {
  POLYGON_TOKEN_ADDRESS,
  POLYGON_TOKEN_OTHER_ADDRESS,
} from "@/constants/globals";
import { FETCH_TOKEN_LIST } from "@/constants/urls";
import { getActiveAccountAddress, getAllERC20Tokens } from "@/utils/Accounts";
import axios from "axios";
import styles from "./style.module.css";
import { SetTitle } from "@/components/SetTitle";
import SEO from "@/seo/assets";

export default function Assets() {
  const getTokenList = async () => {
    try {
      const { data: response } = await axios.get(FETCH_TOKEN_LIST);
      if (response.success) {
        return response.data.tokens;
      }
    } catch (e) {
      console.log(e);
    }
    return {};
  };

  const fetchAllTokenBalances = async (tokenListMap) => {
    const address = await getActiveAccountAddress();
    if (address) {
      const allTokens = await getAllERC20Tokens(address);
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
      return _balances;
    }
    return {};
  };

  const fetchListMap = async () => {
    const tokenListMap = await getTokenList();
    const _balances = await fetchAllTokenBalances(tokenListMap);
    return _balances;
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
      />
    </div>
  );
}
