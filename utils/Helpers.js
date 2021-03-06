/*
    Take an array of classes / strings
    @return space seperated strings
*/

export const addClasses = (classes) => {
  let classString = "";
  classes.forEach((item) => {
    if (item && item.trim()) {
      classString = `${classString} ${item.trim()}`;
    }
  });

  return classString;
};

export function openUrlInNewTab(url) {
  window.open(url, "_blank").focus();
}

export function middleEllipsis(str, max, sep = "...") {
  max = max || 10;
  var len = str.length;
  if (len > max) {
    var seplen = sep.length;
    if (seplen > max) {
      return str.substr(len - max);
    }

    var n = -0.5 * (max - len - seplen);
    var center = len / 2;
    return str.substr(0, center - n) + sep + str.substr(len - center + n);
  }
  return str;
}

export const generateZerosString = (len) => {
  let zeros = "";
  for (let i = 0; i < len; i++) {
    zeros += "0";
  }

  return zeros;
};

export function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = "0." + new Array(e).join("0") + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join("0");
    }
  }
  return x;
}

export function isValidContractAddress(address) {
  return address && address.includes("0x") && address.length === 42;
}

export const asyncDebounce = (fn, time = 300) => {
  let timer, lastPromise;
  return (...args) => {
    clearTimeout(timer);

    //reject last promise
    if (lastPromise && lastPromise.reject) {
      lastPromise.reject("fresh call");
    }

    return new Promise((resolve, reject) => {
      lastPromise = { resolve, reject };
      timer = setTimeout(async () => {
        resolve(await fn.apply({}, args));
      }, time);
    });
  };
};

export const getUniqueId = (length = 8) => {
  var POSSIBLES =
    "qwertyuiopasdfghjklzxcvbnmQAZWSXEDCRFVTGBYHNUJMIKOLP1234567890_$^@";
  var str = "";
  for (let i = 0; i < length; i++) {
    str += POSSIBLES[Math.floor(Math.random() * POSSIBLES.length)];
  }
  return str;
};

export const compareTokens = (token1, token2) => {
  if (token1 && !token2) return false;
  if (token2 && !token1) return false;

  if (token1.address === token2.address) return true;
  return false;
};

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand("copy");
    var msg = successful ? "successful" : "unsuccessful";
    // console.log("Fallback: Copying text command was " + msg);
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
  }

  document.body.removeChild(textArea);
}

export const debounce = (fn, time = 500) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply({}, args);
    }, time);
  };
};

export function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(
    function () {
      //   console.log("Async: Copying to clipboard was successful!");
    },
    function (err) {
      console.error("Async: Could not copy text: ", err);
    }
  );
}

export const noop = () => null;
