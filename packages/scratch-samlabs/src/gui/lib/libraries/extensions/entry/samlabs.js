/* eslint-disable import/no-commonjs */
/**
 * This is an extension for SAM Scratch.
 */
const iconURL = require('./samlabs.png');
const insetIconURL = require('./samlabs-small.svg');
const translations = require('./translations.json');

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
            defaultMessage: 'SAM Labs',
            description: 'Name for the \'SAM Labs\' extension'
        });
    },
    extensionId: 'samlabs',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    get description () {
        return formatMessage({
            id: 'samlabs.entry.description',
            defaultMessage: 'SAM Labs',
            description: 'Description for the \'SAM Labs\' extension'
        });
    },
    tags: [],
    featured: true,
    disabled: false,
    bluetoothRequired: true,
    internetConnectionRequired: false,
    helpLink: 'https://Rbel12b.github.io/scratch-samlabs/',
    setFormatMessage: formatter => {
        formatMessage = formatter;
    },
    translationMap: translations
};

// export {entry}; // loadable-extension needs this line.
// export default entry;

module.exports = entry;
