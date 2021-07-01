import axios from "axios";

//https://api.1inch.exchange/v3.0/137/quote?fromTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&toTokenAddress=0x111111111117dc0aa78b770fa6a738034120c302&amount=10000000000000000

const OUR_FEE = 0.05;
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            //@todo log this event.
            const fromTokenAddress = req.body.fromTokenAddress;
            const toTokenAddress = req.body.toTokenAddress;
            const amount = req.body.amount;

            const { data } = await axios.get(`https://api.1inch.exchange/v3.0/137/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fee=${OUR_FEE}`);
            return res.status(200).json({ success: true, data });
        } catch {
            return res.status(200).json({ success: false });
        }
    }
    res.status(500).send();    
}