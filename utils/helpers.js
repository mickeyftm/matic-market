import { BigNumber } from "bignumber.js";
/*
    Take an array of classes / strings
    @return space seperated strings
*/
export const addClasses = ( classes ) => {
    let classString = '';
    classes.forEach( item => {
        if( item && item.trim() ) {
            classString = `${classString} ${item.trim()}`;
        }
    });

    return classString;
}

export function middleEllipsis( str, max, sep = "..." ) {
    max = max || 10;
    var len = str.length;
    if(len > max){
        var seplen = sep.length;
        if(seplen > max) { return str.substr(len - max) }

        var n = -0.5 * (max - len - seplen);
        var center = len/2;
        return str.substr(0, center - n) + sep + str.substr(len - center + n);
    }
    return str;
}

export const generateZerosString = (len) => {
    let zeros = '';
    for(let i=0; i<len; i++) {
        zeros += '0';
    }

    return zeros;
}

export function toFixed(x) {
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split('e-')[1]);
      if (e) {
          x *= Math.pow(10,e-1);
          x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split('+')[1]);
      if (e > 20) {
          e -= 20;
          x /= Math.pow(10,e);
          x += (new Array(e+1)).join('0');
      }
    }
    return x;
}

export const isBigAmountNonZero = (amount) => {
    const _amount = new BigNumber(amount);
    return _amount.isGreaterThan(0);
}

export const compareBigAmounts = (amount1, amount2) => {
    const _amount1 = new BigNumber(amount1);
    const _amount2 = new BigNumber(amount2);
    
    if(_amount1.isEqualTo(_amount2)){
        return 'e';
    }

    if(_amount1.isGreaterThan(_amount2)){
        return 'g'
    }
    
    if(_amount1.isLessThan(_amount2)){
        return 'l'
    }
}

export const isNegative = (num) => {
    const _num = new BigNumber(num);
    return _num.isNegative();
}

export const fromGwei = (balance, decimals, decimalPlaces = 8, substractAmount = 0) => {
    let _balance = new BigNumber(balance);
    const _decimals = new BigNumber(`1e+${decimals}`);
    _balance = _balance.dividedBy(_decimals);
    if(substractAmount) {
        _balance = _balance.minus(new BigNumber(substractAmount));
    }
    if(decimalPlaces) {
        return _balance.toFixed(decimalPlaces).toString();
    }
    return _balance.toFixed().toString();
}

export const asyncDebounce = (fn, time = 300) => {
    let timer, lastPromise;
    return (...args) => {
        clearTimeout(timer);

        //reject last promise
        if(lastPromise && lastPromise.reject) {
            lastPromise.reject('new version is there');
        }

        return new Promise( (resolve, reject) => {
            lastPromise = { resolve, reject };
            timer = setTimeout( async () => {
                resolve(await fn.apply({}, args));
            }, time);
        });
    }
}

export const getAmountInGwei = (token, amount) => {
    let _amount = new BigNumber(amount);
    let _decimals = new BigNumber(`1e+${token.decimals}`);
    return _amount.multipliedBy(_decimals).toFixed();
}

export const compareTokens = (token1, token2) => {
    if( token1 && !token2 ) return false;
    if( token2 && !token1 ) return false;

    if( token1.address === token2.address ) return true;
    return false;
}

export const noop = () => null;