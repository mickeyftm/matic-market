import {
  TRANSAK_API_KEY_PRODUCTION,
  TRANSAK_API_KEY_STAGING,
} from "@/constants/globals";
import { KEY_WALLET_ADDRESS } from "@/constants/types";
import { TRANSAK_BASE_URL, TRANSAK_STAGING_BASE_URL } from "@/constants/urls";
import { getActiveAccountAddress } from "@/utils/Accounts";
import { getFromStore } from "@/utils/Store";
import { useEffect, useState } from "react";
import styles from "./style.module.css";
import {Spinner} from '@/components/Spinner';

export default function Buy() {
  const URL =
    process.env.NEXT_PUBLIC_IS_DEV === "true"
      ? TRANSAK_STAGING_BASE_URL
      : TRANSAK_BASE_URL;
  const API_KEY =
    process.env.NEXT_PUBLIC_IS_DEV === "true"
      ? TRANSAK_API_KEY_STAGING
      : TRANSAK_API_KEY_PRODUCTION;
  const [frameSrc, setFrameSrc] = useState(`${URL}${API_KEY}`);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const address =
        getFromStore(KEY_WALLET_ADDRESS) || (await getActiveAccountAddress());
      if (address) {
        setFrameSrc(`${URL}${API_KEY}&walletAddress=${address}`);
      }
    })();
  }, [URL, API_KEY]);

  return (
    <div className={styles.buyContainer}>
      <iframe
        onLoad={ () => setLoading(false)}
        height="600"
        src={frameSrc}
        frameBorder="no"
        allowtransparency="true"
        allowFullScreen=""
        style={{
          display: "block",
          width: "100%",
        }}
      ></iframe>
        {
            isLoading &&
            <div className={styles.loader}>
                <Spinner size={'SMALL'} />
            </div>
        }
    </div>
  );
}
