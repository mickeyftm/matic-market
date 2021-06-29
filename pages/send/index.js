import styles from '@/styles/common.module.css';

export default function Send() {
    const onClick = () => {
        document.body.classList.toggle('dark-theme');
    };
    
    return (
        <div className={styles.centerContainer}>
            <span onClick={onClick}>Send Page</span>
        </div>
    );
}