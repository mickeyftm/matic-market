import { Collections, initDB, insertIntoCollection } from '@/utils/db';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        await initDB();
        const transection = req.body.transection;
        insertIntoCollection(transection, Collections.COLLECTION_LOGS);
        return res.status(200).json({ success: true });
    }
    res.status(500).send();
};