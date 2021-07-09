import { useState } from 'react';
import { getTopicContent, getTopics } from '@/pages/api/getHelpTopics';
import styles from './style.module.css';
import { Icon } from '@/components/Icon';
import Link from 'next/link';
import { addClasses } from '@/utils/Helpers';
import {SetTitle} from '@/components/SetTitle';

export default function Help({ topics, selectedTopic }) {
    const [activeTopics, setActiveTopics] = useState(topics || []);
    const [activeTopic, setActiveTopic] = useState(selectedTopic || {});

    const [ query, setQuery] = useState('');
    const onSearch = (event) => {
        const query = event?.target?.value || '';
        setQuery(query);

        const searchQuery = query.toLowerCase().trim();
        const filteredTopics = topics.filter( topicItem => topicItem.topic.toLowerCase().includes(searchQuery) );
        setActiveTopics( filteredTopics );
    }

    return (
        <div className={styles.help}>
            <SetTitle
                title={activeTopic.topic}
                description={'Find out how'}
            />
            <div className={styles.topics}>
                <div className={styles.searchInput}>
                    <input
                        placeholder={'Search here'}
                        value={query}
                        onChange={onSearch}
                    />
                    <Icon name={'SEARCH'} className = {styles.searchIcon} />
                </div>
                <ul className={styles.topicsList}>
                    {
                        activeTopics && activeTopics.map( (topic, index) => {
                            return (
                                <li key={index} className={addClasses([styles.topic, topic.topicId === selectedTopic.topicId && styles.activeTopic ])}>
                                    <Link passHref href={`/help/${topic.topicId}`}>
                                        <a>{topic.topic}</a>
                                    </Link>
                                </li>
                            );
                        })
                    }
                </ul>
            </div>
            {
                activeTopic && 
                <div className={styles.preview}>
                    <h1>
                        {activeTopic.topic}
                    </h1>
                    <div dangerouslySetInnerHTML={{ __html : activeTopic.content }} />
                </div>
            }
        </div>
    )
}

export async function getStaticPaths() {
    let topics = await getTopics();

    const paths = topics.map((topic) => {
        return {
            params: { slug: [topic.topicId] }
        }
    } );

    // fallback: false means pages that don’t have the correct id will 404.
    return {
        paths,
        fallback: true
    };
}

export async function getStaticProps({ params }) {
    if( params.slug ) {
        const topicId = params.slug[0];
        let topics = await getTopics();
        const selectedTopic = await getTopicContent(topicId);
        
        return {
            props: { topics : topics, selectedTopic }
        };
    }
    
    return { props: {}};
}