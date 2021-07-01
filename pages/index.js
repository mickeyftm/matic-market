import { SetTitle } from "@/components/SetTitle";
import { SmartInput } from "@/components/SmartInput";
import { IconWithPopOver } from "@/components/IconWithPopOver";
import styles from "@/styles/common.module.css";
import homeStyles from "@/styles/Home.module.css";
import SEO from "@/seo/home";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { addClasses, compareTokens, fromGwei, getAmountInGwei } from "@/utils/Helpers";
import { approveToken, getActiveAccountAddress, getAllERC20Tokens, getApprovalForToken, getTokenQuote, getTransectionStatus, requestWalletPermission, setTokenApproved } from "@/utils/Accounts";
import { MAX_SLIPPAGE_VALUE, POLYGON_TOKEN_ADDRESS } from "@/constants/globals";
import { subscribe } from "@/utils/EventBus";
import { WALLET_LINKED } from "@/constants/events";
import { Spinner } from '@/components/Spinner';

export default function Home() {
  const [slippagePercent, setSlippagePercent] = useState(1);
  const [isCustomSlippage, setIsCustomSlippage] = useState(false);
  
  const [toToken, setToToken] = useState(null);
  const [fromToken, setFromToken] = useState(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const [balances, setBalances] = useState({});
  const [mode, setMode] = useState(3);
  const [isValid, setValid] = useState(false);
  const [isWalletLinked, setWalletLinked] = useState(false);
  const [toApprove, setToApprove] = useState([]);
  
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
  }

  const getQuoteForTokenPair = useCallback( async () => {
    try {
      const { toTokenAmount, estimatedGas } = await getTokenQuote(fromToken.address, toToken.address, getAmountInGwei(fromToken, fromAmount));
      const _toAmount = fromGwei(toTokenAmount, toToken.decimals);
      if( _toAmount !== toAmount) {
        setToAmount(fromGwei(toTokenAmount, toToken.decimals))
      }
    } catch(e) { console.log(e) }
  
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toToken, fromAmount]);

  const checkApprovalBeforeConvert = useCallback( async () => {
    if(fromToken && fromToken.address !== POLYGON_TOKEN_ADDRESS ) {
      const response = await getApprovalForToken(fromToken);
      if(response.success) {
        if( !response.data.isApprovedToken ) {
          setToApprove(fromToken.address);
        }
      }
    }
  }, [fromToken]);

  //fetch balance on token updates
  useEffect( () => {
    (async () => {
      setLoading(true);
      await fetchAllTokenBalances();
      setLoading(false);
    })()
  }, [fromToken, toToken]);

  // quote prices on token change along with amount change
  useEffect( () => {
    (async () => {
      setLoading(true);
      if(fromToken && toToken) {
        if(fromAmount) {
          await getQuoteForTokenPair();
        }
      }

      if(!fromAmount && toAmount) {
        setToAmount('');
      }
      setLoading(false);
    })()
  }, [fromToken, toToken, fromAmount, toAmount, getQuoteForTokenPair]);

  // on every from-token change check for approvals
  useEffect( () => {
    (async () => {
      await checkApprovalBeforeConvert();
    })()
  }, [fromToken, checkApprovalBeforeConvert]);

  useEffect(() => {
    subscribe(WALLET_LINKED, (info) => {
      if (info.linked) {
        setFromToken(null);
        setToToken(null);
        setMode(0);
        setWalletLinked(true);
      } else {
        setMode(3);
        setWalletLinked(false);
      }
      setValid(false);
      setToApprove(null);
    });
  }, []);

  const onSlippageChange = (value, isCustomSlippage = false) => {
    const onlyNumberRegex = /^\d*\.?\d*$/;

    if (onlyNumberRegex.test(value) && Number(value) <= MAX_SLIPPAGE_VALUE) {
      if(value === '') {
        setIsCustomSlippage(false);
        setSlippagePercent(1);
      } else {
        setIsCustomSlippage(isCustomSlippage);
        setSlippagePercent(value);
      }
    }
  };

  const updateToken = (token, key) => {
    setToApprove(null);
    setMode(0);
    setValid(false);
    if (key === "to") {
      if (compareTokens(token, fromToken)) {
        setFromToken(null);
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
    switch (mode) {
      case 0:
        return "Swap";
      case 1:
        return `Approve ${fromToken.symbol}`;
      case 2:
        return "Insufficient Balance";
      case 3:
        return "Connect Wallet";
    }
  };

  const handleBtnClick = async () => {
    if(mode === 0 && isValid ) {
      console.log( fromToken, toToken );
    } else if( mode === 1 && isValid && toApprove ) {
      setLoading(true);
      setValid(false);
      const transectionId = await approveToken(toApprove);
      if(transectionId) {
        let timer;
        timer = setInterval( async () => {
          const status = await getTransectionStatus(transectionId);
          if(status) {
            clearInterval(timer);
            await setTokenApproved(toApprove, transectionId);
            setLoading(false);
            setValid(true);
            setMode(0);
          }
        }, 5000);
      } else {
        setLoading(false);
        setValid(true);
      }
    } else if( mode === 3 ) {
      await requestWalletPermission();
    } else {
      return;
    }
  };

  const handleAmountChange = (amount, key) => {
    if(key==='to') {
      setToAmount(amount);
    } else {
      setFromAmount(amount);
    }
  }

  const handleArrowClick = (event) => {
    event.stopPropagation();
    event.preventDefault();

    const temp = JSON.parse(JSON.stringify(fromToken));
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setToAmount('');
  }

  return (
    <div className={styles.centerContainer}>
      <SetTitle title={SEO.title} description={SEO.description} />
      <div className={homeStyles.swapToken}>
        <SmartInput
          label={"From"}
          selectedToken={fromToken}
          balances={balances}
          amount={fromAmount}
          onTokenChanged={(token) => updateToken(token, "from")}
          onAmountChanged={(amount) => handleAmountChange(amount, 'from')}
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
          onTokenChanged={(token) => updateToken(token, "to")}
          onAmountChanged={(amount) => handleAmountChange(amount, 'to')}
        />

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
            !isValid && homeStyles.submitBtnDisabled,
          ])}
          onClick={handleBtnClick}
        >
          {getButtonText()}
          { isLoading && <Spinner size={'MINI'} />}
        </button>
      </div>
    </div>
  );
}
