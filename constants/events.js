export const TOGGLE_OVERLAY_VISIBILITY = 'TOGGLE_OVERLAY_VISIBILITY';

export const WALLET_CONNECTED = 'WALLET_CONNECTED';
export const WALLET_DISCONNECTED = 'WALLET_DISCONNECTED';

export const WALLET_LINKED = 'WALLET_LINKED';

export const ON_PENDING_TRANSECTION = 'ON_PENDING_TRANSECTION';
export const ON_TRANSECTION_COMPLETE = 'ON_TRANSECTION_COMPLETE';

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';

export const ON_WALLET_USER_ACTION = 'ON_WALLET_USER_ACTION';

export const TRIGGER_WALLET_CONNECT = 'TRIGGER_WALLET_CONNECT';
export const ON_QUOTE_PRICE_UPDATE = 'ON_QUOTE_PRICE_UPDATE';

export const HAVE_WALLET_APP = 'HAVE_WALLET_APP';
export const ON_WALLET_CONNECT = 'ON_WALLET_CONNECT'; // when wallet is accessible means ready for performing but you are not sure if it is connect to the wallet address or not, check WALLET_ADDRESS if we are approved sites or not on metamask.
export const ON_WALLET_ACCOUNTS_CHANGED = 'ON_WALLET_ACCOUNTS_CHANGED'; // let the latest account details from the object.
export const ON_WALLET_CHAIN_CHANGED = 'ON_WALLET_CHAIN_CHANGED';  // chain is changed, can show option to switch back to chain you support.

export const ON_WINDOW_FOCUS = 'ON_WINDOW_FOCUS';
export const ON_WINDOW_BLUR = 'ON_WINDOW_BLUR';
export const ON_ALL_TOKEN_BALANCE_UPDATE = 'ON_ALL_TOKEN_BALANCE_UPDATE';