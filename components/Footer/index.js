import { APP_VERSION, REDDIT_HANDLE, TWITTER_HANDLE } from '@/constants/globals';
import Image from 'next/image';
import styles from './style.module.css';
import { Icon } from '@/components/Icon';

export const Footer = () => {
  return(
	  <footer className={styles.footer}>
        <div className={styles.social}>
            <a href={TWITTER_HANDLE} target={'__blank'}>
              <Icon width={22} height={22} name={'TWITTER'} />
            </a>
            <a href={REDDIT_HANDLE} target={'__blank'}>
              <Icon width={22} height={22} name={'REDDIT'} />
            </a>
        </div>
        <a
          href="https://polygon.technology/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {'Powered by '}
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

        <div className={styles.version}>
          <span>
            {`Beta Version  ${APP_VERSION}`}
          </span>
        </div>
	  </footer>
  );
}