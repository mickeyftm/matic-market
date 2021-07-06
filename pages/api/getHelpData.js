import { initDB, getHelpTopics } from '@/utils/db';

export default async function handler(req, res) {
    await initDB();
    const topics = await getHelpTopics();
    return res.status(200).json({ success: true, data: topics });
};