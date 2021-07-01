import { useEffect, useState } from 'react';
import { publish } from '@/utils/EventBus';
import { TOGGLE_OVERLAY_VISIBILITY } from '@/constants/events';
import styles from './style.module.css';
import { Icon } from '@/components/Icon';
import { OVERLAY_TYPE_WITH_TOKEN_LIST } from '@/constants/types';
import { addClasses } from '@/utils/Helpers';
import Image from 'next/image';
import axios from 'axios';
import { FETCH_TOKEN_LIST } from '@/constants/urls';

export const SmartInput = ({ label, readOnly, balances, disableKeys = [], amount : amountVal, onAmountChanged, selectedToken: selectedTokenVal = null, onTokenChanged }) => {
    const [amount, setAmount] = useState(amountVal || '');
    const [selectedToken, setSelectedToken] = useState(selectedTokenVal);
    const onlyNumberRegex = /^\d*\.?\d*$/

    useEffect( ()=> {
        setSelectedToken(selectedTokenVal);
    }, [selectedTokenVal]);
    
    useEffect( ()=> {
        setAmount(amountVal);
    }, [amountVal]);
    
    const onValueChange = (event) => {
        const val = event.target.value;
        if(onlyNumberRegex.test(val)){
            setAmount(val);
            onAmountChanged && onAmountChanged(val);
        }
    };

    const onMaxClick =  () => {
        if(readOnly) return;

        if(selectedToken) {
            const token = balances[selectedToken.address];
            setAmount(token ? token.balance : '');
            onAmountChanged && onAmountChanged(token ? token.balance : '');
        }
    };

    const onTokenSelect = (token) => {
        setSelectedToken(token);
        onTokenChanged && onTokenChanged(token);
        setAmount('');
        onAmountChanged && onAmountChanged('');
    }

    const fetchTokenList = async () => {
        try {
            const { data : response } = await axios.get(FETCH_TOKEN_LIST);
            if(response.success) {
                return response.data.tokens;
            }
        } catch {}
        return {};
    }
    
    const openTokenList =  () => {
        publish(TOGGLE_OVERLAY_VISIBILITY, {
            isVisible: true,
            type: OVERLAY_TYPE_WITH_TOKEN_LIST,
            props: {
                title: "Search a token",
                headerName: 'Token Symbol',
                headerValue: 'Balance',
                queryPlaceholder: 'Search by name or Paste token address',
                fetchListMap: fetchTokenList,
                onItemSelected: onTokenSelect,
                getValue: getBalance,
                disableKeys
            }
        });
    };
    
    const getBalance = (token, prefix = '') => {
        if(token) {
            const balanceObj = balances[token ? token.address : ''];
            return `${prefix}${balanceObj ? balanceObj.balance : '0'}`;
        }
        return '-';
    };

    return(
        <div className={styles.si}>
            <div className={styles.siLabels}>
                <span>{label}</span>
                <span>{getBalance(selectedToken, 'Balance: ')}</span>
            </div>
            
            <div className={styles.siContainer}>
                <input
                    readOnly={readOnly}
                    value={amount}
                    className={styles.siInput}
                    placeholder={'0.0'}
                    onChange={onValueChange}
                />

                <button className={addClasses([styles.siMaxBtn, readOnly && styles.siMaxBtnHidden])} onClick={onMaxClick}>
                    {'MAX'}
                </button>

                <button className={addClasses([styles.siSelectToken, selectedToken ? styles.siSelectedToken : '' ])} onClick={openTokenList}>
                    {
                        selectedToken
                        ?
                            <div>
                                <div className={styles.selectedTokenIconContainer}>
                                <Image
                                    className={styles.selectedTokenIcon}
                                    width={25}
                                    height={25}
                                    src={selectedToken.logoURI}
                                    alt={selectedToken.name}
                                />
                                </div>
                                <span>
                                    { selectedToken.symbol }
                                </span>
                            </div>
                        :
                            <span>
                                {'Select Token'}
                            </span>
                    }
                    <Icon 
                        name='DOWN'
                        width={24}
                        height={24}
                    />
                </button>
            </div>
        </div>
    );
}