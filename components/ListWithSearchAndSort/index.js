import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import styles from "./style.module.css";
import { Spinner } from '@/components/Spinner';
import { addClasses } from '@/utils/Helpers';

export const ListWithSearchAndSort = ({ onItemSelected, title, className, headerName, headerValue, getValue, queryPlaceholder, disableKeys, fetchListMap, closeOverlay }) => {
    const [query, setQuery] = useState("");
    const [isLoading, setLoading] = useState(true);
    const [listItems, setListItems] = useState([]);
    const [listMap, setListMap] = useState({});

    useEffect( () => {
        (async () => {
            const _listMap = await fetchListMap();
            setListMap(_listMap);
            setLoading(false);
            filterBasedOnValue(Object.keys(_listMap), _listMap);
        })()
    }, [fetchListMap, filterBasedOnValue]);

    const filterBasedOnValue = useCallback((filteredListItems, listMap) => {
        const withValue = filteredListItems.filter( item => getValue(listMap[item]) !== '0' );
        const withoutValue = filteredListItems.filter( item => getValue(listMap[item]) === '0' );
        setListItems([ ...withValue, ...withoutValue]);
    }, [getValue]);

    const onQueryChange = (event) => {
        const _query = event.target.value;
        setQuery(_query);
        setLoading(false);

        const lowerCaseQuery = _query.toLowerCase().trim();
        const _filteredItems = Object.keys(listMap).filter( _item => {
            if(lowerCaseQuery === '') return true;

            const item = listMap[_item];
            if(
                item.name.toLowerCase().includes(lowerCaseQuery) ||
                item.symbol.toLowerCase().includes(lowerCaseQuery) ||
                item.address.toLowerCase() === lowerCaseQuery
            ) {
                return true;
            }
            return false;
        });

        if(_filteredItems.length === 0 && lowerCaseQuery.includes('0x')){
            // hit some api to fetch the search result
            setLoading(true);
        } else {
            filterBasedOnValue(_filteredItems, listMap);
        }
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
                        return(
                            <li className={addClasses([styles.lssListItem, isDisabled && styles.lssListItemDisabled])} key={item.address} onClick={() => onItemClick(item)}>
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
                                <span>{getValue ? getValue(item) : '0' }</span>
                            </li>
                        );
                    })
                }
            </ul>
        </div>
    );
};
