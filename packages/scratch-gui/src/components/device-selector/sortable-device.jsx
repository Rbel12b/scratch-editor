import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import styles from './device-selector.css';
import PropTypes from 'prop-types';

const SortableDevice = ({id, label, className, buttonText, buttonCallback}) => {
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
        >
            <div {...listeners}>
                <div
                    className={styles.deviceImage}
                    aria-hidden="true"
                />
                <div className={styles.deviceName}>{label}</div>
            </div>

            {buttonText && buttonCallback ? (
                <button
                    className={styles.deviceButton}
                    onClick={buttonCallback}
                    type="button"
                >
                    {buttonText}
                </button>
            ) : null}
        </div>
    );
};

SortableDevice.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    className: PropTypes.string.isRequired,
    buttonText: PropTypes.string,
    buttonCallback: PropTypes.func
};

export default SortableDevice;
