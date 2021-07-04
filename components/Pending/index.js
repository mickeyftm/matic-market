import { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import styles from "./style.module.css";
import { publish, subscribe } from "@/utils/EventBus";
import {
  ADD_NOTIFICATION,
  ON_PENDING_TRANSECTION,
  ON_TRANSECTION_COMPLETE,
  TOGGLE_OVERLAY_VISIBILITY,
} from "@/constants/events";
import { OVERLAY_TYPE_WITH_PENDING_LIST } from "@/constants/types";
import { getExplorerTransectionLink, logTransection, waitForTransection } from "@/utils/Accounts";
import { getTransections, insertTransection, updateTransection } from "@/utils/localStorage";
import { PENDING_STATUS } from "@/constants/lables";

export const Pending = () => {
  const [pendingList, setPendingList] = useState([]);

  useEffect(() => {
    const unsubsribe = subscribe(ON_PENDING_TRANSECTION, async (transection) => {
      const _pendingList = [...pendingList, transection];
      setPendingList(_pendingList);

      if(!transection.isSaved) {
        insertTransection({
          ...transection,
          isSaved: true,
          status: PENDING_STATUS,
        });
  
        logTransection({
          transection,
          event: ON_PENDING_TRANSECTION,
          status: PENDING_STATUS,
        });
      }

      const status = await waitForTransection(transection.id);
      publish(ON_TRANSECTION_COMPLETE, {
        id: transection.id,
        transection,
        status: status.status,
      });
    });

    const unsubsribe2 = subscribe(ON_TRANSECTION_COMPLETE, ({ id, status, transection }) => {
      updateTransection({
        ...transection,
        status,
      });
      const newPendingList = pendingList.filter((item) => item.id !== id);
      setPendingList(newPendingList);
      logTransection({
        transection,
        event: ON_TRANSECTION_COMPLETE,
        status,
      });
      publish(ADD_NOTIFICATION, {
        status,
        text: transection.text,
        link: getExplorerTransectionLink(id),
        linkText: "View on Polygon Scan",
      });
    });

    const savedTxns = getTransections();
    if(savedTxns && savedTxns.length > 0) {
      savedTxns.forEach( txn => {
        if(txn.status === PENDING_STATUS) {
          publish(ON_PENDING_TRANSECTION, txn);
        }
      })
    }

    return () => {
      unsubsribe();
      unsubsribe2();
    }
  }, []);

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
