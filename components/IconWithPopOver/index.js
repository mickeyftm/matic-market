import styles from './style.module.css';
import { Icon } from '@/components/Icon';

export const IconWithPopOver = (props) => {
    return(
    <div className={styles.iwp}>
        <Icon
            width={16}
            height={16}
            name= { props.name || 'HELP' }
        />
        {
            props.showContent &&
            <div className={styles.popover}>
                {props.content}
            </div>
        }
    </div>
    );
};