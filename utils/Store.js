/*
    Temporary Solution for the time being
    DANGEROUS Practice.
*/

const __store__ = {};

export const getItem = (key) => {
    return __store__[key];
}

export const setItem = (key, value) => {
    __store__[key] = value;
}
