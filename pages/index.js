import { SetTitle } from "@/components/SetTitle";
import { SmartInput } from "@/components/SmartInput";
import { IconWithPopOver } from "@/components/IconWithPopOver";
import styles from "@/styles/common.module.css";
import homeStyles from "@/styles/Home.module.css";
import SEO from "@/seo/home";
import Image from "next/image";
import React from "react";
import {
  addClasses,
  compareTokens,
  debounce,
  openUrlInNewTab,
} from "@/utils/Helpers";
import { fromGwei, getAmountInGwei, compareBigAmounts } from "@/utils/calc";
import {
  approveToken,
  getAllTokenList,
  getApprovalForToken,
  getTokenQuote,
  setTokenApproved,
  swapTokens,
} from "@/utils/Accounts";
import {
  AUTO_PRICE_UPDATE_INTERVAL,
  MAX_SLIPPAGE_VALUE,
  POLYGON_TOKEN_ADDRESS,
} from "@/constants/globals";
import { publish, subscribe } from "@/utils/EventBus";
import {
  ADD_NOTIFICATION,
  HAVE_WALLET_APP,
  ON_PENDING_TRANSECTION,
  ON_TRANSECTION_COMPLETE,
  ON_WALLET_ACCOUNTS_CHANGED,
  ON_WALLET_CONNECT,
  TRIGGER_WALLET_CONNECT,
} from "@/constants/events";
import { Spinner } from "@/components/Spinner";
import { getFromStore, putInStore } from "@/utils/Store";
import {
  KEY_ALL_TOKEN_BALANCE,
  KEY_ALL_TOKEN_LIST,
  KEY_HAVE_WALLET_APP,
  KEY_IS_WINDOW_FOCUSED,
  KEY_WALLET_ADDRESS,
} from "@/constants/types";
import axios from "axios";
import { METAMASK_INSTALL_URL } from "@/constants/urls";
import { withRouter } from "next/router";

const slipageOptions = [0.5, 1, 2];
class Home extends React.Component {
  constructor(props) {
    super(props);
    const address = getFromStore(KEY_WALLET_ADDRESS);
    const appInstalled = getFromStore(KEY_HAVE_WALLET_APP);

    this.state = {
      slippagePercent: 0.5,
      isCustomSlippage: false,
      toToken: null,
      fromToken: null,
      fromAmount: "",
      toAmount: "",
      gasFee: "",
      toApprove: null,
      walletStatus: {
        address,
        appInstalled,
      },
      error: false,
      isLoading: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.router?.query) {
      const outerToToken = nextProps.router?.query?.toToken;
      if (outerToToken) {
        this.updateToken(outerToToken, "toToken");
      }

      const outerFromToken = nextProps.router?.query?.fromToken;
      if (outerFromToken) {
        this.updateToken(outerFromToken, "fromToken");
      }

      const outerAmount = nextProps.router?.query?.amount;
      if (outerAmount) {
        this.handleAmountChange(outerAmount, "fromAmount");
      }
    }
  }

  componentDidMount() {
    this.onWalletInstalled = subscribe(HAVE_WALLET_APP, (appInstalled) => {
      this.setState({
        isLoading: false,
        walletStatus: {
          ...this.state.walletStatus,
          appInstalled,
        },
      });
    });

    this.onWalletConnect = subscribe(ON_WALLET_CONNECT, (walletDetails) => {
      this.setState({
        isLoading: false,
        walletStatus: {
          ...this.state.walletStatus,
          ...walletDetails,
        },
      });
    });

    this.onWalletAccountChanged = subscribe(
      ON_WALLET_ACCOUNTS_CHANGED,
      (data) => {
        this.setState({
          walletStatus: {
            ...this.state.walletStatus,
            address: data.address,
          },
        });
      }
    );

    this.checkApprovalDebounced = debounce(this.checkApproval, 500);
  }

  componentWillUnmount() {
    this.onWalletInstalled && this.onWalletInstalled();
    this.onWalletConnect && this.onWalletConnect();
  }

  trackQuotePrices = () => {
    clearTimeout(this.priceTrackingTimer);
    this.priceTrackingTimer = setTimeout(() => {
      const { fromToken, toToken, fromAmount } = this.state;
      if (fromToken && toToken && fromAmount) {
        this.getQuoteForTokenPair(() => {
          // const winodwHasFocus = getFromStore(KEY_IS_WINDOW_FOCUSED);
          publish(ADD_NOTIFICATION, {
            status: "warn",
            onlyOnce: true,
            text: "Price Update Alert! Your quote prices are updated.",
          });
        });
      }
    }, AUTO_PRICE_UPDATE_INTERVAL);
  };

  safeCancelRequest = (cancelToken) => {
    if (cancelToken) {
      cancelToken.cancel && cancelToken.cancel();
      cancelToken = null;
    }
  };

  getQuoteForTokenPair = (callback) => {
    const { fromAmount } = this.state;
    if (!fromAmount) {
      return;
    }

    this.setState({ isLoading: true, error: false }, async () => {
      const { fromToken, toToken } = this.state;
      try {
        const _amount = getAmountInGwei(fromToken, fromAmount);
        if (Number(_amount) > 0) {
          if (this.quotePriceCancelToken) {
            //cancel existing request
            this.quotePriceCancelToken.cancel();
            this.quotePriceCancelToken = null;
          }

          if (!this.quotePriceCancelToken) {
            this.quotePriceCancelToken = axios.CancelToken.source();
          }

          const { toTokenAmount, estimatedGas } = await getTokenQuote(
            fromToken.address,
            toToken.address,
            _amount,
            this.quotePriceCancelToken.token
          );

          if (toTokenAmount) {
            const _toAmount = fromGwei(toTokenAmount, toToken.decimals);
            this.setState({
              toAmount: _toAmount,
              gasFee: estimatedGas,
              isLoading: false,
            });
            this.trackQuotePrices();
            callback && callback();
          } else {
            this.setState({ toAmount: "", isLoading: false });
          }
        } else {
          this.setState({ toAmount: "", isLoading: false });
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  handleAmountChange = (amount, key) => {
    this.setState({ [key]: amount }, async () => {
      const { fromAmount, fromToken, toToken } = this.state;
      if (key === "fromAmount" && fromAmount) {
        this.checkApprovalDebounced();
      }

      if (fromToken && toToken && fromAmount) {
        this.getQuoteForTokenPair();
      } else if (!fromAmount) {
        if (this.quotePriceCancelToken) {
          //cancel existing request
          this.quotePriceCancelToken.cancel();
          this.quotePriceCancelToken = null;
        }
        this.setState({ toAmount: "" });
      }
    });
  };

  checkApproval = async () => {
    const { fromToken, fromAmount } = this.state;
    if (
      fromToken &&
      fromToken.address &&
      fromToken.address.toLowerCase() !== POLYGON_TOKEN_ADDRESS
    ) {
      const tokenData = getFromStore(KEY_ALL_TOKEN_LIST)[fromToken.address];
      if (tokenData && tokenData.isApproved) {
        return;
      }
      this.setState({ isLoading: true });
      const response = await getApprovalForToken(fromToken, fromAmount);
      if (response && response.success) {
        if (!response.data.isApprovedToken) {
          this.setState({ toApprove: fromToken.address });
        } else {
          if (response.data.limit === "unlimited") {
            const obj = {
              ...getFromStore(KEY_ALL_TOKEN_LIST)[fromToken.address],
              isApproved: true,
            };
            putInStore(KEY_ALL_TOKEN_LIST, {
              ...getFromStore(KEY_ALL_TOKEN_LIST),
              [fromToken.address]: obj,
            });
          }
        }
      } else {
        // publish(ADD_NOTIFICATION, {
        //   status: "warn",
        //   onlyOnce: true,
        //   text: "Something went wrong. Refresh the page.",
        // });
        this.setState({ error: true });
      }
      this.setState({ isLoading: this.state.isLoading ? true : false });
    }
  };

  updateToken = (token, key) => {
    const { fromToken, toToken } = this.state;
    if (key === "toToken") {
      if (compareTokens(token, fromToken)) {
        this.setState({ fromToken: null, toApprove: "" });
      }
      this.setState({ toToken: token });
    } else {
      if (compareTokens(token, toToken)) {
        this.setState({ toToken: null });
      }
      this.setState({ fromToken: token });
    }
    this.setState({ toApprove: null });
  };

  isFormValid = () => {
    const { isLoading, error, walletStatus, toApprove } = this.state;

    if (isLoading) {
      return false;
    }

    if (error) {
      return false;
    }

    if (toApprove) {
      return true;
    }

    if (!walletStatus.appInstalled) {
      return true;
    }

    if (walletStatus.appInstalled && !walletStatus.address) {
      return true;
    }

    if (this.isTransectionValid()) {
      return true;
    }
    return false;
  };

  onSlippageChange = (value, isCustomSlippage = false) => {
    const onlyNumberRegex = /^\d*\.?\d*$/;

    if (onlyNumberRegex.test(value) && Number(value) <= MAX_SLIPPAGE_VALUE) {
      if (value === "") {
        this.setState({
          isCustomSlippage: false,
          slippagePercent: slipageOptions[0],
        });
      } else {
        this.setState({ isCustomSlippage, slippagePercent: value });
      }
    }
  };

  getButtonText = () => {
    const {
      walletStatus,
      error,
      toAmount,
      fromAmount,
      toApprove,
      fromToken,
      toToken,
    } = this.state;

    if (!walletStatus.appInstalled) {
      return "Install MetaMask to start";
    }

    if (walletStatus.appInstalled && !walletStatus.address) {
      return "Connect Wallet";
    }

    if (error) {
      return "Unable to proceed";
    }

    if (toApprove && fromToken) {
      return `Approve ${fromToken.symbol}`;
    }

    if (fromToken && toToken) {
      if (fromAmount && toAmount) {
        if (this.isTransectionValid()) {
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

  isTransectionValid = () => {
    const { fromAmount, toAmount, fromToken, toToken } = this.state;
    if (fromToken && toToken && fromAmount) {
      if (toAmount === "" || Number(toAmount) === NaN) {
        return false;
      }

      const _balances = getFromStore(KEY_ALL_TOKEN_BALANCE);

      const _balance = _balances[fromToken.address]
        ? fromGwei(
            _balances[fromToken.address].value,
            _balances[fromToken.address].decimals,
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

  handleBtnClick = async () => {
    const { isLoading, walletStatus, toApprove } = this.state;
    if (isLoading) return;

    if (walletStatus.appInstalled && !walletStatus.address) {
      return publish(TRIGGER_WALLET_CONNECT);
    }

    if (!walletStatus.appInstalled) {
      return openUrlInNewTab(METAMASK_INSTALL_URL);
    }

    if (toApprove) {
      this.setState({ isLoading: true });
      try {
        const transectionId = await approveToken(toApprove);
        const { fromToken } = this.state;
        const walletAddress = getFromStore(KEY_WALLET_ADDRESS);
        const transectionData = {
          id: transectionId,
          fromToken: fromToken,
          time: new Date().getTime(),
          address: walletAddress,
          text: `Approve ${fromToken.symbol}`,
        };
        return publish(ON_PENDING_TRANSECTION, transectionData);
      } catch (e) {
        publish(ADD_NOTIFICATION, {
          text: "Token approval cancelled.",
          status: false,
        });
        console.error(e);
      }
      this.setState({ isLoading: false });
      return;
    }

    if (this.isTransectionValid()) {
      this.setState({ isLoading: true });
      try {
        const { fromToken, toToken, fromAmount, toAmount, slippagePercent } =
          this.state;
        const _amount = getAmountInGwei(fromToken, fromAmount);
        const _toAmount = getAmountInGwei(toToken, toAmount);

        if (this.swapTokenCancelToken) {
          // cancel existing request
          this.swapTokenCancelToken.cancel();
          this.swapTokenCancelToken = null;
        }

        if (!this.swapTokenCancelToken) {
          this.swapTokenCancelToken = axios.CancelToken.source();
        }

        const transectionId = await swapTokens(
          fromToken.address,
          toToken.address,
          _amount,
          slippagePercent,
          this.swapTokenCancelToken.token
        );

        if (transectionId) {
          const walletAddress = getFromStore(KEY_WALLET_ADDRESS);
          const _fromAmountReadAble = fromGwei(_amount, fromToken.decimals, 8);
          const _toAmountReadAble = fromGwei(_toAmount, toToken.decimals, 8);
          const transectionData = {
            id: transectionId,
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: _amount,
            toAmount: _toAmount,
            slippage: slippagePercent,
            time: new Date().getTime(),
            address: walletAddress,
            text: `Swap ${_fromAmountReadAble} ${fromToken.symbol} for ${_toAmountReadAble} ${toToken.symbol}`,
          };
          publish(ON_PENDING_TRANSECTION, transectionData);
          this.showTransectionSubmittedPopUp();
          return this.resetUI();
        }
      } catch (e) {
        console.error(e);
        publish(ADD_NOTIFICATION, {
          text: "Transection Cancelled",
          status: false,
        });
      }
      this.setState({ isLoading: false });
      return;
    }
  };

  resetUI = () => {
    this.setState({
      isLoading: false,
      fromAmount: "",
      toAmount: "",
      gasFee: "",
      fromToken: null,
      toToken: null,
      toApprove: null,
    });
  };

  showTransectionSubmittedPopUp = () => {};

  handleArrowClick = () => {
    this.setState({
      fromToken: this.state.toToken,
      toToken: this.state.fromToken,
      fromAmount: "",
      toAmount: "",
      toApprove: null,
      isLoading: false,
      error: false,
    });
  };

  render() {
    const {
      slippagePercent,
      isCustomSlippage,
      toToken,
      fromToken,
      fromAmount,
      toAmount,
      gasFee,
      isLoading,
    } = this.state;
    return (
      <div className={styles.centerContainer}>
        <SetTitle title={SEO.title} description={SEO.description} />
        <div className={homeStyles.swapToken}>
          <SmartInput
            label={"From"}
            selectedToken={fromToken}
            amount={fromAmount}
            onTokenChanged={(token) => this.updateToken(token, "fromToken")}
            onAmountChanged={(amount) =>
              this.handleAmountChange(amount, "fromAmount")
            }
          />

          <div
            className={homeStyles.convertIcon}
            onClick={this.handleArrowClick}
          >
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
            amount={toAmount}
            onTokenChanged={(token) => this.updateToken(token, "toToken")}
            onAmountChanged={(amount) =>
              this.handleAmountChange(amount, "toAmount")
            }
          />

          {gasFee && (
            <div className={homeStyles.gasFee}>
              <span>{"Estimated Gas Fee :"}</span>
              <span>{`${gasFee} gwei`}</span>
              <span>{`(${fromGwei(gasFee, 9, 6)} MATIC)`}</span>
            </div>
          )}

          <div className={homeStyles.advanceOptions}>
            <h3>{"Advance Options"}</h3>
            <div className={homeStyles.slippage}>
              <div>
                <span>{"Slippage tolerance"}</span>
                <IconWithPopOver />
              </div>
              {slipageOptions.map((slip) => {
                return (
                  <button
                    key={slip}
                    onClick={() => this.onSlippageChange(slip)}
                    className={
                      !isCustomSlippage && slippagePercent === slip
                        ? homeStyles.activeSlippage
                        : ""
                    }
                  >
                    {`${slip}%`}
                  </button>
                );
              })}
              <input
                value={isCustomSlippage ? slippagePercent : ""}
                className={addClasses([
                  homeStyles.slippagePercent,
                  isCustomSlippage && homeStyles.activeSlippage,
                ])}
                placeholder={"1.2"}
                onChange={(e) => this.onSlippageChange(e.target.value, true)}
              />
              <span>%</span>
            </div>
          </div>
          <button
            className={addClasses([
              homeStyles.submitBtn,
              this.isFormValid() ? "" : homeStyles.submitBtnDisabled,
            ])}
            onClick={this.handleBtnClick}
          >
            {isLoading ? <Spinner size={"MINI"} /> : this.getButtonText()}
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(Home);
