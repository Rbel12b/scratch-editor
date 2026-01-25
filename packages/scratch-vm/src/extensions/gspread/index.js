const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const translations = {
    en: {
        'gui.extension.googlesheetsadv.name': 'Google Sheets Advanced',
        'gui.extension.googlesheetsadv.description': 'Read and write data to Google Sheets.',
        'gui.extension.googlesheetsadv.configuraUrl': 'Set API URL: [URL]',
        'gui.extension.googlesheetsadv.leggiCella': 'Read column [COLONNA] at row [RIGA]',
        'gui.extension.googlesheetsadv.contaRighe': 'Total number of rows',
        'gui.extension.googlesheetsadv.aggiungiRiga': 'Add new row: [COLONNA] = [VALORE]',
        'gui.extension.googlesheetsadv.modificaRiga':
            'Modify: If [COL_CERCA] is [VAL_CERCA] set [COL_TARGET] to [NUOVO_VAL]',
        'gui.extension.googlesheetsadv.defaultUrl': 'Paste URL here',
        'gui.extension.googlesheetsadv.defaultName': 'Name',
        'gui.extension.googlesheetsadv.defaultValue': 'Luigi',
        'gui.extension.googlesheetsadv.defaultScore': 'Score',
        'gui.extension.googlesheetsadv.defaultScoreValue': '500',
        'gui.extension.googlesheetsadv.errorNoUrl': 'No URL',
        'gui.extension.googlesheetsadv.errorRowNotFound': 'Row not found',
        'gui.extension.googlesheetsadv.errorEmpty': 'Empty',
        'gui.extension.googlesheetsadv.errorFetch': 'Error'
    },
    it: {
        'gui.extension.googlesheetsadv.name': 'Google Sheets Avanzato',
        'gui.extension.googlesheetsadv.description': 'Leggi e scrivi dati su Google Sheets.',
        'gui.extension.googlesheetsadv.configuraUrl': 'Imposta URL API: [URL]',
        'gui.extension.googlesheetsadv.leggiCella': 'Leggi colonna [COLONNA] alla riga [RIGA]',
        'gui.extension.googlesheetsadv.contaRighe': 'Numero totale di righe',
        'gui.extension.googlesheetsadv.aggiungiRiga': 'Aggiungi nuova riga: [COLONNA] = [VALORE]',
        'gui.extension.googlesheetsadv.modificaRiga':
            'Modifica: Se [COL_CERCA] è [VAL_CERCA] imposta [COL_TARGET] a [NUOVO_VAL]',
        'gui.extension.googlesheetsadv.defaultUrl': 'Incolla URL qui',
        'gui.extension.googlesheetsadv.defaultName': 'Nome',
        'gui.extension.googlesheetsadv.defaultValue': 'Luigi',
        'gui.extension.googlesheetsadv.defaultScore': 'Punteggio',
        'gui.extension.googlesheetsadv.defaultScoreValue': '500',
        'gui.extension.googlesheetsadv.errorNoUrl': 'No URL',
        'gui.extension.googlesheetsadv.errorRowNotFound': 'Riga non trovata',
        'gui.extension.googlesheetsadv.errorEmpty': 'Vuoto',
        'gui.extension.googlesheetsadv.errorFetch': 'Errore'
    }
};

let formatMessage = messageData => messageData.default;

const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

class GoogleSheetsAdvanced {
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    constructor (runtime) {
        if (runtime.formatMessage) {
            formatMessage = runtime.formatMessage;
        }
        this.apiUrl = '';
    }

    getInfo () {
        return {
            id: 'googlesheetsadv',
            name: formatMessage({
                id: 'gui.extension.googlesheetsadv.name',
                default: 'Google Sheets Advanced'
            }),
            color1: '#0F9D58',
            blocks: [
                {
                    opcode: 'configuraUrl',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'gui.extension.googlesheetsadv.configuraUrl',
                        default: 'Set API URL: [URL]'
                    }),
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'gui.extension.googlesheetsadv.defaultUrl',
                                default: 'Paste URL here'
                            })
                        }
                    }
                },
                '---',
                {
                    opcode: 'leggiCella',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'gui.extension.googlesheetsadv.leggiCella',
                        default: 'Read column [COLONNA] at row [RIGA]'
                    }),
                    arguments: {
                        COLONNA: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'gui.extension.googlesheetsadv.defaultName',
                                default: 'Name'
                            })
                        },
                        RIGA: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'contaRighe',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'gui.extension.googlesheetsadv.contaRighe',
                        default: 'Total number of rows'
                    }),
                    disableMonitor: true
                },
                '---',
                {
                    opcode: 'aggiungiRiga',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'gui.extension.googlesheetsadv.aggiungiRiga',
                        default: 'Add new row: [COLONNA] = [VALORE]'
                    }),
                    arguments: {
                        COLONNA: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'gui.extension.googlesheetsadv.defaultName',
                                default: 'Name'
                            })
                        },
                        VALORE: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'gui.extension.googlesheetsadv.defaultValue',
                                default: 'Luigi'
                            })
                        }
                    }
                },
                {
                    opcode: 'modificaRiga',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'gui.extension.googlesheetsadv.modificaRiga',
                        default: 'Modify: If [COL_CERCA] is [VAL_CERCA] set [COL_TARGET] to [NUOVO_VAL]'
                    }),
                    arguments: {
                        COL_CERCA: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'gui.extension.googlesheetsadv.defaultName',
                                default: 'Name'
                            })
                        },
                        VAL_CERCA: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Mario'},
                        COL_TARGET: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'gui.extension.googlesheetsadv.defaultScore',
                                default: 'Score'
                            })
                        },
                        NUOVO_VAL: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'gui.extension.googlesheetsadv.defaultScoreValue',
                                default: '500'
                            })
                        }
                    }
                }
            ]
        };
    }

    configuraUrl (args) {
        this.apiUrl = args.URL;
    }

    leggiCella (args) {
        if (!this.apiUrl) return formatMessage({id: 'gui.extension.googlesheetsadv.errorNoUrl', default: 'No URL'});
        return fetch(this.apiUrl)
            .then(r => r.json())
            .then(data => {
                console.log(data);
                const rowIndex = args.RIGA - 1;
                if (data && data.length > rowIndex) {
                    return data[rowIndex][args.COLONNA] ||
                        formatMessage({id: 'gui.extension.googlesheetsadv.errorEmpty', default: 'Empty'});
                }
                return formatMessage({id: 'gui.extension.googlesheetsadv.errorRowNotFound', default: 'Row not found'});
            })
            .catch(() => formatMessage({id: 'gui.extension.googlesheetsadv.errorFetch', default: 'Error'}));
    }

    contaRighe () {
        if (!this.apiUrl) return 0;
        return fetch(this.apiUrl)
            .then(r => r.json())
            .then(data => data.length)
            .catch(() => 0);
    }

    aggiungiRiga (args) {
        if (!this.apiUrl) return;
        const data = {};
        data[args.COLONNA] = args.VALORE;
        return fetch(this.apiUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({data: data})
        });
    }

    modificaRiga (args) {
        if (!this.apiUrl) return;
        const updateUrl = `${this.apiUrl}/${args.COL_CERCA}/${args.VAL_CERCA}`;
        const data = {};
        data[args.COL_TARGET] = args.NUOVO_VAL;
        return fetch(updateUrl, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({data: data})
        }).catch(e => console.error(e));
    }
}
module.exports = GoogleSheetsAdvanced;
