const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
// const BLE = require('../root/ble-llk.js');
// const Base64Util = require('../../util/base64-util');
// const RateLimiter = require('../../util/rateLimiter.js');
const PASCOBLEDevice = require('./pasco_ble_device');

// /**
//  * A time interval to wait (in milliseconds) while a block that sends a BLE message is running.
//  * @type {number}
//  */
// const BLESendInterval = 100;

// /**
//  * A maximum number of BLE message sends per second, to be enforced by the rate limiter.
//  * @type {number}
//  */
// const BLESendRateMax = 20;

class Scratch3PascoBlocks {

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'pasco';
    }

    /**
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * @type {Array<PASCOBLEDevice>}
         */
        this.devices = [];

        runtime.peripheralExtensions[Scratch3PascoBlocks.EXTENSION_ID] = this;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3PascoBlocks.EXTENSION_ID,
            name: 'Pasco',
            blocks: [
                {
                    func: 'CONNECT_PASCO',
                    text: 'Connect a device',
                    blockType: BlockType.BUTTON
                },
                {
                    opcode: 'readTemp',
                    text: 'temperature (˚C)',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'readData',
                    text: 'read data [val]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        val: {defaultValue: 'Temperature', type: ArgumentType.STRING}
                    }
                }
            ]
        };
    }

    connectToDevice () {
        return this.connect();
    }

    async connect () {
        try {
            if (this.devices.length !== 0) {
                this.devices.forEach(d => d.disconnect());
                this.devices = [];
            }
            const device = new PASCOBLEDevice();

            await device.connect();

            if (!device.is_connected()) {
                return false;
            }

            this.devices.push(device);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    readTemp () {
        if (this.devices.length === 0) {
            return null;
        }
        try {
            return this.devices[0].read_data('Temperature');
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    readData (args) {
        if (this.devices.length === 0) {
            return null;
        }
        try {
            return this.devices[0].read_data(args.val);
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}

module.exports = Scratch3PascoBlocks;
