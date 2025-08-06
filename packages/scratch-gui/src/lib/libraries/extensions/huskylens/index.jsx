/**
 * This is an extension for Xcratch.
 */

import iconURL from './huskylens.png';
// import insetIconURL from './huskylens-small.svg';
import translations from './translations.json';

/**
 * Formatter to translate the messages in this extension.
 * This will be replaced which is used in the React component.
 * @param {object} messageData - data for format-message
 * @returns {string} - translated message for the current locale
 */
let formatMessage = messageData => messageData.defaultMessage;

const entry = {
    get name () {
        return formatMessage({
            id: 'samlabs.entry.name',
            defaultMessage: 'DFRobot HuskyLens',
            description: 'Name for the extension'
        });
    },
    extensionId: 'huskylens',
    // collaborator: 'Rbel12b',
    iconURL: iconURL,
    // insetIconURL: insetIconURL,
    get description () {
        return formatMessage({
            id: 'samlabs.entry.description',
            defaultMessage: '',
            description: 'Description for the extension'
        });
    },
    tags: [],
    featured: true,
    disabled: false,
    bluetoothRequired: true,
    internetConnectionRequired: false,
    setFormatMessage: formatter => {
        formatMessage = formatter;
    },
    translationMap: translations,
    helpLink: 'https://github.com/Rbel12b/scratch-huskylens/blob/main/README.md'
};

export {entry}; // loadable-extension needs this line.
export default entry;
