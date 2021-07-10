const { useState, useEffect, useCallback } = require("react");
import { ADD_NOTIFICATION } from "@/constants/events";
import { NOTIFICATION_STAND_BY_TIME } from "@/constants/globals";
import { subscribe } from "@/utils/EventBus";
import { getUniqueId } from "@/utils/Helpers";
import { Icon } from "../Icon";
import styles from "./style.module.css";

export const Notifications = () => {
  const [notificationList, setNotificationList] = useState([]);
  const [userFocused, setUserFocused] = useState(true);

  const addNotification = useCallback((noti) => {
    const _notis = [...notificationList];
    let shouldAdd = true;
    
    if(noti.onlyOnce) {
      _notis.forEach( notification => {
        if(notification.text === noti.text && notification.status === noti.status) {
          shouldAdd = false;
          return false;
        }
      });
    }

    if(shouldAdd) {
      _notis.push({
        id: getUniqueId(),
        ...noti
      });
      setNotificationList(_notis);
    }
  }, [notificationList]);

  useEffect(() => {
    const unsubscribe = subscribe(ADD_NOTIFICATION, (noti) => {
      addNotification(noti);
    });

    window.addEventListener("focus", () => {
      setUserFocused(true);
    });

    window.addEventListener("blur", () => {
      setUserFocused(false);
    });

    return () => {
      unsubscribe();
    };
  }, [addNotification]);

  useEffect(() => {
    setTimeout(() => {
      if(userFocused && notificationList.length > 0 ){
        const _notifications = [...notificationList];
        _notifications.shift();
        setNotificationList(_notifications);
      }
    }, NOTIFICATION_STAND_BY_TIME);
  }, [userFocused, notificationList]);

  const getNotificationIcon = (status) => {
    switch (status) {
      case "warn":
        return (
          <Icon
            width={24}
            height={24}
            className={styles.warn}
            name={"WARNING"}
          />
        );
    }

    if (status) {
      return (
        <Icon
          width={24}
          height={24}
          className={styles.success}
          name={"CHECK"}
        />
      );
    } else {
      return (
        <Icon
          width={24}
          height={24}
          className={styles.failure}
          name={"ALERT"}
        />
      );
    }
  };

  return (
    <ul className={styles.notifications}>
      {notificationList.map((noti, index) => {
        return (
          <li key={index} className={styles.notification}>
            <div className={styles.status}>
              {getNotificationIcon(noti.status)}
            </div>
            <div className={styles.content}>
              {`${noti.status === false ? "Failed! " : ""}${
                noti.text
              }`}
              {noti.link && (
                <span className={styles.notificationLink}>
                  <a href={noti.link} target={"_blank"} rel="noreferrer">
                    {noti.linkText}{" "}
                  </a>
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};
