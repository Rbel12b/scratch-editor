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
            <div className={styles.relativeWrapper}>
                {/* Overlay shown while connecting */}
                {payload.connecting ? (
                    <div
                        className={styles.connectingOverlay}
                        aria-live="polite"
                    >
                        <div className={styles.connectingInner}>
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 50 50"
                                aria-hidden="true"
                            >
                                <circle
                                    cx="25"
                                    cy="25"
                                    r="20"
                                    stroke="#e0e0e0"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    d="M25 5 A20 20 0 0 1 45 25"
                                    stroke="#0078d4"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    fill="none"
                                >
                                    <animateTransform
                                        attributeType="xml"
                                        attributeName="transform"
                                        type="rotate"
                                        from="0 25 25"
                                        to="360 25 25"
                                        dur="1s"
                                        repeatCount="indefinite"
                                    />
                                </path>
                            </svg>
                            <div className={styles.connectingText}>
                                {'Connecting to device...'}
                            </div>
                        </div>
                    </div>
                ) : null}

                <Box className={styles.body}>
                    <h2>{'Devices'}</h2>

                    <div className={styles.flexRow}>
                        <div className={styles.flex1}>
                            {projectDevices && projectDevices.length > 0 ? (
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
                            ) : (
                                <div className={styles.emptyState}>{'No devices in project'}</div>
                            )}
                        </div>

                        <div className={styles.verticalDivider} />

                        <div className={styles.flex1}>
                            {connectedDevices && connectedDevices.length > 0 ? (
                                <div className={styles.deviceGrid}>
                                    {connectedDevices.map(device => (
                                        <div
                                            key={device.pairingId || device.name}
                                            className={classNames(
                                                styles.deviceBox,
                                                // eslint-disable-next-line max-len
                                                styles[`device-${(device.name || '').replace(/\s+/g, '-').toLowerCase()}`]
                                            )}
                                        >
                                            <div className={styles.deviceImage} />
                                            <div className={styles.deviceName}>{device.pairingId}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>{'No connected devices'}</div>
                            )}
                        </div>
                    </div>

                    <div className={styles.buttonRow}>
                        {// eslint-disable-next-line react/jsx-no-bind
                            <button onClick={() => onSubmit({value})}>
                                {'OK'}
                            </button>
                        }

                        {// eslint-disable-next-line react/jsx-no-bind
                            <button onClick={() => payload.onConnect({value})}>
                                {'Connect New Device'}
                            </button>
                        }
                    </div>
                </Box>
            </div>
        </Modal>
    );
};

DeviceSelector.propTypes = {
    visible: PropTypes.bool.isRequired,
    payload: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onConnect: PropTypes.func.isRequired
};

export default DeviceSelector;
