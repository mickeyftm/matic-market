import styles from './style.module.css';
import Image from 'next/image';
import { fromGwei } from '@/utils/Helpers';

export const PendingTransectionList = ({ transections, closeOverlay }) => {
    const onCloseIconClick = () => {
        closeOverlay && closeOverlay();
    }

    return(
        <div className={styles.ptList}>
            <div className={styles.ptListHeading}>
                <h3 className={styles.ptListHeadingMain}>
                    {'Pending Transections'}
                    <span>
                        <Image
                            className={styles.ptListHelpIcon}
                            width={16}
                            height={16}
                            src={'/images/help-circle.svg'}
                            alt={'Help'}
                        />
                    </span>
                </h3>
                <span onClick={onCloseIconClick}>
                    <Image
                        className={styles.ptListCloseIcon}
                        width={20}
                        height={20}
                        src={'/images/cross.svg'}
                        alt={'Close'}
                    />
                </span>
            </div>
            <ul className={styles.ptListList}>
                {
                    transections.map( item => {
                        const toAmount = fromGwei(item.toAmount, item.toToken.decimals, 6);
                        const fromAmount = fromGwei(item.fromAmount, item.fromToken.decimals, 6);
                        const to = item.toToken.symbol;
                        const from = item.fromToken.symbol;
                        return(
                            <li key={item.id} className={styles.ptListItem}>
                                <a href={`https://polygonscan.com/tx/${item.id}`} target='__blank'>
                                    <span>{`Swap ${fromAmount} ${from} for ${toAmount} ${to}`}</span>
                                </a>
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}