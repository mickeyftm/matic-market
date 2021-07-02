import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import styles from "./style.module.css";
import { Spinner } from '@/components/Spinner';
import { addClasses, fromGwei, noop } from '@/utils/Helpers';
import { getERC20TokenDetails } from '@/utils/Accounts';

export const ListWithSearchAndSort = ({ allowExternalSearch = true, onItemSelected, title, className, headerName, headerValue, getValue = noop, queryPlaceholder, disableKeys = [], fetchListMap, closeOverlay }) => {
    const [query, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);
    const [listItems, setListItems] = useState([]);
    const [listMap, setListMap] = useState({});

    useEffect( () => {
        (async () => {
            setLoading(true);
            const _listMap = await fetchListMap();
            setListMap(_listMap);
            setLoading(false);
            onQueryChange(null, _listMap);
        })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sortBasedOnValue = useCallback((itemsList, listMap) => {
        const withValue = itemsList.filter( item => getValue(listMap[item]) !== '0' );
        const withoutValue = itemsList.filter( item => getValue(listMap[item]) === '0' );
        setListItems([ ...withValue, ...withoutValue]);
    }, [getValue]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onQueryChange = async (event, listMapVal = listMap) => {
        const _query = event ? event.target.value : '';
        
        if(_query && _query === query) return;

        setQuery(_query);
        setLoading(true);
        const lowerCaseQuery = _query.toLowerCase().trim();
        const _filteredItems = Object.keys(listMapVal).filter( _item => {
            if(lowerCaseQuery === '') return true;

            const item = listMapVal[_item];
            if(
                item.name.toLowerCase().includes(lowerCaseQuery) ||
                item.symbol.toLowerCase().includes(lowerCaseQuery) ||
                item.address.toLowerCase() === lowerCaseQuery
            ) {
                return true;
            }
            return false;
        });

        if(allowExternalSearch && _filteredItems.length === 0 ){
            setLoading(true);
            const _address = lowerCaseQuery;
            const details = await getERC20TokenDetails(_address);
            if(details) {
                setListItems([_address]);
                setListMap({
                    ...listMap,
                    [_address]: details
                });
            } else {
                setListItems([]);
            }
        } else {
            sortBasedOnValue(_filteredItems, listMapVal);
        }
        setLoading(false);
    };

    const onItemClick = (item) => {
        onItemSelected && onItemSelected(item);
        onCloseIconClick();
    }

    const onCloseIconClick = () => {
        closeOverlay && closeOverlay();
    }

    return (
        <div className={addClasses([styles.lssContainer, className])}>
            <div className={styles.lssHeading}>
                <h3 className={styles.lssHeadingMain}>
                    {title}
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
                {
                   closeOverlay && 
                    <span onClick={onCloseIconClick}>
                        <Image
                            className={styles.lssCloseIcon}
                            width={20}
                            height={20}
                            src={'/images/cross.svg'}
                            alt={'Close'}
                        />
                    </span>
                }
            </div>

            <input
                placeholder={queryPlaceholder}
                value={query}
                autoFocus={true}
                onChange={onQueryChange}
                className={styles.lssInput}
            />

            <div className={styles.lssListHeaders}>
                <span>{headerName}</span>
                <span>{headerValue}</span>
            </div>

            <ul className={styles.lssList}>
                {
                    isLoading ? <Spinner className={styles.spinner} size={'MEDIUM'} />
                    : listItems.map( _item => {
                        const isDisabled = disableKeys.includes(_item);
                        const item = listMap[_item];
                        const balance = item.balance ? fromGwei(item.balance, item.decimals) : getValue ? getValue(item) : '0';
                        return(
                            <li className={addClasses([styles.lssListItem, isDisabled && styles.lssListItemDisabled])} key={item.address} onClick={() => onItemClick(item)}>
                                <div>
                                    <Image
                                        className={styles.lssListItemIcon}
                                        width={25}
                                        height={25}
                                        src={item.logoURI || '/images/help-circle.svg'}
                                        alt={item.name}
                                    />
                                    <p>
                                        <span>{item.symbol}</span>
                                        <span className={styles.lssListItemName}>{item.name}</span>
                                    </p>
                                </div>
                                <span>{balance}</span>
                            </li>
                        );
                    })
                }
            </ul>
        </div>
    );
};
