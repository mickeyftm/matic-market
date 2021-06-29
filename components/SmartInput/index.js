import { useState } from 'react';
import { publish } from '@/utils/EventBus';
import { TOGGLE_OVERLAY_VISIBILITY } from '@/constants/events';
import styles from './style.module.css';
import { Icon } from '@/components/Icon';
import { OVERLAY_TYPE_WITH_TOKEN_LIST } from '@/constants/types';
import { addClasses } from '@/utils/Helpers';
import Image from 'next/image';

export const SmartInput = ({ label, readOnly }) => {
    const [amount, setAmount] = useState(null);
    const [selectedToken, setSelectedToken] = useState(null);
    const onlyNumberRegex = /^\d*\.?\d*$/
    
    const onValueChange = (event) => {
        const val = event.target.value;
        if(onlyNumberRegex.test(val)){
            setAmount(val);
        }
    };

    const onMaxClick =  () => {
        if(readOnly) return;
    };

    const onTokenSelect = (token) => {
        setSelectedToken(token);
    }
    
    const openTokenList =  () => {
        publish(TOGGLE_OVERLAY_VISIBILITY, {
            isVisible: true,
            type: OVERLAY_TYPE_WITH_TOKEN_LIST,
            props: {
                onTokenSelected: onTokenSelect
            }
        });
    };

    return(
        <div className={styles.si}>
            <div className={styles.siLabels}>
                <span>{label}</span>
                <span>{'Balance: 1000'}</span>
            </div>
            
            <div className={styles.siContainer}>
                <input
                    readOnly={readOnly}
                    value={amount}
                    className={styles.siInput}
                    placeholder={'0.0'}
                    onChange={onValueChange}
                />
                <button className={styles.siMaxBtn} onClick={onMaxClick}>
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