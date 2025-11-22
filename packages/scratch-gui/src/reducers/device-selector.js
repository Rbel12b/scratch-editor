const OPEN_DEVICE_SELECTOR = 'scratch-gui/device-selector/OPEN';
const CLOSE_DEVICE_SELECTOR = 'scratch-gui/device-selector/CLOSE';

const initialState = {
    visible: false,
    payload: null
};

const deviceSelectorReducer = (state, action) => {
    switch (action.type) {
    case OPEN_DEVICE_SELECTOR:
        return {
            visible: true,
            payload: action.payload
        };
    case CLOSE_DEVICE_SELECTOR:
        return initialState;
    default:
        return initialState;
    }
};

const openDeviceSelector = payload => ({
    type: OPEN_DEVICE_SELECTOR,
    payload
});

const closeDeviceSelector = () => ({
    type: CLOSE_DEVICE_SELECTOR
});

export {
    deviceSelectorReducer as default,
    initialState as deviceSelectorInitialState,
    openDeviceSelector,
    closeDeviceSelector
};
