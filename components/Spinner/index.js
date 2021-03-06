import styles from './style.module.css';
import { addClasses } from '@/utils/Helpers';

export const Spinner = ({ size, className }) => {
    const classes = [ styles.loader, className ];

    if( size === 'MICRO') {
        classes.push( styles.loaderMicro );
    } else if( size === 'MINI') {
        classes.push( styles.loaderMini );
    } else if( size === 'SMALL' ) {
        classes.push( styles.loaderSmall );
    } else if( size === 'MEDIUM' ) {
        classes.push( styles.loaderMedium );
    } else {
        classes.push( styles.loaderFull );
    }
    
    return <div className={addClasses(classes)} />
};