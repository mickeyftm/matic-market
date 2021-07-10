import { POLYGON_CHAIN_ID } from '@/constants/globals';
const Moralis = require('moralis/node');

export default async function handler(req, res) {
    Moralis.initialize(process.env.NEXT_PUBLIC_MORALIS_APP_ID);
    Moralis.serverURL = process.env.NEXT_PUBLIC_MORALIS_APP_URL;
    
    if (req.method === 'POST') {
        try {
            const address = req.body.address;
            const options = { chain: POLYGON_CHAIN_ID, address };
            const balances = await Moralis.Web3.getAllERC20(options);
            return res.status(200).json({ success: true, data : balances });
        } catch {
            return res.status(200).json({ success: false });
        }
    }
    res.status(500).send();
}