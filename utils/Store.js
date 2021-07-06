/*
    Temporary Solution for the time being
    DANGEROUS Practice.
*/

const __store__ = {};

export const logMemStore = () => console.log(__store__);

export const getFromStore = (key) => {
    return __store__[key];
}

export const putInStoreAsync = async (key, getValue) => {
    try {
        const value = await getValue();
        __store__[key] = value;
    } catch {
        console.error('MemStorage:: getValue func got exception');
    }
}

export const putInStore = (key, value) => {
    __store__[key] = value;
}
