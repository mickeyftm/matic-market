import { addClasses } from "@/utils/Helpers";
import styles from "./style.module.css";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/constants/globals";
import { Wallet } from '@/components/Wallet';
import { Pending } from '@/components/Pending';

export const Header = () => {
  const route = useRouter();
  const isActive = (routeToCheck) => route.pathname === routeToCheck;

  return (
    <nav className={styles.navBar}>
      <div className={styles.left}>
        <Link href={"/"}>
          <a>
            <div className={styles.branding}>
              <Image
                src="/images/logo.svg"
                className={styles.footerBrandingImage}
                alt="Logo"
                height={60}
                width={60}
              />
              <span>{APP_NAME}</span>
            </div>
          </a>
        </Link>
        <ul className={styles.navList}>
          {ROUTES.map((item) => {
            const classes = addClasses([
              styles.navItem,
              isActive(item.route) ? styles.navActiveItem : "",
            ]);
            return (
              <li className={classes} key={item.id}>
                <Link href={item.route}>{item.title}</Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.right}>
          <Pending />
          <Wallet />
      </div>
    </nav>
  );
};
