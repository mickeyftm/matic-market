import { useState } from 'react';
import Image from 'next/image';
import styles from "./style.module.css";
import { tokens } from '@/constants/globals';
import { Spinner } from '@/components/Spinner';
import { publish } from '@/utils/EventBus';
import { TOGGLE_OVERLAY_VISIBILITY } from '@/constants/events';

export const ListWithSearchAndSort = ({ onTokenSelected, closeOverlay }) => {
    const [query, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);
    const [listItems, setListItems] = useState(Object.keys(tokens));

    const onQueryChange = (event) => {
        const _query = event.target.value;
        setQuery(_query);
        setLoading(false);

        const lowerCaseQuery = _query.toLowerCase().trim();
        const _filteredItems = Object.keys(tokens).filter( _token => {
            if(lowerCaseQuery === '') return true;

            const token = tokens[_token];
            if(
                token.name.toLowerCase().includes(lowerCaseQuery) ||
                token.symbol.toLowerCase().includes(lowerCaseQuery) ||
                token.address.toLowerCase() === lowerCaseQuery
            ) {
                return true;
            }
            return false;
        });

        if(_filteredItems.length === 0 && lowerCaseQuery.includes('0x')){
            // hit some API to check for the token
            setLoading(true);
        } else {
            setListItems(_filteredItems);
        }
    };

    const onItemClick = (token) => {
        onTokenSelected && onTokenSelected(token);
        onCloseIconClick();
    }

    const onCloseIconClick = () => {
        closeOverlay && closeOverlay();
    }

    return (
        <div className={styles.lssContainer}>
            <div className={styles.lssHeading}>
                <h3 className={styles.lssHeadingMain}>
                    {"Search a token"}
                    <span>
                        <Image
                            className={styles.lssHelpIcon}
                            width={16}
                            height={16}
                            src={'/images/help-circle.svg'}
                            alt={'Help'}
                        />
                    </span>
                </h3>
                <span onClick={onCloseIconClick}>
                    <Image
                        className={styles.lssCloseIcon}
                        width={20}
                        height={20}
                        src={'/images/cross.svg'}
                        alt={'Close'}
                    />
                </span>
            </div>

            <input
                placeholder={'Search by name or Paste token address'}
                value={query}
                autoFocus={true}
                onChange={onQueryChange}
                className={styles.lssInput}
            />

            <div className={styles.lssListHeaders}>
                <span>{'Token Symbol'}</span>
                <span>{'Balance'}</span>
            </div>

            <ul className={styles.lssList}>
                {
                    isLoading ? <Spinner size={'MEDIUM'} />
                    : listItems.map( _item => {
                        const item = tokens[_item];
                        return(
                            <li className={styles.lssListItem} key={item.address} onClick={() => onItemClick(item)}>
                                <div>
                                    <Image
                                        className={styles.lssListItemIcon}
                                        width={25}
                                        height={25}
                                        src={item.logoURI}
                                        alt={item.name}
                                    />
                                    <p>
                                        <span>{item.symbol}</span>
                                        <span className={styles.lssListItemName}>{item.name}</span>
                                    </p>
                                </div>
                
                                {/* We need to fetch this information from wallet */}
                                <span>0</span>
                            </li>
                        );
                    })
                }
            </ul>
        </div>
    );
};
