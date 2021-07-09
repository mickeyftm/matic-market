import { BigNumber } from "bignumber.js";

export const isBigAmountNonZero = (amount) => {
  const _amount = new BigNumber(amount);
  return _amount.isGreaterThan(0);
};

export const compareBigAmounts = (amount1, amount2) => {
  const _amount1 = new BigNumber(amount1);
  const _amount2 = new BigNumber(amount2);

  if (_amount1.isEqualTo(_amount2)) {
    return "e";
  }

  if (_amount1.isGreaterThan(_amount2)) {
    return "g";
  }

  if (_amount1.isLessThan(_amount2)) {
    return "l";
  }
};

export const isNegative = (num) => {
  const _num = new BigNumber(num);
  return _num.isNegative();
};

export const fromGwei = (
  balance,
  decimals,
  decimalPlaces = 8,
  substractAmount = 0
) => {
  let _balance = new BigNumber(balance);
  const _decimals = new BigNumber(`1e+${decimals}`);
  _balance = _balance.dividedBy(_decimals);
  if (substractAmount) {
    _balance = _balance.minus(new BigNumber(substractAmount));
  }
  if (decimalPlaces) {
    return _balance.toFixed(decimalPlaces).toString();
  }
  return _balance.toFixed().toString();
};

export const getAmountInGwei = (token, amount) => {
  let _amount = new BigNumber(amount);
  let _decimals = new BigNumber(`1e+${token.decimals}`);
  return _amount.multipliedBy(_decimals).toFixed();
};
