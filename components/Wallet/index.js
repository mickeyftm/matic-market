import {
  DEFAULT_CURRENCY,
  EXPLORER_ADDRESS_LINK,
  EXPLORER_TRANSECTION_LINK,
  POLYGON_CHAIN_ID,
} from "@/constants/globals";
import {
  isWalletLinked,
  requestWalletPermission,
  getRawBalance,
  switchToPolygonSafely,
  getChainID,
  getSeedForJazzi,
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
  WALLET_LINKED,
} from "@/constants/events";
import { copyTextToClipboard, middleEllipsis } from "@/utils/Helpers";
import styles from "./style.module.css";
import { KEY_CHAIN_DETAILS, KEY_WALLET_ADDRESS, KEY_WALLET_RAW_BALANCE, OVERLAY_TYPE_WITH_POPUP, WALLET_ADDRESS } from "@/constants/types";
import Image from "next/image";
import Jazzicon from "react-jazzicon";
import { Icon } from "@/components/Icon";
import { getTransections } from "@/utils/localStorage";
import { PENDING_STATUS } from "@/constants/lables";
import { Spinner } from "../Spinner";
import notiStyles from '@/components/Notifications/style.module.css';
import { getFromStore } from "@/utils/Store";

export const Wallet = () => {
  const walletAddress = getFromStore(KEY_WALLET_ADDRESS);
  const chainDetails = getFromStore(KEY_CHAIN_DETAILS);
  const rawBalance = getFromStore(KEY_WALLET_RAW_BALANCE);

  const [wallet, setWallet] = useState(walletAddress);
  const [chain, setChain] = useState(chainDetails);
  const [walletBalance, setWalletBalance] = useState(rawBalance);

  useEffect( () => {
    const unsubscribeOnConnect = subscribe(ON_WALLET_CONNECT, (data) => {
      setWallet(data.address);
      setWalletBalance(data.balance);
      setChain(data);
    });

    const unsubscribeOnAccChanged = subscribe(ON_WALLET_ACCOUNTS_CHANGED, (data) => {
      setWallet(data.address);
      setWalletBalance(data.balance);
    });

    const unsubscribeOnChainChanged = subscribe(ON_WALLET_CHAIN_CHANGED, (data) => {
      setChain(data);
    });

    const unsubscribeUserAction = subscribe(
      ON_WALLET_USER_ACTION,
      ({ isWalletLinked }) => {
        publish(ADD_NOTIFICATION, {
          status: isWalletLinked,
          text: "Wallet linked " + (isWalletLinked ? "Successfully." : "Failed."),
        });
      }
    );

    return () => {
      unsubscribeOnConnect();
      unsubscribeOnAccChanged();
      unsubscribeOnChainChanged();
      unsubscribeUserAction();
    }
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

    (async () => {
      const chainId = await getChainID();
      if (chainId) {
        const chainInfo = {
          chainId: chainId,
          isPolygonChain: chainId === POLYGON_CHAIN_ID,
        };
        setChain(chainInfo);
      }

      const _wallet = await isWalletLinked();
      if (_wallet) {
        setWallet(_wallet);
        publish(WALLET_LINKED, { linked: !!_wallet });
        getLatestBalance();
      }
    })();
    return unsubscribe;
  }, [showWalletConnectPopup]);

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

  const renderAccountDetails = ({ closePopup }) => {
    const transections = getTransections( getFromStore(KEY_WALLET_ADDRESS) );

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

            <a href={`${EXPLORER_ADDRESS_LINK}${wallet}`} target={"__blank"}>
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
                      target={"__blank"}
                    >
                      {txn.text}
                    </a>
                    {txn.status === PENDING_STATUS && (
                      <Spinner size={"MICRO"} />
                    )}

                    {txn.status === true && (
                      <Icon className={notiStyles.success} width={16} height={16} name={'CHECK'} />
                    )}

                    {txn.status === false && (
                      <Icon className={notiStyles.failure} width={16} height={16} name={'ALERT'} />
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
          <span>{wallet ? middleEllipsis(wallet, 16) : "Connect Wallet"}</span>
          {wallet && <Jazzicon diameter={16} seed={getSeedForJazzi(wallet)} />}
        </div>
      )}
    </div>
  );
};
