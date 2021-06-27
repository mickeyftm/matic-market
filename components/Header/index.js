import { addClasses } from '@/utils/helpers';
import styles from './style.module.css';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/constants/globals';

export const Header = () => {
    const route = useRouter();
    const isActive = (routeToCheck) => route.pathname === routeToCheck;
    return (
        <nav className={styles.navBar}>
            <a href={"/"}>
                <div className={styles.branding}>
                    <Image
                        src="/images/logo.svg"
                        className={styles.footerBrandingImage}
                        alt="Logo"
                        height={60}
                        width={60}
                    />
                    <span>
                        {APP_NAME}
                    </span>
                </div>
            </a>
            <ul className={styles.navList}>
                {
                    ROUTES.map( item => {
                        const classes = addClasses([
                            styles.navItem,
                            isActive(item.route) ? styles.navActiveItem : '' ]
                        );
                        return (
                            <li className={classes} key={item.id}>
                                <Link href = {item.route} >
                                    {item.title}
                                </Link>
                            </li>
                        );
                    })
                }
            </ul>
        </nav>
    );
}