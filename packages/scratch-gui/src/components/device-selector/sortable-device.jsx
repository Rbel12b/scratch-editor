import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import styles from './device-selector.css';
import PropTypes from 'prop-types';

const SortableDevice = ({id, label, className}) => {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id});
    const style = {
        transform: CSS.Transform.toString(transform),
        // eslint-disable-next-line no-undefined
        transition: transition || undefined
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={className}
            {...attributes}
            {...listeners}
        >
            <div
                className={styles.deviceImage}
                aria-hidden="true"
            />
            <div className={styles.deviceName}>{label}</div>
        </div>
    );
};

SortableDevice.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    className: PropTypes.string.isRequired
};

export default SortableDevice;
