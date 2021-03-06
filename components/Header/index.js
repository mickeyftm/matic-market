import { addClasses } from "@/utils/Helpers";
import styles from "./style.module.css";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/constants/globals";
import { Wallet } from '@/components/Wallet';
import { Pending } from '@/components/Pending';
import { Icon } from "../Icon";

export const Header = () => {
  const route = useRouter();
  const isActive = (routeToCheck) => route.pathname === routeToCheck;

  return (
    <nav className={styles.navBar}>
      <div className={styles.left}>
        <Link href={"/"}>
          <a className={styles.homeLink}>
            <div className={styles.branding}>
              <div>
                <Icon
                  className={styles.logo}
                  height={36}
                  width={36}
                  name={'LOGO'}
                  />
                  <div />
              </div>
            </div>
            <span>{APP_NAME}</span>
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
