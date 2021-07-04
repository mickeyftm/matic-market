const TRANSECTIONS = 'Transections';

export const saveData = ( key, value ) => {
    if( window.localStorage ) {
        window.localStorage.setItem( key, JSON.stringify(value) );
        return true;
    }
    return false;
}

export const getData = ( key ) => {
    if( window.localStorage ) {
        const val = window.localStorage.getItem( key );
        return JSON.parse(val);
    }
    return  null;
}

export const getTransections = () => {
    const transections = getData(TRANSECTIONS);
    return transections || [];
}

export const insertTransection = (transection) => {
    const transections = getData(TRANSECTIONS);
    if(transections) {
        return saveData(TRANSECTIONS, [...transections, transection]);
    }
    return saveData(TRANSECTIONS, [transection]);
}

export const updateTransection = (transection) => {
    const transections = getData(TRANSECTIONS);
    if(transections && transection.id) {
        let targetIndex;
        transections.forEach( (tx, index) => {
            if(tx.id === transection.id) {
                targetIndex = index;
                return false;
            }
        });

        if(targetIndex) {
            transections[targetIndex] = {
                ...transections[targetIndex],
                ...transection
            };
            return saveData(TRANSECTIONS, transections);
        }
    }
    return saveData(TRANSECTIONS, [transection]);
}