import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import styles from "./style.module.css";
import { Spinner } from "@/components/Spinner";
import { Icon } from "@/components/Icon";
import { IconWithPopOver } from "@/components/IconWithPopOver";
import { addClasses, noop } from "@/utils/Helpers";
import { fromGwei } from "@/utils/calc";
import { addERC20TokenToWallet } from "@/utils/Accounts";
import { subscribe } from "@/utils/EventBus";

export const ListWithSearchAndSort = ({
  allowExternalSearch,
  getListMap,
  onExternalSearch,
  subscribeEvent,
  onItemSelected,
  title,
  className,
  headerName,
  headerValue,
  getValue = noop,
  queryPlaceholder,
  disableKeys = [],
  fetchListMap,
  closeOverlay,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [listItems, setListItems] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const [isPopOverOpen, setPopOverOpen] = useState(false);

  useEffect(() => {
    if (subscribeEvent) {
      const unsubscribe = subscribe(subscribeEvent, () => {
        setEventCount(eventCount + 1);
      });
      return unsubscribe;
    }
  }, [eventCount, subscribeEvent]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const _listMap = await fetchListMap();
      setLoading(false);
      onQueryChange(null, _listMap);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortBasedOnValue = useCallback(
    (itemsList, listMap) => {
      const withValue = itemsList.filter(
        (item) => getValue(listMap[item]) !== "0"
      );
      const withoutValue = itemsList.filter(
        (item) => getValue(listMap[item]) === "0"
      );
      setListItems([...withValue, ...withoutValue]);
    },
    [getValue]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onQueryChange = async (event, listMapVal = getListMap()) => {
    const _query = event ? event.target.value : "";

    if (_query && _query === query) return;

    setQuery(_query);
    setLoading(true);
    const lowerCaseQuery = _query.toLowerCase().trim();
    const _filteredItems = Object.keys(listMapVal).filter((_item) => {
      if (lowerCaseQuery === "") return true;

      const item = listMapVal[_item];
      if (
        item.name.toLowerCase().includes(lowerCaseQuery) ||
        item.symbol.toLowerCase().includes(lowerCaseQuery) ||
        item.address.toLowerCase() === lowerCaseQuery
      ) {
        return true;
      }
      return false;
    });

    if (allowExternalSearch && _filteredItems.length === 0) {
      setLoading(true);
      onExternalSearch &&
        (await onExternalSearch(lowerCaseQuery, setListItems));
    } else {
      sortBasedOnValue(_filteredItems, listMapVal);
    }
    setLoading(false);
  };

  const onItemClick = (item) => {
    onItemSelected && onItemSelected(item);
    onCloseIconClick();
  };

  const onCloseIconClick = () => {
    closeOverlay && closeOverlay();
  };

  const addTokenToWallet = (event, token) => {
    event.stopPropagation();
    event.preventDefault();
    addERC20TokenToWallet(token);
  };

  const handlePopover = (isOpen) => {
    setPopOverOpen(isOpen);
  }

  return (
    <div className={addClasses([styles.lssContainer, className])}>
      <div className={styles.lssHeading}>
        <h3 className={styles.lssHeadingMain}>
          {title}
          <div onMouseEnter={() => handlePopover(true)} onMouseLeave={() => handlePopover(false)}>
              <IconWithPopOver
                content={'Find a ERC20 token by searching by name or symbol or by its contract address.'}
                showContent={isPopOverOpen}
              />
          </div>
        </h3>
        {closeOverlay && (
          <span onClick={onCloseIconClick}>
            <Image
              className={styles.lssCloseIcon}
              width={20}
              height={20}
              src={"/images/cross.svg"}
              alt={"Close"}
            />
          </span>
        )}
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
        {isLoading ? (
          <Spinner className={styles.spinner} size={"MEDIUM"} />
        ) : (
          listItems.map((_item) => {
            const isDisabled = disableKeys.includes(_item);
            const _listMap = getListMap();
            const item = _listMap[_item];
            const balance = item.balance
              ? fromGwei(item.balance, item.decimals)
              : getValue
              ? getValue(item)
              : "0";
            return (
              <li
                className={addClasses([
                  styles.lssListItem,
                  isDisabled && styles.lssListItemDisabled,
                ])}
                key={item.address}
                onClick={() => onItemClick(item)}
              >
                <div>
                  <Image
                    className={styles.lssListItemIcon}
                    width={25}
                    height={25}
                    src={item.logoURI || "/images/help-circle.svg"}
                    alt={item.name}
                  />
                  <div>
                    <div className={styles.lssListItemTitle}>
                      <span>{item.symbol}</span>
                      <Icon
                        className={styles.lssListItemAddIcon}
                        name={"ADD"}
                        onClick={(e) => addTokenToWallet(e, item)}
                        width={15}
                        height={15}
                      />
                    </div>
                    <span className={styles.lssListItemName}>{item.name}</span>
                  </div>
                </div>
                <span>{balance}</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
