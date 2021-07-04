import { noop } from "@/utils/Helpers";
import Image from 'next/image';
import styles from './style.module.css';

export const Popup = ({ title, closeOverlay: onCloseIconClick = noop, render }) => {
    const renderProps = {
        closePopup: onCloseIconClick
    };

    return (
        <div className={styles.popup}>
            <div className={styles.header}>
                <h3>{title}</h3>
                <span onClick={onCloseIconClick}>
                    <Image
                        className={styles.popupCloseIcon}
                        width={20}
                        height={20}
                        src={'/images/cross.svg'}
                        alt={'Close'}
                    />
                </span>
            </div>
            <div className={styles.body}>
                { render && render(renderProps) }
            </div>
        </div>
    );
}