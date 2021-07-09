import { getTopicContent, getTopics } from '@/pages/api/getHelpTopics';
import HelpPage from './[...slug]';

export default function Help(props) {
    return <HelpPage {...props} />
}

export async function getStaticProps() {
    let topics = await getTopics();
    const selectedTopic = await getTopicContent(topics[0].topicId);
    return {
        props: { topics : topics, selectedTopic }
    };
}