import { ListWithSearchAndSort } from '@/components/ListWithSearchAndSort';
import styles from './style.module.css';

export default function Assets() {
    return (
    <div className={styles.assetsList}>
        <ListWithSearchAndSort
            title = {"My Assets"}
            headerName={'Token Symbol'}
            headerValue='Balance'
            queryPlaceholder='Search by name, symbol or paste address'
            fetchListMap={()=> ({}) }
            getValue={() => ({}) }
            className={styles.list}
        />
    </div>
    );
}