export default function Help() {
    return (
        <div className={styles.help}>
            <div className={styles.topics}>
                {}
            </div>
            <div className={styles.preview}>

            </div>
        </div>
    )
}

// Help.getInitialProps = async () => {
//     const res = await fetch('')
//     const json = await res.json()
//     return { stars: json.stargazers_count }
// }