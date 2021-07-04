const { useState, useEffect } = require("react");
import { ADD_NOTIFICATION } from '@/constants/events';
import { subscribe } from '@/utils/EventBus';
import { Icon } from '../Icon';
import styles from './style.module.css';

export const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [userFocused, setUserFocused] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribe(ADD_NOTIFICATION, (notification) => {
            const _notifications = [...notifications, notification];
            setNotifications(_notifications);
        });
        
        window.addEventListener('focus', () => {
            setUserFocused(true);
        });

        window.addEventListener('blur', () => {
            setUserFocused(false);
        });

        return unsubscribe;
    });

    useEffect( () => {
        const NOTIFICATION_STAND_BY_TIME = 5000;
        if(userFocused && notifications.length > 0) {
            setTimeout( () => {
                const _notifications = [ ...notifications ];
                _notifications.shift();
                setNotifications( _notifications );
            }, NOTIFICATION_STAND_BY_TIME);
        }
    }, [notifications, userFocused]);

    return (
        <ul className={styles.notifications}>
            {
                notifications.map( (notification, index) => {
                    return (
                        <li key={index} className={styles.notification}>
                            <div className={styles.status}>
                                {
                                    notification.status == true
                                    ? <Icon width={24} height={24} className={styles.success} name={'CHECK'} />
                                    : <Icon width={24} height={24} className={styles.failure} name={'ALERT'} />
                                }
                            </div>
                            <div className={styles.content}>
                                {`${notification.status == true ? '' : 'Failed! ' }${notification.text}`}
                                {
                                    notification.link && 
                                    <span className={styles.notificationLink}>
                                        <a href={notification.link} target={'__blank'}>{notification.linkText} </a>
                                    </span>
                                }
                            </div>
                        </li>
                    )
                })
            }
        </ul>
    )
}