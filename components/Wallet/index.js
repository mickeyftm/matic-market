import { DEFAULT_CURRENCY, POLYGON_CHAIN_ID } from "@/constants/globals";
import {
  isWalletLinked,
  requestWalletPermission,
  onWalletConnect,
  onWalletDisconnect,
  onWalletAccountsChanged,
  onWalletChainChanged,
  getRawBalance,
  switchToPolygonSafely,
  getChainID,
} from "@/utils/Accounts";
import { useCallback, useEffect, useState } from "react";
import { publish, subscribe } from "@/utils/EventBus";
import {
  ADD_NOTIFICATION,
  ON_TRANSECTION_COMPLETE,
  ON_WALLET_USER_ACTION,
  TOGGLE_OVERLAY_VISIBILITY,
  TRIGGER_WALLET_CONNECT,
  WALLET_CONNECTED,
  WALLET_DISCONNECTED,
  WALLET_LINKED,
} from "@/constants/events";
import { middleEllipsis } from "@/utils/Helpers";
import styles from "./style.module.css";
import { OVERLAY_TYPE_WITH_POPUP } from "@/constants/types";
import Image from "next/image";

export const Wallet = () => {
  const [wallet, setWallet] = useState(false);
  const [chain, setChain] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  const showWalletConnectPopup = useCallback(() => {
    publish(TOGGLE_OVERLAY_VISIBILITY, {
      isVisible: true,
      type: OVERLAY_TYPE_WITH_POPUP,
      props: {
        title: "Connect to a wallet",
        render: renderConnectToWalletPopUp,
      },
    });
  }, []);

  useEffect(() => {
    onWalletConnect(async (info) => {
      const chainInfo = {
        chainId: info.chainId,
        isPolygonChain: info.chainId === POLYGON_CHAIN_ID,
      };
      setChain(chainInfo);
      publish(WALLET_CONNECTED, chainInfo);

      const _walet = await isWalletLinked();
      setWallet(_walet);
      publish(WALLET_LINKED, { linked: !!_walet });
      console.log("onWalletConnect", info, wallet, _walet);
    });

    onWalletDisconnect((error) => {
      publish(WALLET_DISCONNECTED);
      publish(WALLET_LINKED, { linked: false });
      console.log("onWalletDisconnect", error);
    });

    onWalletAccountsChanged((accounts) => {
      if (accounts.length > 0) {
        setWallet(accounts[0]);
        publish(WALLET_LINKED, { linked: true });
      } else {
        publish(WALLET_LINKED, { linked: false });
        setWallet(false);
      }
      console.log("onWalletAccountsChanged", accounts);
    });

    onWalletChainChanged(async (chainId) => {
      const chainInfo = {
        chainId,
        isPolygonChain: chainId === POLYGON_CHAIN_ID,
      };
      setChain(chainInfo);
      getLatestBalance();
      console.log("onWalletChainChanged", chainId);
    });

    const unsubscribe = subscribe(
      ON_WALLET_USER_ACTION,
      ({ isWalletLinked }) => {
        publish(ADD_NOTIFICATION, {
          status: isWalletLinked,
          text: "Wallet linked " + (isWalletLinked ? "" : "Failed."),
        });
      }
    );

    const unsubscribe2 = subscribe(
      TRIGGER_WALLET_CONNECT,
      showWalletConnectPopup
    );

    (async () => {
      const chainId = await getChainID();
      if(chainId) {
        const chainInfo = {
          chainId: chainId,
          isPolygonChain: chainId === POLYGON_CHAIN_ID,
        };
        setChain(chainInfo);
      }
    })()

    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, []);

  const getLatestBalance = async () => {
    setWalletBalance(await getRawBalance());
  };

  useEffect(() => {
    if (wallet) {
      getLatestBalance();
    }
    const unsubscribe = subscribe(ON_TRANSECTION_COMPLETE, getLatestBalance);

    return () => {
      unsubscribe();
    };
  }, [wallet]);

  const renderConnectToWalletPopUp = ({ closePopup }) => {
    const onBtnClick = () => {
      requestWalletPermission(closePopup);
    };
    return (
      <div className={styles.popup}>
        <button onClick={onBtnClick} className={styles.popupBtn}>
          <span>{"MetaMask"}</span>
          <Image
            width={28}
            height={28}
            src={"/images/metamask.svg"}
            alt={"MetaMask"}
          />
        </button>
      </div>
    );
  };

  const handleWalletClick = async () => {
    if (wallet) {
      //show details on popup
    } else {
      showWalletConnectPopup();
    }
  };

  const handleChainClick = () => {
    if (chain && chain.isPolygonChain) {
      return;
    } else {
      switchToPolygonSafely();
    }
  };

  const isValidState = () => {
    if (chain && chain.isPolygonChain) {
      return true;
    }
    return false;
  };

  const isValid = isValidState();
  return (
    <div className={styles.wallet}>
      {
        <span className={styles.chain} onClick={handleChainClick}>
          {isValid ? "Polygon" : "Switch To Polygon"}
        </span>
      }
      {isValid && walletBalance && (
        <div className={styles.balance}>
          {`${walletBalance} ${DEFAULT_CURRENCY}`}
        </div>
      )}
      {isValid && (
        <div className={styles.address} onClick={handleWalletClick}>
          {wallet ? middleEllipsis(wallet, 16) : "Connect Wallet"}
        </div>
      )}
    </div>
  );
};
