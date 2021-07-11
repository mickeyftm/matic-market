import {
  DEFAULT_CURRENCY,
  EXPLORER_ADDRESS_LINK,
  EXPLORER_TRANSECTION_LINK,
} from "@/constants/globals";
import {
  requestWalletPermission,
  getRawBalance,
  switchToPolygonSafely,
  getSeedForJazzi,
  haveMetaMask,
  gatherAllTokenBalances,
} from "@/utils/Accounts";
import { useCallback, useEffect, useState } from "react";
import { publish, subscribe } from "@/utils/EventBus";
import {
  ADD_NOTIFICATION,
  ON_TRANSECTION_COMPLETE,
  ON_WALLET_ACCOUNTS_CHANGED,
  ON_WALLET_CHAIN_CHANGED,
  ON_WALLET_CONNECT,
  ON_WALLET_USER_ACTION,
  TOGGLE_OVERLAY_VISIBILITY,
  TRIGGER_WALLET_CONNECT,
} from "@/constants/events";
import { copyTextToClipboard, middleEllipsis, openUrlInNewTab } from "@/utils/Helpers";
import styles from "./style.module.css";
import {
  KEY_CHAIN_DETAILS,
  KEY_IS_WINDOW_FOCUSED,
  KEY_WALLET_ADDRESS,
  KEY_WALLET_RAW_BALANCE,
  OVERLAY_TYPE_WITH_POPUP,
  WALLET_ADDRESS,
} from "@/constants/types";
import Image from "next/image";
import Jazzicon from "react-jazzicon";
import { Icon } from "@/components/Icon";
import { getTransections } from "@/utils/localStorage";
import { PENDING_STATUS } from "@/constants/lables";
import { Spinner } from "../Spinner";
import notiStyles from "@/components/Notifications/style.module.css";
import { getFromStore } from "@/utils/Store";
import { METAMASK_INSTALL_URL } from "@/constants/urls";

export const Wallet = () => {
  const walletAddress = getFromStore(KEY_WALLET_ADDRESS);
  const chainDetails = getFromStore(KEY_CHAIN_DETAILS);
  const rawBalance = getFromStore(KEY_WALLET_RAW_BALANCE);

  const [wallet, setWallet] = useState(walletAddress);
  const [chain, setChain] = useState(chainDetails);
  const [walletBalance, setWalletBalance] = useState(rawBalance);

  useEffect(() => {
    const unsubscribeOnConnect = subscribe(ON_WALLET_CONNECT, (data) => {
      setWallet(data.address);
      setWalletBalance(data.balance);
      setChain(data);
      if (data.address) {
        getLatestBalance();
        gatherAllTokenBalances();
      }
    });

    const unsubscribeOnAccChanged = subscribe(
      ON_WALLET_ACCOUNTS_CHANGED,
      (data) => {
        setWallet(data.address);
        setWalletBalance(data.balance);
        if (data.address) {
          getLatestBalance();
        }
      }
    );

    const unsubscribeOnChainChanged = subscribe(
      ON_WALLET_CHAIN_CHANGED,
      (data) => {
        setChain(data);
        getLatestBalance();
      }
    );

    const unsubscribeUserAction = subscribe(
      ON_WALLET_USER_ACTION,
      ({ isWalletLinked }) => {
        publish(ADD_NOTIFICATION, {
          status: isWalletLinked,
          text:
            "Wallet linked " + (isWalletLinked ? "Successfully." : "Failed."),
        });
      }
    );

    const interval = setInterval( () => {
      const isUserFocused = getFromStore(KEY_IS_WINDOW_FOCUSED);
      if( isUserFocused ) {
        getLatestBalance();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      unsubscribeOnConnect();
      unsubscribeOnAccChanged();
      unsubscribeOnChainChanged();
      unsubscribeUserAction();
    };
  }, []);

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
    const unsubscribe = subscribe(
      TRIGGER_WALLET_CONNECT,
      showWalletConnectPopup
    );
    return unsubscribe;
  }, [showWalletConnectPopup]);

  const getLatestBalance = async () => {
    setWalletBalance(await getRawBalance());
  };

  useEffect(() => {
    if (wallet) {
      getLatestBalance();
    }
    
    const unsubscribe = subscribe(ON_TRANSECTION_COMPLETE, () => {
      getLatestBalance();
      gatherAllTokenBalances();
    });

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
          <span>{"Connect MetaMask"}</span>
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

  const renderAccountDetails = ({ closePopup }) => {
    const transections = getTransections(getFromStore(KEY_WALLET_ADDRESS));

    if (transections) {
      transections.reverse();
    }

    const copyAddress = () => {
      copyTextToClipboard(wallet);
      publish(ADD_NOTIFICATION, {
        status: true,
        onlyOnce: true,
        text: "Copied Address Successfully.",
      });
    };

    return (
      <div className={styles.addressDetails}>
        <div className={styles.addressDetailsBody}>
          <div className={styles.connectedWith}>
            <h5>{"Connected with MetaMask"}</h5>
            {/* <button>{'Change'}</button> */}
          </div>

          <div className={styles.addressData}>
            <Jazzicon diameter={16} seed={getSeedForJazzi(wallet)} />
            <span>{middleEllipsis(wallet, 24)}</span>
          </div>

          <div className={styles.addressDetailsActions}>
            <button onClick={copyAddress}>
              <Icon name={"COPY"} width={12} height={12} />
              <span>{"Copy Address"}</span>
            </button>

            <a
              href={`${EXPLORER_ADDRESS_LINK}${wallet}`}
              target={"_blank"}
              rel="noreferrer"
            >
              <Icon name={"LINK"} width={12} height={12} />
              <span>{"View on PolygonScan"}</span>
            </a>
          </div>
        </div>
        <ul className={styles.addressDetailsList}>
          {transections && transections.length > 0
            ? transections.map((txn) => {
                return (
                  <li key={txn.id}>
                    <a
                      href={`${EXPLORER_TRANSECTION_LINK}${txn.id}`}
                      target={"_blank"}
                      rel="noreferrer"
                    >
                      {txn.text}
                    </a>
                    {txn.status === PENDING_STATUS && (
                      <Spinner size={"MICRO"} />
                    )}

                    {txn.status === true && (
                      <Icon
                        className={notiStyles.success}
                        width={16}
                        height={16}
                        name={"CHECK"}
                      />
                    )}

                    {txn.status === false && (
                      <Icon
                        className={notiStyles.failure}
                        width={16}
                        height={16}
                        name={"ALERT"}
                      />
                    )}
                  </li>
                );
              })
            : "Your transactions will appear here."}
        </ul>
      </div>
    );
  };

  const showWalletDetails = () => {
    publish(TOGGLE_OVERLAY_VISIBILITY, {
      isVisible: true,
      type: OVERLAY_TYPE_WITH_POPUP,
      props: {
        title: "Account",
        render: renderAccountDetails,
      },
    });
  };

  const handleWalletClick = async () => {
    if (wallet) {
      showWalletDetails();
    } else {
      if(haveMetaMask()){
        showWalletConnectPopup();
      } else {
        openUrlInNewTab(METAMASK_INSTALL_URL);
      }
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
      { haveMetaMask() &&
        <span className={styles.chain} onClick={handleChainClick}>
          {isValid ? "Polygon" : "Switch To Polygon"}
        </span>
      }
      {isValid && walletBalance && (
        <div className={styles.balance}>
          {`${walletBalance} ${DEFAULT_CURRENCY}`}
        </div>
      )}
      {/* {isValid && ( */}
        <div className={styles.address} onClick={handleWalletClick}>
          <span>{wallet ? middleEllipsis(wallet, 16) : haveMetaMask() ? "Connect Wallet" : "Install MetaMask"}</span>
          {wallet && <Jazzicon diameter={16} seed={getSeedForJazzi(wallet)} />}
        </div>
      {/* )} */}
    </div>
  );
};
