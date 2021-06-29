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

export const noop = () => null;