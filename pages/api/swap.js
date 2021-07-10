import { FEE_CHARGING_ACCOUNT, PER_TRANSECTION_FEE } from "@/constants/globals";
import axios from "axios";

//https://api.1inch.exchange/v3.0/137/swap?fromTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&toTokenAddress=0x8a953cfe442c5e8855cc6c61b1293fa648bae472&amount=10000000000000000&fromAddress=0xD335a6691937e69fD975d9489FCC82aA27AEC151&slippage=1&referrerAddress=0xD335a6691937e69fD975d9489FCC82aA27AEC151&fee=0.1

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            //@todo log this event.
            const fromTokenAddress = req.body.fromTokenAddress;
            const toTokenAddress = req.body.toTokenAddress;
            const fromAddress = req.body.fromAddress;
            const amount = req.body.amount;
            const slippage = req.body.slippage;

            const { data } = await axios.get(`https://api.1inch.exchange/v3.0/137/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&referrerAddress=${FEE_CHARGING_ACCOUNT}&fee=${PER_TRANSECTION_FEE}`);
            return res.status(200).json({ success: true, data });
        } catch(e) {
            console.error(e);
            return res.status(200).json({ success: false });
        }
    }
    res.status(500).send();    
}