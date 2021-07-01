const axios = require('axios');

export default async function handler(req, res) {
    try {
        const { data } = await axios.get('https://api.1inch.exchange/v3.0/137/tokens');
        return res.status(200).json({ success: true, data });
    } catch(e) {
        console.log(e);
        return res.status(500).json({ success: false, mssg: 'Something went wrong.' });
    }
}; 