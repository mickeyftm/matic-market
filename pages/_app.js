import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Overlay } from '@/components/Overlay';
import '../styles/globals.css';
import styles from '../styles/Home.module.css';
import { Notifications } from "@/components/Notifications";

function MyApp({ Component, pageProps }) {
  return(
    <div id='root'>
      <Header />
      
      <main className={styles.main}>
        <Component {...pageProps} />
      </main>

      <Footer />

      <Overlay />
      <div className={styles.notifications}>
        <Notifications />
      </div>
    </div>
  );
}

export default MyApp
