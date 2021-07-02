import { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import styles from "./style.module.css";
import { publish, subscribe } from "@/utils/EventBus";
import {
  ON_PENDING_TRANSECTION,
  ON_TRANSECTION_COMPLETE,
  TOGGLE_OVERLAY_VISIBILITY,
} from "@/constants/events";
import { OVERLAY_TYPE_WITH_PENDING_LIST } from "@/constants/types";
import { logTransection } from "@/utils/Accounts";

export const Pending = () => {
  const [pendingList, setPendingList] = useState([]);

  useEffect(() => {
    subscribe(ON_PENDING_TRANSECTION, async (transection) => {
      setPendingList([...pendingList, transection]);
      logTransection({
        transection,
        status: "PENDING",
      });
    });

    subscribe(ON_TRANSECTION_COMPLETE, ({ id, status }) => {
      const newPendingList = pendingList.filter((item) => item.id !== id);
      const ourItem = pendingList.filter((item) => item.id === id);
      setPendingList(newPendingList);
      logTransection({
        transection: ourItem[0],
        status,
      });
    });
  });

  const openPendingTransections = () => {
    publish(TOGGLE_OVERLAY_VISIBILITY, {
      isVisible: true,
      type: OVERLAY_TYPE_WITH_PENDING_LIST,
      props: {
        transections: pendingList,
      },
    });
  };

  return (
    <>
      {pendingList.length > 0 && (
        <div className={styles.pending} onClick={openPendingTransections}>
          <span>{`${pendingList.length} Pending`}</span>
          <Spinner className={styles.spinner} size={"MINI"} />
        </div>
      )}
    </>
  );
};
