import { getIcon } from '@/utils/getIcon';
import { addClasses } from '@/utils/Helpers';
import styles from './style.module.css';

export const Icon = (props) => {
    const icon = getIcon(props.name);
    return(
        <div
            style={{ 
                width : props.width || 20,
                height: props.height || 20,
            }}
            className={addClasses([styles.icon, props.className])}
            dangerouslySetInnerHTML={{__html: icon }}
        />
    );
};