import { SPENDER_ADDRESS, UNLIMITED_LIMIT } from "@/constants/globals";
import { initDB } from "@/utils/db";
import { compareBigAmounts, isBigAmountNonZero } from "@/utils/calc";
import axios from "axios";
import BigNumber from "bignumber.js";

const hexZeroPad = (address) => {
  address = address.replace("0x", "");
  return `000000000000000000000000${address}`;
};

const method = "0x095ea7b3";
export default async function handler(req, res) {
  if (req.method === "POST") {
    await initDB();
    const tokenAddress = req.body.tokenAddress;
    const walletAddress = req.body.walletAddress;
    const amount = req.body.amount;

    const POLYGON_SCAN_API_KEY =
      Math.random() > 0.5
        ? process.env.POLYGON_SCAN_API_KEY1
        : process.env.POLYGON_SCAN_API_KEY2;

    const input = `${method}${hexZeroPad(SPENDER_ADDRESS)}`;

    const { data } = await axios.get(
      `https://api.polygonscan.com/api?module=account&action=txlist&address=${walletAddress}&startblock=1&endblock=99999999&sort=desc&apikey=${POLYGON_SCAN_API_KEY}`
    );

    const txns = data.result;
    const tokenTxns = txns.filter((txn) => txn.to === tokenAddress);
    const approvals = tokenTxns.filter((txn) => txn.input.startsWith(input));
    if (approvals.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          isApprovedToken: false,
          mssg: "no approval",
        },
      });
    } else {
      const limitString = approvals[0].input.replace(input, "");
      const ourLimit = new BigNumber(limitString, 16);
      const unLimitedLimit = new BigNumber(UNLIMITED_LIMIT, 16);

      if (!isBigAmountNonZero(ourLimit)) {
        return res.status(200).json({
          success: true,
          data: {
            isApprovedToken: false,
            limit: "0",
          },
        });
      }

      const limit = compareBigAmounts(ourLimit, unLimitedLimit);
      if (limit === "e") {
        return res.status(200).json({
          success: true,
          data: {
            isApprovedToken: true,
            limit: "unlimited",
          },
        });
      }

      let totalSpend = new BigNumber(0);
      const spendTxns = txns.filter(
        (txn) =>
          parseInt(txn.timeStamp) > parseInt(approvals[0].timeStamp) &&
          txn.to === SPENDER_ADDRESS
      );

      spendTxns.forEach((txn) => {
        let _balance = new BigNumber(txn.value);
        totalSpend = totalSpend.plus(_balance);
      });

      const newSpend = totalSpend.plus(new BigNumber(amount));
      const compare = compareBigAmounts(newSpend, ourLimit);

      if (compare === "l" || compare === "e") {
        return res.status(200).json({
          success: true,
          data: {
            isApprovedToken: true,
            limit: ourLimit.minus(newSpend),
          },
        });
      } else {
        return res.status(200).json({
          success: true,
          data: {
            isApprovedToken: false,
          },
        });
      }
    }
  }
  res.status(500).send();
}
