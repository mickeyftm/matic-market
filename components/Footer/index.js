import Image from 'next/image';
import styles from './style.module.css';

export const Footer = () => {
  return(
	  <footer className={styles.footer}>
        <a
          href="https://polygon.technology/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image
              src="/images/polygon.svg"
              className={styles.footerBrandingImage}
              alt="Polygon previously Matic Network"
              height={36}
              width={120}
            />
          </span>
        </a>
	  </footer>
  );
}