import axios from "axios";

// https://api.1inch.exchange/v3.0/137/approve/calldata?tokenAddress=0x19a935cbaaa4099072479d521962588d7857d717&amount=10000000000
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            //@todo log this event.
            const tokenAddress = req.body.tokenAddress;
            const { data } = await axios.get('https://api.1inch.exchange/v3.0/137/approve/calldata?tokenAddress=' + tokenAddress + '&infinity=true');
            return res.status(200).json({ success: true, data });
        } catch {
            return res.status(200).json({ success: false });
        }
    }
    res.status(500).send();    
}