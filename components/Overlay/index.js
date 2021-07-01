import { useState, useEffect } from 'react';
import { subscribe } from '@/utils/EventBus';
import { TOGGLE_OVERLAY_VISIBILITY } from '@/constants/events';
import styles from './style.module.css';
import { addClasses, noop } from '@/utils/Helpers';
import { OVERLAY_TYPE_WITH_TOKEN_LIST } from '@/constants/types';
import { ListWithSearchAndSort } from '../ListWithSearchAndSort';

const getOverlayComponent = (type) => {
    switch(type) {
        case OVERLAY_TYPE_WITH_TOKEN_LIST:{
            return ListWithSearchAndSort
        }
    }
    return noop;
}

export const Overlay = () => {
    const [visible, setVisible] = useState(false);
    const [classes, setClasses] = useState([]);    

    const getOverlayContent = (type, props) => {
        return {
            Component: getOverlayComponent(type),
            props
        };
    };
    
    const [component, setComponent] = useState(getOverlayContent());
    const fadeOut = () => {
        setClasses([styles.overlay, styles.fadeOut]);
        setTimeout( () => {
            setVisible(false);
        }, 150);
    }

    const setVisibility = ({ isVisible, type, props }) => {
        setComponent(getOverlayContent(type, props));
        if(isVisible) {
            setClasses([styles.overlay, styles.fadeIn]);
            setVisible(isVisible);
        } else {
            fadeOut();
        }
    };

    useEffect( () => {
        const unsubscribe = subscribe(TOGGLE_OVERLAY_VISIBILITY, setVisibility);
        return unsubscribe;
    }, []);

    return( visible &&
        <div className={addClasses(classes)}>
            <component.Component
                {...component.props}
                closeOverlay={fadeOut}
            />
        </div>
    );
};