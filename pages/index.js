import { SetTitle } from '@/components/SetTitle';
import styles from '@/styles/common.module.css';
import SEO from '@/seo/home';

export default function Home() {
  return (
    <div className={styles.centerContainer}>
      <SetTitle
        title = {SEO.title}
        description = {SEO.description}
      />
      <span>
        {'Home Page'}
      </span>
    </div>
  )
}
