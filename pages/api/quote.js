import { CHARGED_TRANSECTION_LIMIT, LOWEST_PER_TRANSECTION_FEE, PER_TRANSECTION_FEE } from "@/constants/globals";
import { getTransectionCount, initDB } from "@/utils/db";
import axios from "axios";

//https://api.1inch.exchange/v3.0/137/quote?fromTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&toTokenAddress=0x111111111117dc0aa78b770fa6a738034120c302&amount=10000000000000000

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await initDB();
            const fromTokenAddress = req.body.fromTokenAddress;
            const toTokenAddress = req.body.toTokenAddress;
            const address = req.body.address;
            const amount = req.body.amount;

            const transections = address ? await getTransectionCount(address) : 0;
            const TRANSECTION_FEE = transections > CHARGED_TRANSECTION_LIMIT ? PER_TRANSECTION_FEE : LOWEST_PER_TRANSECTION_FEE;

            const { data } = await axios.get(`https://api.1inch.exchange/v3.0/137/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fee=${TRANSECTION_FEE}`);
            return res.status(200).json({ success: true, data, extra: { fee : TRANSECTION_FEE } });
        } catch {
            return res.status(200).json({ success: false });
        }
    }
    res.status(500).send();    
}