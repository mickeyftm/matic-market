import { PUBLIC_HTTP_PROVIDER } from "@/constants/urls";
import ERC20_ABI from "../../public/files/erc20-abi.json";

const Moralis = require("moralis/node");

export default async function handler(req, res) {
  Moralis.initialize(process.env.NEXT_PUBLIC_MORALIS_APP_ID);
  Moralis.serverURL = process.env.NEXT_PUBLIC_MORALIS_APP_URL;

  if (req.method === "POST") {
    try {
      const contractAddress = req.body.contractAddress;
      const walletAddress = req.body.walletAddress;

      const web3 = new Moralis.Web3();
      const provider = new web3.providers.HttpProvider(PUBLIC_HTTP_PROVIDER);
      web3.setProvider(provider);
      const contract = new web3.eth.Contract(ERC20_ABI, contractAddress);

      try {
        const tokenDetails = {
          isExternal : true
        };
        tokenDetails.name = await contract.methods.name().call();
        tokenDetails.symbol = await contract.methods.symbol().call();
        tokenDetails.decimals = await contract.methods.decimals().call();
        tokenDetails.address = contractAddress;

        if (walletAddress) {
          tokenDetails.balance = await contract.methods
            .balanceOf(walletAddress)
            .call();
        }
        return res.status(200).json({ success: true, data: tokenDetails });
      } catch {}
      return res.status(200).json({ success: false });
    } catch {
      return res.status(200).json({ success: false });
    }
  }
  res.status(500).send();
}
