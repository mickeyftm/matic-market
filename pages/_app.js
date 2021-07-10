import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Overlay } from "@/components/Overlay";
import "../styles/globals.css";
import styles from "../styles/Home.module.css";
import { Notifications } from "@/components/Notifications";
import { useEffect } from "react";
import {
  getActiveAccountAddress,
  getChainID,
  getRawBalance,
  haveMetaMask,
  onWalletAccountsChanged,
  onWalletChainChanged,
  onWalletConnect,
} from "@/utils/Accounts";
import { getFromStore, putInStore } from "@/utils/Store";
import {
  KEY_CHAIN_DETAILS,
  KEY_CHAIN_ID,
  KEY_HAVE_WALLET_APP,
  KEY_IS_WINDOW_FOCUSED,
  KEY_WALLET_ADDRESS,
  KEY_WALLET_RAW_BALANCE,
} from "@/constants/types";
import { POLYGON_CHAIN_ID } from "@/constants/globals";
import { publish } from "@/utils/EventBus";
import {
  HAVE_WALLET_APP,
  ON_WALLET_ACCOUNTS_CHANGED,
  ON_WALLET_CHAIN_CHANGED,
  ON_WALLET_CONNECT,
  ON_WINDOW_BLUR,
  ON_WINDOW_FOCUS,
} from "@/constants/events";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const timedExecution = setTimeout(async () => {
      const haveMetaMaskInstalled = getFromStore(KEY_HAVE_WALLET_APP);
      if (haveMetaMaskInstalled) {
        const wallet_approved_address = await getActiveAccountAddress();
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
      }
    }, 1500);

    onWalletConnect(async ({ chainId }) => {
      timedExecution && clearTimeout(timedExecution);

      const wallet_approved_address = await getActiveAccountAddress();
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
    });

    onWalletChainChanged((chainId) => {
      const chainDetails = {
        id: chainId,
        isPolygonChain: POLYGON_CHAIN_ID === chainId,
      };
      putInStore(KEY_CHAIN_ID, chainId);
      putInStore(KEY_CHAIN_DETAILS, chainDetails);
      publish(ON_WALLET_CHAIN_CHANGED, chainDetails);
    });

    onWalletAccountsChanged(async (accounts) => {
      if (accounts && accounts.length > 0) {
        putInStore(KEY_WALLET_ADDRESS, accounts[0]);
      } else {
        putInStore(KEY_WALLET_ADDRESS, null);
      }

      const rawBalance = await getRawBalance();
      putInStore(KEY_WALLET_RAW_BALANCE, rawBalance);

      publish(ON_WALLET_ACCOUNTS_CHANGED, {
        address: accounts && accounts.length > 0 ? accounts[0] : null,
        balance: rawBalance,
      });
    });

    const onWindowFocus = () => {
      putInStore(KEY_IS_WINDOW_FOCUSED, true);
      publish(ON_WINDOW_FOCUS);
    };

    const onWindowBlur = () => {
      putInStore(KEY_IS_WINDOW_FOCUSED, false);
      publish(ON_WINDOW_BLUR);
    };

    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("blur", onWindowBlur);

    const haveMetaMaskInstalled = haveMetaMask();
    putInStore(KEY_HAVE_WALLET_APP, haveMetaMaskInstalled);
    publish(HAVE_WALLET_APP, haveMetaMaskInstalled);

    return () => {
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  return (
    <div id="root" className={"light-theme"}>
      <Header />

      <main className={styles.main}>
        <Component {...pageProps} />
      </main>

      <Footer />

      <Overlay />
      <div className={styles.notifications}>
        <Notifications />
      </div>
    </div>
  );
}

export default MyApp;
