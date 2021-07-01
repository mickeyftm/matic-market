import { doesWalletTokenAddressPairExists, initDB } from '@/utils/db';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        await initDB();
        const tokenAddress = req.body.tokenAddress;
        const walletAddress = req.body.walletAddress;
        const response = await doesWalletTokenAddressPairExists(tokenAddress, walletAddress);
        
        return res.status(200).json({ success: true, data: {
            isApprovedToken: response
        }});
    }
    res.status(500).send();
};