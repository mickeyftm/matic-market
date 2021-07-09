import Head from 'next/head';

export const SetTitle = ({ title, description }) => {
    return(
        <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            
            {/* @todo add a url here */}
            {/* <meta property="og:url" content="" /> */}
            <meta property="og:type" content="website" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
    );
};