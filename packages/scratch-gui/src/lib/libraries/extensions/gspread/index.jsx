import React from 'react';
import {FormattedMessage} from 'react-intl';

import iconImage from './icon.svg';
// import insetImage from './googlesheetsadv-small.svg';

const translationMap = {
    en: {
        'gui.extension.googlesheetsadv.name': 'Google Sheets Advanced',
        'gui.extension.googlesheetsadv.description': 'Read and write data to Google Sheets.'
    }
};

export default {
    extensionId: 'googlesheetsadv',
    name: (
        <FormattedMessage
            defaultMessage="Google Sheets Advanced"
            description="Name for the Google Sheets Advanced extension"
            id="gui.extension.googlesheetsadv.name"
        />
    ),
    iconURL: iconImage,
    // insetIconURL: insetImage,
    description: (
        <FormattedMessage
            defaultMessage="Read and write data to Google Sheets."
            description="Description for the Google Sheets Advanced extension"
            id="gui.extension.googlesheetsadv.description"
        />
    ),
    featured: true,
    disabled: false,
    internetConnectionRequired: true,
    translationMap: translationMap
};
