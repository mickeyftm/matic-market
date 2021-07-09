import { getHelpTopic, getHelpTopics, initDB } from "@/utils/db"

export const getTopics = async () => {
    await initDB();
    const items = await getHelpTopics();
    return items;
}

export const getTopicContent = async (topicId) => {
    await initDB();
    const content = await getHelpTopic(topicId);
    return content;
}

export default function handler(req, res) {
    return res.status(200).json({ success : true });
}