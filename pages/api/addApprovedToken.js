import { addWalletTokenAddressPair, initDB } from '@/utils/db';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        await initDB();
        const tokenAddress = req.body.tokenAddress;
        const walletAddress = req.body.walletAddress;
        const transectionId = req.body.transectionId;

        await addWalletTokenAddressPair(tokenAddress, walletAddress, transectionId);
        return res.status(200).json({ success: true });
    }
    res.status(500).send();  
};