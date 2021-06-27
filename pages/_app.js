import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import '../styles/globals.css';
import styles from '../styles/Home.module.css';

function MyApp({ Component, pageProps }) {
  return(
    <div id='root'>
      <Header />
      
      <main className={styles.main}>
        <Component {...pageProps} />
      </main>

      <Footer />
    </div>
  );
}

export default MyApp
