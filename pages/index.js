import { SetTitle } from "@/components/SetTitle";
import { SmartInput } from "@/components/SmartInput";
import { IconWithPopOver } from "@/components/IconWithPopOver";
import styles from "@/styles/common.module.css";
import homeStyles from "@/styles/Home.module.css";
import SEO from "@/seo/home";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  addClasses,
  compareBigAmounts,
  compareTokens,
  fromGwei,
  getAmountInGwei,
} from "@/utils/Helpers";
import {
  approveToken,
  getActiveAccountAddress,
  getAllERC20Tokens,
  getApprovalForToken,
  getTokenQuote,
  requestWalletPermission,
  setTokenApproved,
  swapTokens,
  isWalletLinked as checkWalletLinked,
  waitForTransection,
} from "@/utils/Accounts";
import { MAX_SLIPPAGE_VALUE, POLYGON_TOKEN_ADDRESS } from "@/constants/globals";
import { publish, subscribe } from "@/utils/EventBus";
import {
  ON_PENDING_TRANSECTION,
  ON_TRANSECTION_COMPLETE,
  WALLET_LINKED,
} from "@/constants/events";
import { Spinner } from "@/components/Spinner";

export default function Home() {
  const [slippagePercent, setSlippagePercent] = useState(1);
  const [isCustomSlippage, setIsCustomSlippage] = useState(false);

  const [toToken, setToToken] = useState(null);
  const [fromToken, setFromToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [gasFee, setGasFee] = useState("");

  const [balances, setBalances] = useState({});
  const [isWalletLinked, setWalletLinked] = useState(false);
  const [toApprove, setToApprove] = useState(null);

  const [error, setError] = useState(false);
  const [isLoading, setLoading] = useState(true);

  const fetchAllTokenBalances = async () => {
    const address = await getActiveAccountAddress();
    if (address) {
      const allTokens = await getAllERC20Tokens(address);
      const balances = {};

      // pre process the balances object
      allTokens.forEach((token) => {
        balances[token.tokenAddress || POLYGON_TOKEN_ADDRESS] = {
          decimals: token.decimals,
          value: token.balance,
          balance: fromGwei(token.balance, token.decimals),
        };
      });

      setBalances(balances);
    } else {
      setBalances({});
    }
  };

  const getQuoteForTokenPair = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const _amount = getAmountInGwei(fromToken, fromAmount);
      if (Number(_amount) > 0) {
        const { toTokenAmount, estimatedGas } = await getTokenQuote(
          fromToken.address,
          toToken.address,
          _amount
        );

        if(toTokenAmount) {
          const _toAmount = fromGwei(toTokenAmount, toToken.decimals);
          if (_toAmount !== toAmount) {
            setGasFee(estimatedGas);
            setToAmount(fromGwei(toTokenAmount, toToken.decimals));
          }
        } else {
          setToAmount('');
          setError(true);
        }
      } else {
        if ("" !== toAmount) {
          setToAmount("");
        }
      }
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken, fromAmount]);

  const checkApprovalBeforeConvert = useCallback(async () => {
    if (
      fromToken &&
      fromToken.address &&
      fromToken.address.toLowerCase() !== POLYGON_TOKEN_ADDRESS
    ) {
      const response = await getApprovalForToken(fromToken);
      if (response.success) {
        if (!response.data.isApprovedToken) {
          setToApprove(fromToken.address);
        }
      }
    }
  }, [fromToken]);

  //fetch balance on token updates
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAllTokenBalances();
      setLoading(false);
    })();
  }, [fromToken, toToken]);

  // quote prices on token change along with amount change
  useEffect(() => {
    (async () => {
      setLoading(true);
      if (fromToken && toToken && fromAmount) {
        await getQuoteForTokenPair();
      }

      if (!fromAmount && toAmount) {
        setToAmount("");
      }
      setLoading(false);
    })();
  }, [fromToken, toToken, fromAmount, toAmount, getQuoteForTokenPair]);

  // on every from-token change check for approvals
  useEffect(() => {
    (async () => {
      await checkApprovalBeforeConvert();
    })();
  }, [fromToken, checkApprovalBeforeConvert]);

  useEffect(() => {
    (async () => {
      const _walet = await checkWalletLinked();
      setWalletLinked(!!_walet);
    })();

    subscribe(WALLET_LINKED, (info) => {
      if (info.linked) {
        resetUI();
        setWalletLinked(true);
      } else {
        setWalletLinked(false);
      }
      setToApprove(null);
    });
  }, []);

  const resetUI = () => {
    setFromToken(null);
    setToToken(null);
    setFromAmount("");
    setToAmount("");
    setToApprove(null);
    setLoading(false);
  };

  const onSlippageChange = (value, isCustomSlippage = false) => {
    const onlyNumberRegex = /^\d*\.?\d*$/;

    if (onlyNumberRegex.test(value) && Number(value) <= MAX_SLIPPAGE_VALUE) {
      if (value === "") {
        setIsCustomSlippage(false);
        setSlippagePercent(1);
      } else {
        setIsCustomSlippage(isCustomSlippage);
        setSlippagePercent(value);
      }
    }
  };

  const updateToken = (token, key) => {
    if (key === "to") {
      if (compareTokens(token, fromToken)) {
        setFromToken(null);
        setToApprove(null);
      }
      setToToken(token);
    } else {
      if (compareTokens(token, toToken)) {
        setToToken(null);
      }
      setFromToken(token);
    }
  };

  const getButtonText = () => {
    if (!isWalletLinked) {
      return "Connect Wallet";
    }

    if(error) {
      return 'Unable to proceed';
    }

    if (toApprove && fromToken) {
      return `Approve ${fromToken.symbol}`;
    }

    if (fromToken && toToken) {
      if (fromAmount && toAmount) {
        if (isTransectionValid()) {
          return "Swap";
        } else {
          return `Insufficient ${fromToken.symbol} balance`;
        }
      } else {
        return "Enter an amount";
      }
    } else {
      return "Select a token";
    }
  };

  const isFormValid = () => {
    if (isLoading) {
      return false;
    }

    if(error) {
      return false;
    }

    if (!isWalletLinked) {
      return true;
    }

    if (toApprove) {
      return true;
    }

    if (isTransectionValid()) {
      return true;
    }
    return false;
  };

  const isTransectionValid = () => {
    if (fromToken && toToken && fromAmount) {
      if (toAmount === "" || Number(toAmount) === NaN) {
        return false;
      }

      const _balance = balances[fromToken.address]
        ? fromGwei(
            balances[fromToken.address].value,
            balances[fromToken.address].decimals,
            null
          )
        : "0";
      const compare = compareBigAmounts(fromAmount, _balance);

      if (compare === "l" || compare === "e") {
        return true;
      }
    }
    return false;
  };

  const handleBtnClick = async () => {
    if (isLoading) return;

    if (!isWalletLinked) {
      return requestWalletPermission();
    }

    if (toApprove) {
      setLoading(true);
      try {
        const transectionId = await approveToken(toApprove);
        await waitForTransection(transectionId);
        await setTokenApproved(toApprove, transectionId);
        setToApprove(null);
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
      return;
    }

    if (isTransectionValid()) {
      setLoading(true);
      try {
        const _amount = getAmountInGwei(fromToken, fromAmount);
        const _toAmount = getAmountInGwei(toToken, toAmount);
        const transectionId = await swapTokens(
          fromToken.address,
          toToken.address,
          _amount,
          slippagePercent
        );

        if(transectionId) {
          publish(ON_PENDING_TRANSECTION, {
            id: transectionId,
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: _amount,
            toAmount: _toAmount,
            slippage: slippagePercent,
            address: await getActiveAccountAddress(),
          });
  
          const status = await waitForTransection(transectionId);
          
          publish(ON_TRANSECTION_COMPLETE, {
            id: transectionId,
            status,
          });
          if (status.status) {
            return resetUI();
          } else {
            console.log("Transection Failed");
          }
        }
      } catch (e) {
        console.log(e);
      }

      // handle transection failure here.
      setLoading(false);
      return;
    }
  };

  const handleAmountChange = (amount, key) => {
    if (key === "to") {
      setToAmount(amount);
    } else {
      setFromAmount(amount);
    }
  };

  const handleArrowClick = () => {
    const temp = JSON.parse(JSON.stringify(fromToken));
    setFromToken(toToken);
    setToToken(temp);

    setFromAmount("");
    setToAmount("");

    setToApprove(null);
  };

  const getGasFee = () => {
    if (isTransectionValid()) {
      return gasFee;
    }
    return false;
  };

  const estimatedGasFee = getGasFee();
  return (
    <div className={styles.centerContainer}>
      <SetTitle title={SEO.title} description={SEO.description} />
      <div className={homeStyles.swapToken}>
        <SmartInput
          label={"From"}
          selectedToken={fromToken}
          balances={balances}
          amount={fromAmount}
          fetchBalances={fetchAllTokenBalances}
          onTokenChanged={(token) => updateToken(token, "from")}
          onAmountChanged={(amount) => handleAmountChange(amount, "from")}
        />

        <div className={homeStyles.convertIcon} onClick={handleArrowClick}>
          <Image
            width={25}
            height={25}
            src={"/images/arrow-down.svg"}
            alt={"convert"}
          />
        </div>

        <SmartInput
          label={"To"}
          readOnly={true}
          selectedToken={toToken}
          balances={balances}
          amount={toAmount}
          fetchBalances={fetchAllTokenBalances}
          onTokenChanged={(token) => updateToken(token, "to")}
          onAmountChanged={(amount) => handleAmountChange(amount, "to")}
        />

        {estimatedGasFee && (
          <div className={homeStyles.gasFee}>
            <span>{"Estimated Gas Fee :"}</span>
            <span>{`${estimatedGasFee} gwei`}</span>
            <span>{`(${fromGwei(estimatedGasFee, 9, 6)} MATIC)`}</span>
          </div>
        )}

        <div className={homeStyles.advanceOptions}>
          <h3>{"Advance Options"}</h3>
          <div className={homeStyles.slippage}>
            <div>
              <span>{"Slippage tolerance"}</span>
              <IconWithPopOver />
            </div>
            <button
              onClick={() => onSlippageChange(1)}
              className={
                !isCustomSlippage && slippagePercent === 1
                  ? homeStyles.activeSlippage
                  : undefined
              }
            >
              1%
            </button>
            <button
              onClick={() => onSlippageChange(2)}
              className={
                !isCustomSlippage && slippagePercent === 2
                  ? homeStyles.activeSlippage
                  : undefined
              }
            >
              2%
            </button>
            <input
              value={isCustomSlippage ? slippagePercent : ""}
              className={addClasses([
                homeStyles.slippagePercent,
                isCustomSlippage && homeStyles.activeSlippage,
              ])}
              placeholder={"1.2"}
              onChange={(e) => onSlippageChange(e.target.value, true)}
            />
            <span>%</span>
          </div>
        </div>
        <button
          className={addClasses([
            homeStyles.submitBtn,
            !isFormValid() && homeStyles.submitBtnDisabled,
          ])}
          onClick={handleBtnClick}
        >
          {isLoading ? <Spinner size={"MINI"} /> : getButtonText()}
        </button>
      </div>
    </div>
  );
}
