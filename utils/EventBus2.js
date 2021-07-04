const __eventMap__ = {};

const unsubscribe = (eventType, callback) => {
    let _index;
    if( __eventMap__[eventType] && __eventMap__[eventType].queue ) {
        __eventMap__[eventType].queue.forEach( (item, index) => {
            if( item === callback ) {
                _index = index;
                return false;
            }
        });
    }

    if(_index) {
        __eventMap__[eventType].queue.splice(_index, 1);
    }
}

export const subscribe = (eventType, callback) => {
    if( __eventMap__[eventType] && __eventMap__.queue ) {
        __eventMap__[eventType].queue.push(callback);
    } else {
        __eventMap__[eventType].queue = [ callback ];
    }
    
    return () => {
        unsubscribe(eventType, callback);
    }
}

export const publish = (eventType, argObj) => {
    console.log('EventBus', __eventMap__);
    if(__eventMap__[eventType] && __eventMap__[eventType].queue) {
        __eventMap__[eventType].queue.forEach(item => {
            item && item(argObj);
        })
    }
}