/* eslint-disable camelcase */
import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import {HuskylensProtocol, HUSKYLENSResultType_t, HUSKYLENSMode, HUSKYLENSphoto,
    Content1, Content2, Content3, Content4,
    protocolAlgorithm}
    from './protocol.ts';

import en from './translations/en.json';

const translations = {
    en: en
};

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.default;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'huskylens';

/**
 * Scratch 3.0 blocks
 */
class ExtensionBlocks extends HuskylensProtocol {
    /**
     * A translation object which is used in this class.
     * @param {FormatObject} formatter - translation object
     */
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'huskylens.name',
            default: 'HuskyLens'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    extensionURL = 'https://rbel12b.github.io/Scratch/dist/huskylens.mjs';


    /**
     * Construct a set of blocks for SAM Labs.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        super(runtime);
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }
        this.extensionId = 'huskylens';
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: this.extensionURL,
            showStatusButton: true,
            color1: '#e7660b',
            color2: '#e7660b',
            blocks: [
                {
                    opcode: 'initI2c',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'huskylens.initI2c',
                        default: 'initialize HuskyLens'
                    }),
                    terminal: false
                },
                {
                    opcode: 'selectAlgorithm',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'huskylens.selectAlgorithm',
                        default: 'set algorithm to [algorithm]'
                    }),
                    arguments: {
                        algorithm: {
                            type: ArgumentType.STRING,
                            menu: 'algorithmMenu',
                            defaultValue: protocolAlgorithm.ALGORITHM_OBJECT_TRACKING
                        }
                    }
                },
                {
                    opcode: 'requestDataOnce',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'huskylens.requestDataOnce',
                        default: 'get data from HuskyLens'
                    })
                },
                {
                    opcode: 'getLearnedIDCount',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getLearnedIDCount',
                        default: 'number of IDs learned'
                    })
                },
                {
                    opcode: 'isObjectOnScreen',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'huskylens.isObjectOnScreen',
                        default: 'is there a(n) [objectType] on screen?'
                    }),
                    arguments: {
                        objectType: {
                            type: ArgumentType.STRING,
                            menu: 'resultTypeMenu',
                            defaultValue: HUSKYLENSResultType_t.HUSKYLENSResultBlock
                        }
                    }
                },
                {
                    opcode: 'getBoxNearCenter',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getBoxNearCenter',
                        default: '[parameter] of box closest to center'
                    }),
                    arguments: {
                        parameter: {
                            type: ArgumentType.STRING,
                            menu: 'parameterMenu3',
                            defaultValue: Content3.ID
                        }
                    }
                },
                {
                    opcode: 'getArrowNearCenter',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getArrowNearCenter',
                        default: '[parameter] of arrow closest to center'
                    }),
                    arguments: {
                        parameter: {
                            type: ArgumentType.STRING,
                            menu: 'parameterMenu4',
                            defaultValue: Content4.ID
                        }
                    }
                },
                {
                    opcode: 'isIDLearned',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'huskylens.isIDLearned',
                        default: 'is ID [id] learned?'
                    }),
                    arguments: {
                        id: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'isIDObjectOnScreen',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'huskylens.isIDObjectOnScreen',
                        default: 'is ID [id] [objectType] on screen?'
                    }),
                    arguments: {
                        id: {type: ArgumentType.NUMBER, defaultValue: 1},
                        objectType: {
                            type: ArgumentType.STRING,
                            menu: 'resultTypeMenu',
                            defaultValue: HUSKYLENSResultType_t.HUSKYLENSResultBlock
                        }
                    }
                },
                {
                    opcode: 'getBoxParamByID',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getBoxParamByID',
                        default: '[parameter] of box with ID [id]'
                    }),
                    arguments: {
                        parameter: {type: ArgumentType.STRING, menu: 'parameterMenu1', defaultValue: Content1.width},
                        id: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'getArrowParamByID',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getArrowParamByID',
                        default: '[parameter] of arrow with ID [id]'
                    }),
                    arguments: {
                        parameter: {type: ArgumentType.STRING, menu: 'parameterMenu2', defaultValue: Content2.xOrigin},
                        id: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                '---',
                {
                    opcode: 'getTotalCount',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getTotalCount',
                        default: 'number of [objectType]'
                    }),
                    arguments: {
                        objectType: {
                            type: ArgumentType.STRING,
                            menu: 'resultTypeMenu2',
                            defaultValue: HUSKYLENSResultType_t.HUSKYLENSResultBlock
                        }
                    }
                },
                {
                    opcode: 'getNthBoxParam',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getNthBoxParam',
                        default: '[parameter] of box number [index]'
                    }),
                    arguments: {
                        parameter: {type: ArgumentType.STRING, menu: 'parameterMenu3', defaultValue: Content3.ID},
                        index: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'getNthArrowParam',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getNthArrowParam',
                        default: '[parameter] of arrow number [index]'
                    }),
                    arguments: {
                        parameter: {type: ArgumentType.STRING, menu: 'parameterMenu4', defaultValue: Content4.ID},
                        index: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'getTotalByID',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getTotalByID',
                        default: 'number of [objectType] with ID [id]'
                    }),
                    arguments: {
                        id: {type: ArgumentType.NUMBER, defaultValue: 1},
                        objectType: {
                            type: ArgumentType.STRING,
                            menu: 'resultTypeMenu2',
                            defaultValue: HUSKYLENSResultType_t.HUSKYLENSResultBlock
                        }
                    }
                },
                {
                    opcode: 'getNthBoxParamByID',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getNthBoxParamByID',
                        default: '[parameter] of box [index] with ID [id]'
                    }),
                    arguments: {
                        parameter: {
                            type: ArgumentType.STRING,
                            menu: 'parameterMenu1',
                            defaultValue: Content1.width
                        },
                        id: {type: ArgumentType.NUMBER, defaultValue: 1},
                        index: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'getNthArrowParamByID',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'huskylens.getNthArrowParamByID',
                        default: '[parameter] of arrow [index] with ID [id]'
                    }),
                    arguments: {
                        parameter: {type: ArgumentType.STRING, menu: 'parameterMenu2', defaultValue: Content2.xOrigin},
                        id: {type: ArgumentType.NUMBER, defaultValue: 1},
                        index: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'learnIDAuto',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({id: 'huskylens.learnIDAuto', default: 'automatically learn ID [id]'}),
                    arguments: {
                        id: {type: ArgumentType.NUMBER, defaultValue: 1}
                    }
                },
                {
                    opcode: 'forgetAll',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'huskylens.forgetAll',
                        default: 'forget all learning data'
                    })
                },
                {
                    opcode: 'setIDName',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({id: 'huskylens.setIDName', default: 'set name of ID [id] to [name]'}),
                    arguments: {
                        id: {type: ArgumentType.NUMBER, defaultValue: 1},
                        name: {type: ArgumentType.STRING, defaultValue: 'DFRobot'}
                    }
                },
                {
                    opcode: 'showTextOnScreen',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'huskylens.showTextOnScreen',
                        default: 'show text [text] at x [x], y [y]'
                    }),
                    arguments: {
                        text: {type: ArgumentType.STRING, defaultValue: 'DFRobot'},
                        x: {type: ArgumentType.NUMBER, defaultValue: 150, min: 0, max: 319, precision: 1},
                        y: {type: ArgumentType.NUMBER, defaultValue: 30, min: 0, max: 210, precision: 1}
                    }
                },
                {
                    opcode: 'clearText',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({id: 'huskylens.clearText', default: 'clear all text from screen'})
                },
                {
                    opcode: 'takePhoto',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({id: 'huskylens.takePhoto', default: 'take a [type] and save it'}),
                    arguments: {
                        type: {type: ArgumentType.STRING, defaultValue: HUSKYLENSphoto.PHOTO, menu: 'photoTypeMenu'}
                    }
                },
                {
                    opcode: 'saveModelToSD',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'huskylens.saveModelToSD',
                        default: 'save current model as number [data]'
                    }),
                    arguments: {
                        data: {type: ArgumentType.NUMBER, defaultValue: 0, min: 0, max: 5, precision: 1}
                    }
                },
                {
                    opcode: 'loadModelFromSD',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'huskylens.saveModelToSD',
                        default: 'load number [data] model'
                    }),
                    arguments: {
                        data: {type: ArgumentType.NUMBER, defaultValue: 0, min: 0, max: 5, precision: 1}
                    }
                }
            ],
            menus: {
                algorithmMenu: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.face_rec',
                                default: 'face recognition'
                            }),
                            value: protocolAlgorithm.ALGORITHM_FACE_RECOGNITION.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.obj_trac',
                                default: 'object tracking'
                            }),
                            value: protocolAlgorithm.ALGORITHM_OBJECT_TRACKING.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.obj_rec',
                                default: 'object recognition'
                            }),
                            value: protocolAlgorithm.ALGORITHM_OBJECT_RECOGNITION.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.line_trac',
                                default: 'line tracking'
                            }),
                            value: protocolAlgorithm.ALGORITHM_LINE_TRACKING.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.color_rec',
                                default: 'color recognition'
                            }),
                            value: protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.tag_rec',
                                default: 'tag recognition'
                            }),
                            value: protocolAlgorithm.ALGORITHM_TAG_RECOGNITION.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.obj_class',
                                default: 'object classification'
                            }),
                            value: protocolAlgorithm.OBJECTCLASSIFICATION.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.qr_rec',
                                default: 'QR code recogmition (EDU only)'
                            }),
                            value: protocolAlgorithm.QRRECOGMITION.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.algorithm.bar_rec',
                                default: 'barcode recognition (EDU only)'
                            }),
                            value: protocolAlgorithm.BARCODERECOGNITION.toString()
                        }
                    ]
                },
                resultTypeMenu: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.resultTypeMenu.frame',
                                default: 'box'
                            }),
                            value: HUSKYLENSResultType_t.HUSKYLENSResultBlock.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.resultTypeMenu.arrow',
                                default: 'arrow'
                            }),
                            value: HUSKYLENSResultType_t.HUSKYLENSResultArrow.toString()
                        }
                    ]
                },
                resultTypeMenu2: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.resultTypeMenu2.frame',
                                default: 'boxes'
                            }),
                            value: HUSKYLENSResultType_t.HUSKYLENSResultBlock.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.resultTypeMenu2.arrow',
                                default: 'arrows'
                            }),
                            value: HUSKYLENSResultType_t.HUSKYLENSResultArrow.toString()
                        }
                    ]
                },
                parameterMenu1: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.xCenter',
                                default: 'X center'
                            }),
                            value: Content1.xCenter.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.yCenter',
                                default: 'Y center'
                            }),
                            value: Content1.yCenter.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.width',
                                default: 'width'
                            }),
                            value: Content1.width.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.height',
                                default: 'height'
                            }),
                            value: Content1.height.toString()
                        }
                    ]
                },
                parameterMenu2: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.xOrigin',
                                default: 'X beginning'
                            }),
                            value: Content2.xOrigin.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.yOrigin',
                                default: 'Y beginning'
                            }),
                            value: Content2.yOrigin.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.xTarget',
                                default: 'X endpoint'
                            }),
                            value: Content2.xTarget.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.yTarget',
                                default: 'Y endpoint'
                            }),
                            value: Content2.yTarget.toString()
                        }
                    ]
                },
                parameterMenu3: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu3.id',
                                default: 'ID'
                            }),
                            value: Content3.ID.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.xCenter',
                                default: 'X center'
                            }),
                            value: Content3.xCenter.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.yCenter',
                                default: 'Y center'
                            }),
                            value: Content3.yCenter.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.width',
                                default: 'width'
                            }),
                            value: Content3.width.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu1.height',
                                default: 'height'
                            }),
                            value: Content3.height.toString()
                        }
                    ]
                },
                parameterMenu4: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu3.id',
                                default: 'ID'
                            }),
                            value: Content4.ID.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.xOrigin',
                                default: 'X beginning'
                            }),
                            value: Content4.xOrigin.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.yOrigin',
                                default: 'Y beginning'
                            }),
                            value: Content4.yOrigin.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.xTarget',
                                default: 'X endpoint'
                            }),
                            value: Content4.xTarget.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.parameterMenu2.yTarget',
                                default: 'Y endpoint'
                            }),
                            value: Content4.yTarget.toString()
                        }
                    ]
                },
                photoTypeMenu: {
                    acceptReporters: false,
                    items: [
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.photoTypeMenu.photo',
                                default: 'photo'
                            }),
                            value: HUSKYLENSphoto.PHOTO.toString()
                        },
                        {
                            text: formatMessage({
                                id: 'huskylens.menu.photoTypeMenu.screen',
                                default: 'screenshot'
                            }),
                            value: HUSKYLENSphoto.SCREENSHOT.toString()
                        }
                    ]
                }
            }
        };
    }

    async selectAlgorithm (args) {
        await this.initMode(Number(args.algorithm));
    }

    async requestDataOnce () {
        await this.request();
    }

    getLearnedIDCount () {
        return this.getIds();
    }

    isObjectOnScreen (args) {
        return this.isAppear_s(Number(args.objectType));
    }

    getBoxNearCenter (args) {
        return this.readBox_s(Number(args.data));
    }

    getArrowNearCenter (args) {
        return this.readArrow_s(Number(args.data));
    }

    isIDLearned (args) {
        return this.isLearned(Number(args.id));
    }

    isIDObjectOnScreen (args) {
        return this.isAppear(Number(args.id), Number(args.objectType));
    }

    getBoxParamByID (args) {
        return this.readeBox(Number(args.id), Number(args.parameter));
    }

    getArrowParamByID (args) {
        return this.readeArrow(Number(args.if), Number(args.parameter));
    }

    getTotalCount (args) {
        return this.getBox(Number(args.objectType));
    }

    getNthBoxParam (args) {
        return this.readBox_ss(Number(args.index), Number(args.parameter));
    }

    getNthArrowParam (args) {
        return this.readArrow_ss(Number(args.index), Number(args.parameter));
    }

    getTotalByID (args) {
        return this.getBox_S(Number(args.id), Number(args.objectType));
    }

    getNthBoxParamByID (args) {
        return this.readeBox_index(Number(args.id), Number(args.index), Number(args.parameter));
    }

    getNthArrowParamByID (args) {
        return this.readeArrow_index(Number(args.id), Number(args.index), Number(args.parameter));
    }

    learnIDAuto (args) {
        this.writeLearn1(Number(args.id));
    }

    forgetAll () {
        this.forgetLearn();
    }

    setIDName (args) {
        this.writeName(Number(args.id), args.name);
    }

    showTextOnScreen (args) {
        this.writeOSD(args.text, Number(args.x), Number(args.y));
    }

    clearText () {
        this.clearOSD();
    }

    async takePhoto (args) {
        await this.takePhotoToSDCard(Number(args.type));
    }

    saveModelToSD (args) {
        this.saveModelToTFCard(HUSKYLENSMode.SAVE, Number(args.data));
    }

    loadModelFromSD (args) {
        this.saveModelToTFCard(HUSKYLENSMode.LOAD, Number(args.data));
    }
}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
