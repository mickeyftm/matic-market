import { POLYGON_CHAIN_ID } from '@/constants/globals';
import { isWalletLinked, requestWalletPermission, onWalletConnect, onWalletDisconnect, onWalletAccountsChanged, onWalletChainChanged, getAllERC20Tokens, getRawBalance } from '@/utils/Accounts';
import { useEffect, useState } from 'react';
import { publish, subscribe } from '@/utils/EventBus';
import { ON_PENDING_TRANSECTION, ON_TRANSECTION_COMPLETE, WALLET_CONNECTED, WALLET_DISCONNECTED, WALLET_LINKED } from '@/constants/events';
import { middleEllipsis } from '@/utils/Helpers';
import styles from './style.module.css';

export const Wallet = () => {
    const [ wallet, setWallet] = useState(false);
    const [chain, setChain] = useState({});
    const [walletBalance, setWalletBalance] = useState(null);

    useEffect( () => {
        (async () => {
            const _walet = await isWalletLinked()
            setWallet( _walet );
            publish(WALLET_LINKED, { linked : !!_walet });
        })();

        onWalletConnect( (info) => {
            const chainInfo = {
                chainId: info.chainId,
                isPolygonChain: info.chainId === POLYGON_CHAIN_ID
            };
            setChain(chainInfo);
            publish(WALLET_CONNECTED, chainInfo);
            console.log('onWalletConnect', info);
        });

        onWalletDisconnect( (error) => {
            publish(WALLET_DISCONNECTED);
            publish(WALLET_LINKED, { linked : false });
            console.log('onWalletDisconnect',error);
        });

        onWalletAccountsChanged( (accounts) => {
            if(accounts.length > 0) {
                setWallet(accounts[0]);
                publish(WALLET_LINKED, { linked : true });
            } else {
                publish(WALLET_LINKED, { linked : false });
                setWallet(false);
            }
            console.log('onWalletAccountsChanged', accounts);
        });

        onWalletChainChanged( (chain) => {
            console.log('onWalletChainChanged', chain);
            publish(WALLET_LINKED, { linked : chain.chainId === POLYGON_CHAIN_ID });
        });

    }, []);

    const getLatestBalance = async () => {
        setWalletBalance( await getRawBalance() );
    }

    useEffect( () => {
        if(wallet) {
            getLatestBalance();
        }
        subscribe(ON_TRANSECTION_COMPLETE, getLatestBalance);
        subscribe(ON_PENDING_TRANSECTION, getLatestBalance);
    }, [wallet]);

    const handleWalletClick = async () => {
        if(wallet) {
            //show details on popup
        } else {
            await requestWalletPermission();
        }
    }

    return (
        <div className={styles.wallet}>
            {
                wallet && walletBalance &&
                <div className={styles.balance}>
                    {`${walletBalance} MATIC`}
                </div>
            }
            <div className={styles.address} onClick={handleWalletClick}>
                {wallet ? middleEllipsis(wallet, 16) : 'Connect Wallet'}
            </div>
        </div>
    );
};