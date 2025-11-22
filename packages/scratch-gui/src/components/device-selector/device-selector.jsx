import React, {useState, useEffect} from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import Box from '../box/box.jsx';
import classNames from 'classnames';

import styles from './device-selector.css';

const DeviceSelector = ({visible, payload, onSubmit, onClose}) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        setValue('');
    }, []);

    if (!payload) return null;

    const projectDeviceData = payload.projectDeviceData ? payload.projectDeviceData : null;
    const projectDevices = projectDeviceData.devices ? Array.from(projectDeviceData.devices.values()) : [];
    const connectedDevices = payload.connectedDevices ? Array.from(payload.connectedDevices.values()) : [];

    return (
        <Modal
            className={styles.modalContent}
            contentLabel="Device Selector"
            isOpen={visible}
            onRequestClose={onClose}
            overlayClassName={styles.modalOverlay}
        >
            <Box className={styles.body}>
                <h2>{'Devices'}</h2>

                <div className={styles.deviceGrid}>
                    {projectDevices.map(device => (
                        <div
                            key={device.displayName}
                            className={classNames(
                                styles.deviceBox,
                                styles[`device-${device.name.replace(/\s+/g, '-').toLowerCase()}`]
                            )}
                        >
                            <div className={styles.deviceImage} />
                            <div className={styles.deviceName}>{device.displayName}</div>
                        </div>
                    ))}
                </div>

                <div className={styles.buttonRow}>
                    {// eslint-disable-next-line react/jsx-no-bind
                        <button onClick={() => onSubmit({value})}>
                            {'OK'}
                        </button>
                    }
                </div>
            </Box>
        </Modal>
    );
};

DeviceSelector.propTypes = {
    visible: PropTypes.bool.isRequired,
    payload: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default DeviceSelector;
