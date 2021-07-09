import { useEffect, useState } from "react";
import { publish } from "@/utils/EventBus";
import {
  ON_ALL_TOKEN_BALANCE_UPDATE,
  TOGGLE_OVERLAY_VISIBILITY,
} from "@/constants/events";
import styles from "./style.module.css";
import { Icon } from "@/components/Icon";
import {
  KEY_ALL_TOKEN_BALANCE,
  KEY_ALL_TOKEN_LIST,
  OVERLAY_TYPE_WITH_TOKEN_LIST,
} from "@/constants/types";
import { addClasses } from "@/utils/Helpers";
import { fromGwei, isNegative } from "@/utils/calc";
import Image from "next/image";
import { MIN_MATIC_AMOUNT, POLYGON_TOKEN_ADDRESS } from "@/constants/globals";
import { getFromStore } from "@/utils/Store";
import { gatherAllTokenBalances, getAllTokenList } from "@/utils/Accounts";

export const SmartInput = ({
  label,
  readOnly,
  disableKeys = [],
  amount: amountVal,
  onAmountChanged,
  selectedToken: selectedTokenVal = null,
  onTokenChanged,
}) => {
  const [amount, setAmount] = useState(amountVal || "");
  const [selectedToken, setSelectedToken] = useState(selectedTokenVal);
  const onlyNumberRegex = /^\d*\.?\d*$/;

  useEffect(() => {
    setSelectedToken(selectedTokenVal);
  }, [selectedTokenVal]);

  useEffect(() => {
    setAmount(amountVal);
  }, [amountVal]);

  const onValueChange = (event) => {
    const val = event.target.value;
    if (onlyNumberRegex.test(val)) {
      setAmount(val);
      onAmountChanged && onAmountChanged(val);
    }
  };

  const onMaxClick = () => {
    if (readOnly) return;

    const balances = getFromStore(KEY_ALL_TOKEN_BALANCE) || {};
    if (selectedToken.address.toLowerCase() === POLYGON_TOKEN_ADDRESS) {
      const token = balances[selectedToken.address];
      const _amount = token
        ? fromGwei(token.value, token.decimals, null, MIN_MATIC_AMOUNT)
        : "";
      if (isNegative(_amount)) {
        setAmount("0");
        onAmountChanged && onAmountChanged("0");
      } else {
        setAmount(_amount);
        onAmountChanged && onAmountChanged(_amount);
      }
      return;
    }

    if (selectedToken) {
      const token = balances[selectedToken.address];
      const _amount = token ? fromGwei(token.value, token.decimals, null) : "";
      setAmount(_amount);
      onAmountChanged && onAmountChanged(_amount);
    }
  };

  const onTokenSelect = (token) => {
    setSelectedToken(token);
    onTokenChanged && onTokenChanged(token);
    setAmount("");
    onAmountChanged && onAmountChanged("");
  };

  const getTokenList = async () => {
    const list = getFromStore(KEY_ALL_TOKEN_LIST);
    if (!list) {
      return await getAllTokenList();
    }
    return list;
  };

  const onExternalSearch = async (query, setListItems) => {
    const _address = query;
    const Moralis = await import('@/utils/Moralis');
    const details = await Moralis.getERC20TokenDetails(_address);
    if (details) {
      setListItems([query.trim()]);
    } else {
      setListItems([]);
    }
  };

  const getCachedTokenList = () => {
    const tokenList = getFromStore(KEY_ALL_TOKEN_LIST);
    if (tokenList) return tokenList;
    return {};
  };

  const openTokenList = () => {
    gatherAllTokenBalances();
    publish(TOGGLE_OVERLAY_VISIBILITY, {
      isVisible: true,
      type: OVERLAY_TYPE_WITH_TOKEN_LIST,
      props: {
        title: "Search a token",
        headerName: "Token Symbol",
        headerValue: "Balance",
        queryPlaceholder: "Search by name or Paste token address here",
        fetchListMap: getTokenList,
        onItemSelected: onTokenSelect,
        getValue: getBalance,
        getListMap: getCachedTokenList,
        subscribeEvent: ON_ALL_TOKEN_BALANCE_UPDATE,
        allowExternalSearch: true,
        onExternalSearch,
        disableKeys,
      },
    });
  };

  const getBalance = (token, prefix = "") => {
    const allTokenBalance = getFromStore(KEY_ALL_TOKEN_BALANCE);
    if (token && allTokenBalance) {
      const balanceObj = allTokenBalance[token ? token.address : ""];
      return `${prefix}${balanceObj ? balanceObj.balance : "0"}`;
    }
    return "-";
  };

  return (
    <div className={styles.si}>
      <div className={styles.siLabels}>
        <span>{label}</span>
        <span>{getBalance(selectedToken, "Balance: ")}</span>
      </div>

      <div className={styles.siContainer}>
        <input
          readOnly={readOnly}
          value={amount}
          className={styles.siInput}
          placeholder={"0.0"}
          onChange={onValueChange}
        />

        <button
          className={addClasses([
            styles.siMaxBtn,
            readOnly && styles.siMaxBtnHidden,
          ])}
          onClick={onMaxClick}
        >
          {"MAX"}
        </button>

        <button
          className={addClasses([
            styles.siSelectToken,
            selectedToken ? styles.siSelectedToken : "",
          ])}
          onClick={openTokenList}
        >
          {selectedToken ? (
            <div>
              <div className={styles.selectedTokenIconContainer}>
                <Image
                  className={styles.selectedTokenIcon}
                  width={25}
                  height={25}
                  src={selectedToken.logoURI || "/images/help-circle.svg"}
                  alt={selectedToken.name}
                />
              </div>
              <span>{selectedToken.symbol}</span>
            </div>
          ) : (
            <span>{"Select Token"}</span>
          )}
          <Icon name="DOWN" width={24} height={24} />
        </button>
      </div>
    </div>
  );
};
