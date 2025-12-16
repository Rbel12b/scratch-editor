const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class GoogleSheetsAdvanced {
    constructor () {
        this.apiUrl = '';
    }

    getInfo () {
        return {
            id: 'googlesheetsadv',
            name: 'Google Sheets Avanzato',
            color1: '#0F9D58',
            blocks: [
                {
                    opcode: 'configuraUrl',
                    blockType: BlockType.COMMAND,
                    text: 'Imposta URL API: [URL]',
                    arguments: {
                        URL: {type: ArgumentType.STRING, defaultValue: 'Incolla URL qui'}
                    }
                },
                '---', // Linea separatrice
                {
                    opcode: 'leggiCella',
                    blockType: BlockType.REPORTER,
                    text: 'Leggi colonna [COLONNA] alla riga [RIGA]',
                    arguments: {
                        COLONNA: {type: ArgumentType.STRING, defaultValue: 'Nome'},
                        RIGA: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'contaRighe',
                    blockType: BlockType.REPORTER,
                    text: 'Numero totale di righe',
                    disableMonitor: true
                },
                '---',
                {
                    opcode: 'aggiungiRiga',
                    blockType: BlockType.COMMAND,
                    text: 'Aggiungi nuova riga: [COLONNA] = [VALORE]',
                    arguments: {
                        COLONNA: {type: ArgumentType.STRING, defaultValue: 'Nome'},
                        VALORE: {type: ArgumentType.STRING, defaultValue: 'Luigi'}
                    }
                },
                {
                    opcode: 'modificaRiga',
                    blockType: BlockType.COMMAND,
                    text: 'Modifica: Se [COL_CERCA] è [VAL_CERCA] imposta [COL_TARGET] a [NUOVO_VAL]',
                    arguments: {
                        COL_CERCA: {type: ArgumentType.STRING, defaultValue: 'Nome'},
                        VAL_CERCA: {type: ArgumentType.STRING, defaultValue: 'Mario'},
                        COL_TARGET: {type: ArgumentType.STRING, defaultValue: 'Punteggio'},
                        NUOVO_VAL: {type: ArgumentType.STRING, defaultValue: '500'}
                    }
                }
            ]
        };
    }

    configuraUrl (args) {
        this.apiUrl = args.URL;
    }

    // Lettura con coordinate
    leggiCella (args) {
        if (!this.apiUrl) return 'No URL';
        return fetch(this.apiUrl)
            .then(r => r.json())
            .then(data => {
                // Scratch usa indice 1, Javascript usa 0. Quindi facciamo riga - 1
                const rowIndex = args.RIGA - 1;
                if (data && data.length > rowIndex) {
                    // Controlliamo se la riga esiste
                    return data[rowIndex][args.COLONNA] || 'Vuoto';
                }
                return 'Riga non trovata';
            })
            .catch(() => 'Errore');
    }

    contaRighe () {
        if (!this.apiUrl) return 0;
        return fetch(this.apiUrl)
            .then(r => r.json())
            .then(data => data.length)
            .catch(() => 0);
    }

    // Scrittura (Aggiungi in fondo)
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

    // Scrittura (Modifica specifica)
    // Esempio: "Cerca la riga dove Nome = Mario e cambia Punteggio in 100"
    modificaRiga (args) {
        if (!this.apiUrl) return;
        // Costruiamo l'URL speciale per l'aggiornamento: URL/Colonna/Valore
        // Es: .../api/v1/Nome/Mario
        const updateUrl = `${this.apiUrl}/${args.COL_CERCA}/${args.VAL_CERCA}`;

        const data = {};
        data[args.COL_TARGET] = args.NUOVO_VAL;

        return fetch(updateUrl, {
            method: 'PATCH', // PATCH serve per modificare dati esistenti
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({data: data})
        }).catch(e => console.error(e));
    }
}
module.exports = GoogleSheetsAdvanced;
