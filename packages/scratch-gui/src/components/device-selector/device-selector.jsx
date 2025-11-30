/* eslint-disable require-jsdoc */
import React, {useState, useEffect} from 'react';
import classNames from 'classnames';
import styles from './device-selector.css';
import {
    DndContext,
    closestCenter
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import SortableDevice from './sortable-device';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import Box from '../box/box.jsx';

const DeviceSelector = ({visible, payload, onSubmit, onClose}) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        setValue('');
    }, []);

    if (!payload) payload = {mapping: []};

    const projectDeviceData = payload.projectDeviceData ? payload.projectDeviceData : {devices: new Map()};
    const projectDevices = projectDeviceData.devices ? Array.from(projectDeviceData.devices.values()) : [];
    const connectedDevices = payload.connectedDevices ? Array.from(payload.connectedDevices.values()) : [];

    // Build initial orders from payload.mapping
    const buildLeft = () =>
        payload.mapping
            .filter(m => projectDevices.some(d => d.displayName === m.displayName))
            .map(m => m.displayName);

    const buildRight = () =>
        payload.mapping
            .filter(m => connectedDevices.some(d => d.id === m.id))
            .map(m => m.id);

    const [leftOrder, setLeftOrder] = useState(buildLeft());
    const [rightOrder, setRightOrder] = useState(buildRight());

    const arraysEqual = (a, b) =>
        a.length === b.length && a.every((x, i) => x === b[i]);


    // keep orders in sync if payload or device lists change
    useEffect(() => {
        if (!payload) return;

        const newLeft = buildLeft();
        const newRight = buildRight();

        if (!arraysEqual(newLeft, leftOrder)) {
            setLeftOrder(newLeft);
        }

        if (!arraysEqual(newRight, rightOrder)) {
            setRightOrder(newRight);
        }
    }, [payload]); // Only payload matters


    const updateValue = (left, right) => {
        const result = {left: [], right: []};

        for (const displayName of left) {
            const entry = payload.mapping.find(m => m.displayName === displayName);
            if (entry) result.left.push(entry);
        }

        for (const id of right) {
            const entry = payload.mapping.find(m => m.id === id);
            if (entry) result.right.push(entry);
        }

        const mapping = [];
        for (let i = 0; i < result.right.length; i++) {
            if (i < result.left.length) {
                mapping.push({
                    displayName: result.left[i].displayName,
                    id: result.right[i].id
                });
            }
        }

        setValue(mapping);
    };

    const handleDragEnd = event => {
        const {active, over} = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // same list? only allow sorting within same column
        if (leftOrder.includes(activeId) && leftOrder.includes(overId)) {
            const oldIndex = leftOrder.indexOf(activeId);
            const newIndex = leftOrder.indexOf(overId);
            const reordered = arrayMove(leftOrder, oldIndex, newIndex);
            setLeftOrder(reordered);
            updateValue(reordered, rightOrder);
            return;
        }

        if (rightOrder.includes(activeId) && rightOrder.includes(overId)) {
            const oldIndex = rightOrder.indexOf(activeId);
            const newIndex = rightOrder.indexOf(overId);
            const reordered = arrayMove(rightOrder, oldIndex, newIndex);
            setRightOrder(reordered);
            updateValue(leftOrder, reordered);
            return;
        }

        // otherwise ignore cross-column drags
    };

    if (!payload) return null;

    return (
        <Modal
            className={styles.modalContent}
            contentLabel="Device Selector"
            isOpen={visible}
            onRequestClose={onClose}
            overlayClassName={styles.modalOverlay}
        >
            <div className={styles.relativeWrapper}>
                {/* overlay while connecting */}
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
                            <div className={styles.connectingText}>{'Connecting to device...'}</div>
                        </div>
                    </div>
                ) : null}

                <Box className={styles.body}>
                    <h2 className={styles.heading}>{'Devices'}</h2>

                    <DndContext
                        collisionDetection={closestCenter}
                        // eslint-disable-next-line react/jsx-no-bind
                        onDragEnd={handleDragEnd}
                    >
                        <div className={styles.gridTwoColumns}>
                            <div className={styles.columnWrapper}>
                                <div className={styles.columnHeader}>{'Project Devices'}</div>
                                <div className={styles.scrollColumn}>
                                    <SortableContext
                                        items={leftOrder}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {leftOrder.map(key => {
                                            const device = projectDevices.find(
                                                d => d.displayName === key) || {displayName: key, name: key};
                                            return (
                                                <SortableDevice
                                                    key={key}
                                                    id={key}
                                                    label={device.displayName}
                                                    className={classNames(
                                                        styles.deviceBox,
                                                        styles[`device-${device.name
                                                            .replace(/\s+/g, '-').toLowerCase()}`]
                                                    )}
                                                />
                                            );
                                        })}
                                    </SortableContext>
                                </div>
                            </div>

                            <div className={styles.columnDivider} />

                            <div className={styles.columnWrapper}>
                                <div className={styles.columnHeader}>{'Connected Devices'}</div>
                                <div className={styles.scrollColumn}>
                                    <SortableContext
                                        items={rightOrder}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {rightOrder.map(key => {
                                            const device = connectedDevices
                                                .find(d => d.id === key) || {id: key, name: key};
                                            return (
                                                <SortableDevice
                                                    key={key}
                                                    id={key}
                                                    label={device.pairingId}
                                                    className={classNames(
                                                        styles.deviceBox,
                                                        styles[`device-${(device.name || '')
                                                            .replace(/\s+/g, '-').toLowerCase()}`]
                                                    )}
                                                />
                                            );
                                        })}
                                    </SortableContext>
                                </div>
                            </div>
                        </div>
                    </DndContext>

                    <div className={styles.buttonRow}>
                        <button
                            className={styles.btn}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => onSubmit(value)}
                        >{'OK'}</button>
                        <button
                            className={styles.btnOutline}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => payload.onConnect && payload.onConnect(value)}
                        >{'Connect New Device'}</button>
                        <button
                            className={styles.btnGhost}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => onClose && onClose()}
                        >{'Cancel'}</button>
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
    onClose: PropTypes.func.isRequired
};

export default DeviceSelector;
