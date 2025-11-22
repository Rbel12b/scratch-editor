import {connect} from 'react-redux';
import DeviceSelectorComponent from '../components/device-selector/device-selector.jsx';
import {
    closeDeviceSelector
} from '../reducers/device-selector';

const mapStateToProps = state => ({
    visible: state.scratchGui.deviceSelector.visible,
    payload: state.scratchGui.deviceSelector.payload
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSubmit: data => {
        dispatch(closeDeviceSelector());
        ownProps.vm.runtime.emit('DEVICE_SELECTOR_RESULT', data);
    },
    onClose: () => dispatch(closeDeviceSelector())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DeviceSelectorComponent);
