import React from 'react';
import {FormattedMessage} from 'react-intl';

import pascoIconURL from './pasco.png';
// import pascoInsetIconURL from './pasco-small.svg';

const entry = {
    name: 'PASCO BLE Devices',
    extensionId: 'pasco',
    iconURL: pascoIconURL,
    // insetIconURL: pascoInsetIconURL,
    description: (
        <FormattedMessage
            defaultMessage="Use PASCO BLE sensors"
            id="gui.extension.pasco.description"
        />
    ),
    featured: true,
    disabled: false,
    bluetoothRequired: true,
    internetConnectionRequired: true
};

export {entry}; // loadable-extension needs this line.
export default entry;
