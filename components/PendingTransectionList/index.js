import styles from "./style.module.css";
import Image from "next/image";
import { fromGwei } from "@/utils/Helpers";
import { getExplorerTransectionLink } from "@/utils/Accounts";

export const PendingTransectionList = ({ transections, closeOverlay }) => {
  const onCloseIconClick = () => {
    closeOverlay && closeOverlay();
  };

  return (
    <div className={styles.ptList}>
      <div className={styles.ptListHeading}>
        <h3 className={styles.ptListHeadingMain}>
          {"Pending Transections"}
          <span>
            <Image
              className={styles.ptListHelpIcon}
              width={16}
              height={16}
              src={"/images/help-circle.svg"}
              alt={"Help"}
            />
          </span>
        </h3>
        <span onClick={onCloseIconClick}>
          <Image
            className={styles.ptListCloseIcon}
            width={20}
            height={20}
            src={"/images/cross.svg"}
            alt={"Close"}
          />
        </span>
      </div>
      <ul className={styles.ptListList}>
        {transections.map((tx) => {
          return (
            <li key={tx.id} className={styles.ptListItem}>
              <a href={getExplorerTransectionLink(tx.id)} target="__blank">
                <span>{tx.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
