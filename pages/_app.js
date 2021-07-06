import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Overlay } from '@/components/Overlay';
import '../styles/globals.css';
import styles from '../styles/Home.module.css';
import { Notifications } from "@/components/Notifications";
import { useEffect } from 'react';
import { getActiveAccountAddress, getRawBalance, onWalletAccountsChanged, onWalletChainChanged, onWalletConnect, onWalletDisconnect } from '@/utils/Accounts';
import { getFromStore, logMemStore, putInStore, putInStoreAsync } from '@/utils/Store';
import { KEY_CHAIN_DETAILS, KEY_CHAIN_ID, KEY_WALLET_ADDRESS, KEY_WALLET_RAW_BALANCE, WALLET_ADDRESS } from '@/constants/types';
import { POLYGON_CHAIN_ID } from '@/constants/globals';
import { publish } from '@/utils/EventBus';
import { ON_WALLET_ACCOUNTS_CHANGED, ON_WALLET_CHAIN_CHANGED, ON_WALLET_CONNECT } from '@/constants/events';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    onWalletConnect( async ({ chainId }) => {
      const wallet_approved_address = await getActiveAccountAddress();
      const chainDetails = {
        id: chainId,
        isPolygonChain: POLYGON_CHAIN_ID === chainId
      };
      putInStore(KEY_CHAIN_ID, chainId);
      putInStore(KEY_CHAIN_DETAILS, chainDetails);
      putInStore(KEY_WALLET_ADDRESS, wallet_approved_address);
      
      const wallet_balance = await getRawBalance();
      putInStore(KEY_WALLET_RAW_BALANCE, wallet_balance);

      publish(ON_WALLET_CONNECT, {
        ...chainDetails,
        address: wallet_approved_address,
        rawBalance: wallet_balance
      });
    });
    
    onWalletChainChanged((chainId) => {
      const chainDetails = {
        id: chainId,
        isPolygonChain: POLYGON_CHAIN_ID === chainId
      };
      putInStore(KEY_CHAIN_ID, chainId);
      putInStore(KEY_CHAIN_DETAILS, chainDetails);
      publish(ON_WALLET_CHAIN_CHANGED, chainDetails);
    });
    
    onWalletAccountsChanged(async (accounts) => {
      if(accounts && accounts.length > 0) {
        putInStore(KEY_WALLET_ADDRESS, accounts[0]);
      } else {
        putInStore(KEY_WALLET_ADDRESS, null);
      }
      
      const rawBalance = await getRawBalance();
      putInStore(KEY_WALLET_RAW_BALANCE, rawBalance);

      publish(ON_WALLET_ACCOUNTS_CHANGED, {
        address: accounts && accounts.length > 0 ? accounts[0] : null,
        balance: rawBalance
      });
    });

  }, []);

  return(
    <div id='root'>
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

export default MyApp
