/**
 * This file was created from the https://github.com/PASCOscientific/pasco_python python library.
 * by rewriting the https://github.com/PASCOscientific/pasco_python/blob/master/src/pasco/pasco_ble_device.py file in javascript.
 * the datasheets.js file is the exact copy of the python file (datasheets.py)
 * LICENSE: https://github.com/PASCOscientific/pasco_python?tab=License-1-ov-file
 */
const datasheet = require('./datasheets.js');

class BLEConnectionError extends Error {}
class BLEAlreadyConnectedError extends Error {}
class DeviceNotConnected extends Error {}
// class MeasurementNotFound extends Error {}
// class InvalidParameter extends Error {}
// class SensorNotFound extends Error {}
// class InvalidEquation extends Error {}
// class CouldNotDecodeData extends Error {}
// class CommunicationError extends Error {}
class SensorSetupError extends Error {}

class PASCOBLEDevice {
    // PASCO Device object that has functions for connecting and getting data

    SENSOR_SERVICE_ID = 0;

    SEND_CMD_CHAR_ID = 2;
    RECV_CMD_CHAR_ID = 3;
    SEND_ACK_CHAR_ID = 5;

    GCMD_CUSTOM_CMD = 0x37;
    GCMD_READ_ONE_SAMPLE = 0x05;
    GCMD_XFER_BURST_RAM = 0X0E;

    // connection sequence commands for control Node
    CNTRLNODE_PLUGINS_CALLBACK = 0x82;
    CTRLNODE_CMD_DETECT_DEVICES = 8; // Detects which devices are attached
    GCMD_CONTROL_NODE_CMD = 0x37;

    GRSP_RESULT = 0XC0; // Generic response packet
    GEVT_SENSOR_ID = 0x82; // Get Sensor ID (for AirLink)

    WIRELESS_RMS_START = [0X37, 0X01, 0X00];

    constructor () {
        /*
        * Create a PASCO BLE Device object
        */

        this._device = null;
        this._address = null;
        this._name = null;
        this._serial_id = null;
        this._interface_id = null;
        this._airlink_sensor_id = null;
        this._type = 'BLE';
        this._data_ack_counter = {};

        // sensor and measurement data
        this._sensor_names = []; // {sensor name: sensor object}
        // this causes problems with multiple of the same sensor
        this._device_measurements = {}; // {sensor_channel: {measurementID: measurement attrs}}
        // stores measurements available through each sensor on the device
        this._handle_service = {}; // Array to lookup BLE service id with the handle
        this._data_stack = {}; // {sensor_channel: [data from sensor_channel]}
        // used to organize data packets by sensor channel as they come in
        this._data_packet = []; // [raw data]
        this._response_data = new Uint8Array(); // response_data holds the data from the device callback
        this._sensor_data = {}; // {sensor_channel: {measurementID: measurement value}}
        this._sensor_data_prev = {}; // {sensor_channel: {measurementID: measurement value previous}}
        this._rotary_pos_data = {}; // apparently unused.

        this._notify_sensor_id = null; // apparently unused.
        this._data_results = {}; // {measurement name: human-readable data}
        // stores sensor readings organized by measurement
        // this causes problems with multiple of the same sensor
        this._measurement_sensor_ids = {}; // {measurement name: sensor channel at which measurement can be requested}
        // This causes problems with multiple of the same sensor

        // Load Datasheet
        // it is saved as a string literal variable in datasheets.js
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(datasheet, 'application/xml');
        this._xml_root = xmlDoc;

        this._compatible_devices = [
            '//code.Node',
            'Accel Alt',
            'CO2',
            'Conductivity',
            '//control.Node',
            'Current',
            'Diffraction',
            'Drop Counter',
            'Force Accel',
            'Light',
            'Load Cell',
            'Mag Field',
            'Motion',
            'O2',
            'Optical DO',
            'pH',
            'Pressure',
            'Rotary Motion',
            'Smart Cart',
            'Temperature',
            'Voltage',
            'Weather'
        ];

        /*
        * this._not_compatible_devices = [
            'BP',
            'Smart Gate',
            'Sound',
            'EKG',
            'Melt Temp',
            'Moisture',
            'Colorimeter',
            'AC/DC Module',
            'LightSource',
            'STEM Module',
            'AirLink',
            'Geiger',
            'Spirometer',
            'CO',
        ]
        */
    }

    name () {
        return this._name;
    }

    serial_id () {
        return this._serial_id;
    }

    device () {
        return this._device;
    }

    address () {
        return this._address;
    }

    data_results () {
        return this._data_results;
    }

    device_sensors () {
        return this._sensor_names;
    }


    // ---------- Connecting ----------

    /**
     * @returns {Array<BluetoothRemoteGATTCharacteristic>} array of chars, that are notifiable
     */
    async _get_notify_uuids () {

        /**
         * @type {Array<BluetoothRemoteGATTCharacteristic>}
         */
        const _chars = [];

        const services = await this._device.gatt.getPrimaryServices();

        for (const service of services) {
            let chars = [];
            try {
                chars = await service.getCharacteristics();
            } catch (e) {
                continue;
            }
            for (const char of chars) {
                if (char.properties.notify) {
                    _chars.push(char);
                }
            }
        }

        return _chars;
    }


    async connect () {
        if (this._device !== null) {
            throw new BLEAlreadyConnectedError('Device already connected');
        }

        this._device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '00001800-0000-1000-8000-00805f9b34fb',
                '00001801-0000-1000-8000-00805f9b34fb',
                '0000180a-0000-1000-8000-00805f9b34fb',
                '4a5c0000-0000-0000-0000-5c1e741f1c00',
                '4a5c0001-0000-0000-0000-5c1e741f1c00'
            ]
        });

        try {
            await this._async_connect();
        } catch (e) {
            throw new BLEConnectionError('Could not connect to the sensor');
        }

        this._set_device_params(this._device);

        if (this._dev_type === 'Rotary Motion') {
            await this.write_await_callback(this.SENSOR_SERVICE_ID, this.WIRELESS_RMS_START);
        }

        this.initialize_device();
    }

    async _async_connect () {
        await this._device.gatt.connect();

        if (!this._device.gatt.connected) {
            throw new BLEConnectionError('device not connected');
        }

        this._set_handle_service();

        const chars = await this._get_notify_uuids();

        for (const char of chars) {
            char.addEventListener('characteristicvaluechanged', this._notify_callback.bind(this));
            await char.startNotifications();
        }
    }

    async keepalive () {
        await this.write_await_callback(this.SENSOR_SERVICE_ID, [0x00]);
    }

    is_connected () {

        if (this._device !== null) {
            return this._device.gatt.connected;
        }
        return false;
    }

    disconnect () {
        if (this._device !== null) {
            this._device.gatt.disconnect();
            this._device = null;
        }
    }

    // ---------- Initializing ----------


    async _set_handle_service () {
        // """ Create dictionary to to lookup serviceId given the ble device handle """

        const services = await this._device.gatt.getPrimaryServices();

        for (const service of services) {
            let chars = [];
            try {
                chars = await service.getCharacteristics();
            } catch (e) {
                continue;
            }
            for (const char of chars) {
                if (/^\d+$/.test(char.uuid.charAt(7))) {
                    this._handle_service[char.uuid] = Number(char.uuid.charAt(7));
                }
            }
        }
    }

    /**
     * @param {number} serviceId service id
     * @param {number} characteristicId char id
     * @returns {BluetoothCharacteristicUUID} the uuid
     */
    _set_uuid (serviceId, characteristicId) {
        const uuid = `4a5c000${String(serviceId)}-000${String(characteristicId)}-0000-0000-5c1e741f1c00`;
        return uuid;
    }

    scan_controlnode_plugins () {

        // Detect the devices that are attached to the control node.
        // This will trigger a cascading update of available control node sensors

        if (!this.is_connected()) {
            throw new DeviceNotConnected();
        }

        const cmd = [this.CTRLNODE_CMD_DETECT_DEVICES];
        return this.write_await_callback(this.SENSOR_SERVICE_ID, cmd);
    }

    initialize_device () {
        try {
            const interfaceNode = this._xml_root.querySelector(`Interfaces > Interface[ID='${this._interface_id}']`);
            if (!interfaceNode) {
                console.error('Interface not found!');
                return;
            }

            this._device_channels = Array.from(interfaceNode.querySelectorAll('Channel')).map(c => ({
                id: parseInt(c.getAttribute('ID'), 10),
                name: c.getAttribute('NameTag'),
                sensorId: c.hasAttribute('SensorID') ? parseInt(c.getAttribute('SensorID'), 10) : 0,
                type: c.getAttribute('Type'),
                output_type: c.getAttribute('OutputType') || '',
                measurements: [],
                total_data_size: 0,
                plug_detect: c.hasAttribute('PlugDetect') ? parseInt(c.getAttribute('PlugDetect'), 10) : 0,
                channel_id_tag: c.getAttribute('ChannelIDTag') || '',
                factory_cal_ids: []
            }));

            if (this._device_channels.some(device => device.plug_detect === 1)) {
                this.scan_controlnode_plugins();
            } else {
                this.initialize_device_sensors();
            }
        } catch (e) {
            throw new SensorSetupError();
        }
    }

    initialize_device_sensors (pluginSensorIds = null) {
        try {
            // FOR DEVICES WITH PLUGIN SENSORS (e.g. controlnode)
            // on callback from the "send plugin sensors" command change the appropriate
            // device channel's sensorId to the ID returned for that channel in the callback.
            // if no sensor ID is returned for that channel in the callback, then set sensorId to ''
            // Here I am assuming that the IDs in the callback are returned in sequential order of their channels
            // (they are for the control node)
            if (pluginSensorIds !== null) {
                for (let i = 0; i < this._device_channels.length; i++) {
                    if (this._device_channels[i].plug_detect) {
                        this._device_channels[i].sensorId = pluginSensorIds[i];
                    }
                }
            }

            // Iterate over channels on the interface
            for (const channel of this._device_channels) {
                // if the interface channel is for a sensor then initialize it
                if (channel.type === 'Pasport' && channel.sensorId !== 0) {
                    this._initialize_sensor(channel);
                }
            }

            // Initialize device measurement values
            // If the device channel has measurements then associate that measurement with its channel ID
            this._measurement_sensor_ids = {};
            this._device_channels.forEach(channel => {
                channel.measurements.forEach(measurement => {
                    this._measurement_sensor_ids[measurement] = channel.id;
                });
            });

            this._data_results = {};
            this._device_channels.forEach(sensor => {
                sensor.measurements.forEach(m => {
                    this._data_results[m] = null;
                });
            });

            this._sensor_names = {};
            this._device_channels.forEach(sensor => {
                this._sensor_names[sensor.name] = sensor;
            });

        } catch (e) {
            throw new SensorSetupError();
        }
    }

    /**
     * @param {Element} measurement the measurement
     * @returns {boolean} false if internal
     */
    _not_internal (measurement) {

        if (measurement.getAttribute('Internal')) {
            if (measurement.getAttribute('Internal') === '1') {
                return false;
            }
        } else if (measurement.getAttribute('InternalUnit')) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * @param {Element} measurement the measurement
     * @returns {boolean} false if derivative
     */
    _not_derivative (measurement) {
        return measurement.getAttribute('Type') !== 'Derivative';
    }


    _initialize_sensor (sensorChannel) {
        // initialize attributes associated with the channel
        this._data_ack_counter[sensorChannel.id] = 0;
        this._data_stack[sensorChannel.id] = [];
        this._device_measurements[sensorChannel.id] = {};

        const sensorData = this._xml_root.querySelector(`Sensors > Sensor[ID='${sensorChannel.sensorId}']`);
        if (!sensorData) return;

        // get name of sensor
        sensorChannel.name = sensorData.getAttribute('Tag');

        // get measurements that are not internal or derivative
        sensorChannel.measurements = Array.from(sensorData.querySelectorAll('Measurement'))
            .filter(m => this._not_internal(m) && this._not_derivative(m))
            .map(m => m.getAttribute('NameTag'));

        // get factory calibration IDs
        sensorChannel.factory_cal_ids = Array.from(sensorData.querySelectorAll("Measurement[Type='FactoryCal']"))
            .map(m => m.getAttribute('ID'));

        // collect attributes of all measurements
        Array.from(sensorData.querySelectorAll('Measurement')).forEach(measurement => {
            const mId = parseInt(measurement.getAttribute('ID'), 10);
            const attrib = {};
            Array.from(measurement.attributes).forEach(attr => {
                attrib[attr.name] = attr.value;
            }); // convert DOM attributes to object
            this._device_measurements[sensorChannel.id][mId] = attrib;
        });

        // fix types of measurement attributes
        Object.values(this._device_measurements[sensorChannel.id]).forEach(sensorM => {
            sensorM.ID = parseInt(sensorM.ID, 10);
            sensorM.Type = sensorM.Type || '';
            sensorM.Visible = sensorM.Visible ? parseInt(sensorM.Visible, 10) : 0;
            sensorM.Internal = sensorM.Internal ? parseInt(sensorM.Internal, 10) : 0;
            if (sensorM.DataSize) {
                sensorM.DataSize = parseInt(sensorM.DataSize, 10);
                sensorChannel.total_data_size = (sensorChannel.total_data_size || 0) + sensorM.DataSize;
            }
            if (sensorM.Inputs && !isNaN(sensorM.Inputs)) sensorM.Inputs = parseInt(sensorM.Inputs, 10);
            if (sensorM.Precision && !isNaN(sensorM.Precision)) sensorM.Precision = parseInt(sensorM.Precision, 10);

            // TODO: workaround for RawCartPosition
            if (sensorM.NameTag === 'RawCartPosition') sensorM.DataSize = 0;

            sensorM.Value = sensorM.Value ? sensorM.Value :
                (sensorM.Type === 'RotaryPos' ? 0 : null);
        });

        // handle duplicate sensors
        if (sensorChannel.measurements.length === 0) {
            this._device_channels.forEach(ch => {
                if (ch.sensorId === sensorChannel.sensorId && ch.measurements.length > 0) {
                    sensorChannel.measurements = ch.measurements;
                }
            });
        }

        // Initialize internal sensor measurement values
        this._sensor_data[sensorChannel.id] = {};
        Object.entries(this._device_measurements[sensorChannel.id]).forEach(([mId, m]) => {
            this._sensor_data[sensorChannel.id][mId] = m.Value;
        });
    }

    get_sensor_list () {
        if (!this.is_connected()) {
            throw new Error('DeviceNotConnected'); // TODO: implement custom error classes if needed
        }

        return Object.keys(this._sensor_names); // JS object keys instead of dict items
    }

    get_measurement_list (sensorName = null) {
        if (!this.is_connected()) {
            throw new Error('DeviceNotConnected');
        }

        if (sensorName && typeof sensorName !== 'string') {
            throw new Error('InvalidParameter');
        }

        let measurementList = [];

        if (!sensorName) {
            this._device_channels.forEach(sensor => {
                measurementList.push(...sensor.measurements);
            });
        } else if (sensorName in this._sensor_names) {
            measurementList = this._sensor_names[sensorName].measurements;
        } else {
            throw new Error('SensorNotFound');
        }

        return measurementList;
    }


    async read_factory_cal (sensorId) {
        let factoryCalCount = 0;
        for (const [_, m] of Object.entries(this._device_measurements[sensorId])) {
            if (m.Type === 'FactoryCal') {
                m.FactoryCalOrder = factoryCalCount;
                factoryCalCount += 1;
            }
        }

        if (factoryCalCount > 0) {
            const llRead = 128;
            const llStorage = 3;
            const ll = llRead + llStorage;
            const address = sensorId + 2;
            const numBytes = 16 * factoryCalCount;
            const serviceId = this.SENSOR_SERVICE_ID;

            const command = [
                this.GCMD_XFER_BURST_RAM, ll,
                address & 0xFF, (address >> 8) & 0xFF, (address >> 16) & 0xFF, (address >> 24) & 0xFF,
                numBytes & 0xFF, (numBytes >> 8) & 0xFF
            ];

            await this.write_await_callback(serviceId, command);

            const startCommand = [0x09, 0x01, numBytes & 0xFF, (numBytes >> 8) & 0xFF, 16];
            await this.write_await_callback(serviceId, startCommand);
        }
    }

    // ---------- Communicating ----------

    async _getCharacteristic (charUuid) {
        // Initialize map if not already
        if (!this._charMap) this._charMap = new Map();

        // Use a combined key for service+characteristic
        const key = `${charUuid}`;
        if (this._charMap.has(key)) {
            return this._charMap.get(key);
        }

        const services = await this._device.gatt.getPrimaryServices();

        let characteristic;

        for (const service of services) {
            try {
                characteristic = await service.getCharacteristic(charUuid);
                if (!characteristic) throw new Error(`Characteristic ${charUuid} not found`);
                break;
            } catch (e) {
                continue;
            }
        }

        if (!characteristic) throw new Error(`Characteristic ${charUuid} not found`);

        // Cache it in the map
        this._charMap.set(key, characteristic);
        return characteristic;
    }


    async _send_ack (serviceId, command) {
        const uuid = this._set_uuid(serviceId, this.SEND_ACK_CHAR_ID);

        try {
            const characteristic = await this._getCharacteristic(uuid);
            await characteristic.writeValue(Uint8Array.from(command));
        } catch (e) {
            throw new Error('CommunicationError');
        }
    }

    async write (serviceId, command) {
        const uuid = this._set_uuid(serviceId, this.SEND_CMD_CHAR_ID);

        try {
            const characteristic = await this._getCharacteristic(uuid);
            await characteristic.writeValue(Uint8Array.from(command));
        } catch (e) {
            throw new Error('CommunicationError');
        }
    }

    /**
     * @param {BluetoothDevice} bleDevice the device
     */
    _set_device_params (bleDevice) {
        this._address = bleDevice.id; // JS uses id instead of address
        const nameParts = bleDevice.name.split(' ');
        this._dev_type = nameParts.slice(0, -1).join(' '); // all but last part
        this._serial_id = nameParts[nameParts.length - 1].slice(0, 7);
        this._name = `${this._dev_type} ${this._serial_id}`;

        this._interface_id = this._decode64(nameParts[nameParts.length - 1][8]) + 1024;
    }


    async process_measurement_response (sensorId, data) {
        if (data[0] <= 0x1F) {
            this._data_stack[sensorId].push(...data.slice(1));
            this._data_ack_counter[sensorId] += 1;

            this._decode_data(sensorId);

            if (this._data_ack_counter[sensorId] > 8) {
                try {
                    this._data_ack_counter[sensorId] = 0;
                    const serviceId = sensorId + 1;
                    const command = [data[0]];
                    await this._send_ack(serviceId, command);
                } catch {
                    throw new Error('CommunicationError');
                }
            }
            return;
        } else if (data[0] === this.CNTRLNODE_PLUGINS_CALLBACK) {
            this.update_controlnode_plugin_sensor(data);
        } else if (data[0] === this.GRSP_RESULT) {
            if (data[1] === 0x00) {
                if (data[2] === this.GCMD_READ_ONE_SAMPLE) {
                    this._data_packet = data.slice(3);
                } else if (data[2] === 1) {
                    const pasportServiceId = 1;
                    await this.write_await_callback(pasportServiceId, [0x08]);
                }
            }
        } else if (data[0] === this.GEVT_SENSOR_ID) {
            this._airlink_sensor_id = data[1];
        }
    }

    update_controlnode_plugin_sensor (data) {
        const dv = new DataView(Uint8Array.from(data).buffer);
        const sensorIds = [
            dv.getInt16(1, true), // x=1 offset for '<xhhh' format
            dv.getInt16(3, true),
            dv.getInt16(5, true)
        ];

        this.initialize_device_sensors(sensorIds);
    }

    process_device_response (data) {
        this._response_data = data;

        if (data[0] === this.GRSP_RESULT) {
            if (data[1] === 0x00) {
                if (data[2] === this.GCMD_READ_ONE_SAMPLE || data[2] === this.GCMD_CONTROL_NODE_CMD) {
                    this._data_packet = data.slice(3);
                }
            }
        } else if (data[0] === 0x0A) {
            this._factory_calibrate(data);
        } else if (data[0] === 0x0B) {
            this._notify_sensor_id = null;
        }
    }

    _factory_calibrate (data) {
        const factoryCalParams = {};
        factoryCalParams[data[1]] = [];
        const numParams = 4;
        const byteLen = 4;
        const calData = Array.from(data.slice(2));

        for (let p = 0; p < numParams; p++) {
            let byteValue = 0;
            for (let d = 0; d < byteLen; d++) {
                const stackValue = calData.shift(); // pop from front
                byteValue += stackValue * (2 ** (8 * d));
            }
            const param = this._binary_float(byteValue, byteLen);
            factoryCalParams[data[1]].push(param);
        }

        const sensorMeasures = this._device_measurements[this._notify_sensor_id];
        for (const mId in sensorMeasures) {
            const m = sensorMeasures[mId];
            if ('FactoryCalOrder' in m && m.FactoryCalOrder in factoryCalParams) {
                m.FactoryCalParams = factoryCalParams[m.FactoryCalOrder];
            }
        }
    }

    /**
     * @param {Event} event the event
     */
    async _notify_callback (event) {
        /**
         * @type {BluetoothRemoteGATTCharacteristic}
         */
        const characteristic = event.target;
        const handle = characteristic.uuid;
        const data = characteristic.value;

        const byteArray = Array.from(
            new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        );

        try {
            if (this._handle_service[handle] > 0) {
                const sensorId = this._handle_service[handle] - 1;
                await this.process_measurement_response(sensorId, byteArray);
            } else if (this._handle_service[handle] === this.SENSOR_SERVICE_ID) {
                this.process_device_response(byteArray);
            }
        } catch (e) {
            console.warn(e);
        }

        if ([0xC0, 0x82].includes(data.getUint8(0))) {
            if (this._pendingNotification) {
                this._pendingNotification.resolve();
                this._pendingNotification = null;
            }
        }
    }

    async write_await_callback (serviceId, oneShotCmd) {
        // In JS, await both the write and the "callback"
        await this.write(serviceId, oneShotCmd);

        return new Promise((resolve, reject) => {
            // Save resolve function to call later in _notify_callback
            this._pendingNotification = {resolve};
            // Optional: add a timeout to reject if no notification arrives
            setTimeout(() => reject(new Error('Notification timeout')), 5000);
        });
    }

    // ---------- Reading data --------

    async read_data (measurement) {
        if (!this.is_connected()) throw new Error('DeviceNotConnected');
        if (!measurement || typeof measurement !== 'string') throw new Error('InvalidParameter');

        const sensorId = this._measurement_sensor_ids[measurement];
        if (sensorId) throw new Error('MeasurementNotFound');

        // Request and decode sensor measurements
        await this._get_sensor_measurements(sensorId);

        return this._data_results[measurement];
    }


    async read_data_list (measurements) {
        if (!this.is_connected()) throw new Error('DeviceNotConnected');
        if (!Array.isArray(measurements)) throw new Error('InvalidParameter');
        for (const m of measurements) if (typeof m !== 'string') throw new Error('InvalidParameter');

        const sensorIds = new Set();
        for (const m of measurements) {
            const sensorId = this._measurement_sensor_ids[m];
            if (sensorId) throw new Error('MeasurementNotFound');
            sensorIds.add(sensorId);
        }

        for (const sensorId of sensorIds) {
            await this._get_sensor_measurements(sensorId);
        }

        const measurementData = {};
        for (const m of measurements) measurementData[m] = this._data_results[m];
        return measurementData;
    }


    get_measurement_unit (measurement) {
        if (!this.is_connected()) throw new Error('DeviceNotConnected');
        if (!measurement || typeof measurement !== 'string') throw new Error('InvalidParameter');

        const sensorId = this._measurement_sensor_ids[measurement];
        if (sensorId) throw new Error('InvalidParameter');

        for (const mId in this._device_measurements[sensorId]) {
            const m = this._device_measurements[sensorId][mId];
            if (m.NameTag === measurement) return m.UnitType;
        }
        return null;
    }


    get_measurement_unit_list (measurements) {
        if (!this.is_connected()) throw new Error('DeviceNotConnected');
        if (!Array.isArray(measurements)) throw new Error('InvalidParameter');

        const sensorIds = new Set();
        for (const m of measurements) {
            const sensorId = this._measurement_sensor_ids[m];
            if (sensorId) throw new Error('InvalidParameter');
            sensorIds.add(sensorId);
        }

        const oneShotCmd = {};
        for (const sensorId of sensorIds) {
            for (const mId in this._device_measurements[sensorId]) {
                const m = this._device_measurements[sensorId][mId];
                for (const measurement of measurements) {
                    if (m.NameTag === measurement) oneShotCmd[measurement] = m.UnitType;
                }
            }
        }

        return oneShotCmd;
    }

    async _request_sensor_data (sensorId) {
        const serviceId = sensorId + 1;
        const sensor = this._device_channels.find(s => s.id === sensorId);
        if (!sensor) throw new Error('SensorNotFound');

        const packetSize = sensor.total_data_size;
        const oneShotCmd = [this.GCMD_READ_ONE_SAMPLE, packetSize];

        await this.write_await_callback(serviceId, oneShotCmd);
    }


    async _get_sensor_measurements (sensorId) {
        await this._request_sensor_data(sensorId);
        this._data_stack[sensorId] = this._data_packet;
        this._decode_data(sensorId);
    }

    // ---------- Processing ----------

    _decode64 (charVal) {
        if (charVal >= '0' && charVal <= '9') return charVal.charCodeAt(0) - '0'.charCodeAt(0);
        else if (charVal >= 'K' && charVal <= 'Z') return charVal.charCodeAt(0) - 'A'.charCodeAt(0);
        else if (charVal >= 'A' && charVal <= 'J') return charVal.charCodeAt(0) - 'A'.charCodeAt(0) + 26;
        else if (charVal >= 'a' && charVal <= 'z') return charVal.charCodeAt(0) - 'a'.charCodeAt(0) + 36;
        else if (charVal === '*') return 62;
        else if (charVal === '#') return 63;
        return -1; // invalid character
    }


    _twos_comp (value, byteLen) {
        const bitLen = byteLen * 8;
        if (value && value > (1 << (bitLen - 1))) return value - (1 << bitLen);
        return value;
    }

    _binary_fraction (value) {
        return (value >> 16) + ((value & 0xFFFF) / (2 ** 16));
    }

    _binary_float (value, byteLen) {
        const bitLen = byteLen * 8;
        const sign = (value >> 31) === 0 ? 1 : -1;
        const exp = (value >> (bitLen - 9)) & 0xFF;
        const mantissa = exp === 0 ? value & 0x7FFFFFFF : (value & 0xFFFFFF) | 0x800000;

        return sign * mantissa * (2 ** (exp - 150));
    }

    _calc_4_params (raw, x1, y1, x2, y2) {
        const b = ((x1 * y2) - (x2 * y1)) / (x1 - x2);
        let m;
        if (x1 !== 0) m = (y1 - b) / x1;
        if (x2 !== 0) m = (y2 - b) / x2;
        return (m * raw) + b;
    }


    _limit (num, minimum, maximum) {
        return Math.max(Math.min(num, maximum), minimum);
    }

    _calc_linear_params (raw, m, b) {
        return (m * raw) + b;
    }

    _calc_rotary_pos (count, x, r) {
        return (count * x) / r;
    }

    _decode_auto_id_packet (sensorId) {
        const plugCount = this._device_channels.filter(sensor => sensor.plug_detect === 1).length;
        const results = [];

        const stack = this._data_stack[sensorId] || [];
        for (let i = 0; i < plugCount; i++) {
            let byteValue = 0;
            for (let d = 0; d < 2; d++) {
                if (stack.length === 0) break; // prevent popping from empty array
                const stackValue = stack.shift(); // pop front of array
                byteValue += stackValue * (2 ** (8 * d));
            }
            results.push(byteValue);
        }

        return results;
    }


    _decode_data (sensorId) {
        try {
            // Copy previous data
            this._sensor_data_prev[sensorId] = {...this._sensor_data[sensorId]};

            for (const mId in this._device_measurements[sensorId]) {
                const rawM = this._device_measurements[sensorId][mId];
                let resultValue = null;

                if (rawM.Type === 'RawDigital') {
                    let byteValue = 0;
                    for (let d = 0; d < rawM.DataSize; d++) {
                        if ((this._data_stack[sensorId] || []).length === 0) break;
                        const stackValue = this._data_stack[sensorId].shift();
                        byteValue += stackValue * (2 ** (8 * d));
                        resultValue = byteValue;
                    }
                    if (rawM.DataSize === 4 || (rawM.TwosComp && parseInt(rawM.TwosComp, 10) === 1)) {
                        resultValue = this._twos_comp(resultValue, rawM.DataSize);
                    }
                } else if (rawM.Type === 'Direct') {
                    let byteValue = 0;
                    for (let d = 0; d < rawM.DataSize; d++) {
                        if ((this._data_stack[sensorId] || []).length === 0) break;
                        const stackValue = this._data_stack[sensorId].shift();
                        byteValue += stackValue * (2 ** (8 * d));
                    }
                    if (rawM.DataSize === 4) byteValue = this._twos_comp(byteValue, rawM.DataSize);
                    resultValue = this._binary_fraction(byteValue);
                    if (rawM.Precision) resultValue = +resultValue.toFixed(rawM.Precision);
                } else if (rawM.Type === 'Constant') {
                    resultValue = parseFloat(rawM.Value);
                    if (rawM.Precision) resultValue = +resultValue.toFixed(rawM.Precision);
                }

                this._sensor_data[sensorId][mId] = resultValue;
            }

            // This calculates every measurement available at the sensor, not just the measurement requested.
            // Every time you ping a sensor it updates all measurements available from that sensor.
            // It has to do this because many measurements are derived from others
            // (i.e. VWCLoam derived from RawMoisture)
            for (const [mId, m] of Object.entries(this._device_measurements[sensorId])) {
                if (this._sensor_data[sensorId][mId] === null) {
                    let resultValue = this._get_measurement_value(sensorId, mId);

                    if ('Precision' in m && resultValue !== null) {
                        resultValue = Number(resultValue.toFixed(m.Precision));
                    }

                    if ('Limits' in m && resultValue !== null) {
                        const limits = m.Limits.split(',').map(Number);
                        resultValue = this._limit(resultValue, limits[0], limits[1]);
                    }
                    this._sensor_data[sensorId][mId] = resultValue;
                }
            }

            // Update visible data results
            for (const mId in this._device_measurements[sensorId]) {
                const m = this._device_measurements[sensorId][mId];
                if (m.Visible === 1 && this._sensor_data[sensorId][mId] !== null) {
                    this._data_results[m.NameTag] = this._sensor_data[sensorId][mId];
                }
            }
        } catch (err) {
            throw new Error('CouldNotDecodeData');
        }
    }

    _get_measurement_value (sensorId, measurementId) {
        const m = this._device_measurements[sensorId][measurementId];
        let resultValue = null;

        if (m.Type === 'RawDigital' && this._sensor_data[sensorId][measurementId] === null) {
            // do nothing
        }

        if ('Inputs' in m) {
            resultValue = this._calculate_with_input(m, sensorId);
        }

        if ('Equation' in m) {
            resultValue = this._calculate_with_equation(m, sensorId);
        }

        return resultValue;
    }

    _calculate_with_input (m, sensorId) {
        if (m.Type === 'ThreeInputVector') {
            const inputs = m.Inputs.split(',');
            if (inputs.some(i => this._sensor_data[sensorId][parseInt(i, 10)] === null)) return null;
            const ax = this._sensor_data[sensorId][parseInt(inputs[0], 10)];
            const ay = this._sensor_data[sensorId][parseInt(inputs[1], 10)];
            const az = this._sensor_data[sensorId][parseInt(inputs[2], 10)];
            return Math.sqrt((ax ** 2) + (ay ** 2) + (az ** 2));
        } else if (m.Type === 'Select') {
            const needInput = parseInt(m.Inputs.split(',')[0], 10);
            return this._sensor_data[sensorId][needInput] ?
                this._sensor_data[sensorId][needInput] :
                this._get_measurement_value(sensorId, needInput);
        }
        const needInput = parseInt(m.Inputs, 10);
        const inputValue = this._sensor_data[sensorId][needInput] ?
            this._sensor_data[sensorId][needInput] :
            this._get_measurement_value(sensorId, needInput);

        if (inputValue === null) return null;

        if (m.Type === 'UserCal' || m.Type === 'FactoryCal') {
            const params = (m.FactoryCalParams || m.Params.split(',')).map(Number);
            return this._calc_4_params(inputValue, params[0], params[1], params[2], params[3]);
        } else if (m.Type === 'LinearConv') {
            const [slope, intercept] = m.Params.split(',').map(Number);
            return this._calc_linear_params(inputValue, slope, intercept);
        } else if (m.Type === 'Derivative') {
            const prev = this._sensor_data_prev[sensorId][m.Inputs];
            return prev ? (inputValue - prev) / 2 : null;
        } else if (m.Type === 'RotaryPos') {
            const [x, r] = m.Params.split(',').map(Number);
            m.Value += this._calc_rotary_pos(inputValue, x, r);
            return m.Value;
        }

    }

    _calculate_with_equation (m, sensorId) {
        let rawEquation = m.Equation;

        // find variables like [0], [12], etc.
        const eqnVariables = [...rawEquation.matchAll(/\[([0-9_]+)\]/g)];

        for (const match of eqnVariables) {
            const eVar = match[1];
            const bracketVal = `[${eVar}]`;
            const eVarKey = parseInt(eVar, 10);

            rawEquation = rawEquation.replace(/\^/g, '**'); // python ^ -> JS **

            // replace variable with value
            let replaceWith;
            if (this._sensor_data[sensorId][eVarKey]) {
                replaceWith = this._sensor_data[sensorId][eVarKey].toString();
            } else {
                replaceWith = this._get_measurement_value(sensorId, eVarKey).toString();
            }
            rawEquation = rawEquation.replace(bracketVal, replaceWith);
        }

        // table lookup
        if (rawEquation.startsWith('table')) {
            return this._equation_eval_table(rawEquation);
        }

        // parentheses handling
        for (const [_, eqn] of this.parenthetic_contents(rawEquation)) {
            if (eqn.startsWith('limit')) {
                const limitEqn = eqn.replace('limit(', '').replace(')', '');
                let [val, minVal, maxVal] = limitEqn.split(',').map(parseFloat);
                val = Math.max(Math.min(val, maxVal), minVal);
                rawEquation = rawEquation.replace(eqn, val.toString());
            }
            // TODO: Add other equations like atan2, sqrt, etc.
        }

        if (rawEquation.startsWith('usound')) {
            const [pingEchoTime, speedOfSound] = rawEquation.replace('usound(', '').replace(')', '')
                .split(',')
                .map(parseFloat);
            return (pingEchoTime / 1_000_000) * speedOfSound / 2; // meters
        } else if (rawEquation.startsWith('dewpoint')) {
            let [tempC, relativeHumidity] = rawEquation.replace('dewpoint(', '').replace(')', '')
                .split(',');
            if (tempC !== 'None') {
                tempC = parseFloat(tempC);
                relativeHumidity = parseFloat(relativeHumidity);
                const vaporPressureSat = 6.11 * (10 ** ((7.5 * tempC) / (237.7 + tempC)));
                const vaporPressureActual = (relativeHumidity * vaporPressureSat) / 100;
                return (-443.22 + (237.7 * Math.log(vaporPressureActual))) / (-Math.log(vaporPressureActual) + 19.08);
            }
        } else if (rawEquation.startsWith('windchill')) {
            const [tempC, windMps] = rawEquation.replace('windchill(', '').replace(')', '')
                .split(',')
                .map(parseFloat);
            if (tempC !== null && windMps !== null) {
                const tempF = (9 * tempC / 5) + 32;
                const windMph = windMps * 2.237;
                let windChillF;
                if (windMph < 3.0 || tempF > 50.0) windChillF = tempF;
                else {
                    windChillF =
                        35.74 + (0.6215 * tempF) - (35.75 * (windMph ** 0.16)) + (0.4275 * tempF * (windMph ** 0.16));
                }
                return 5 * (windChillF - 32) / 9;
            }
        } else if (rawEquation.startsWith('heatindex')) {
            const [tempC, relativeHumidity] = rawEquation.replace('heatindex(', '').replace(')', '')
                .split(',')
                .map(parseFloat);
            const vaporPressureSat = 6.11 * (10 ** ((7.5 * tempC) / (237.7 + tempC)));
            const vaporPressureActual = (relativeHumidity * vaporPressureSat) / 100;
            return tempC + (0.55555 * (vaporPressureActual - 10.0));
        } else if (rawEquation.startsWith('codenodepos')) {
            return null; // placeholder
        } else {
            try {
                rawEquation = rawEquation.replace(/sqrt/g, 'Math.sqrt')
                    .replace(/atan2/g, 'Math.atan2')
                    .replace(/log/g, 'Math.log10');
                if (rawEquation.includes('None')) return null;
                return Function(`return ${rawEquation}`)(); // safer than eval
            } catch {
                throw new Error('InvalidEquation: Error decoding the raw data');
            }
        }
    }

    _equation_eval_table (rawEquation) {
        const trimmed = rawEquation.slice(6, -1); // remove "table(" and ")"
        let elements = trimmed.split(',');
        const x = Function(`return ${elements.shift()}`)(); // evaluate x

        elements = elements.map(Number);
        const points = [];
        while (elements.length > 0) {
            points.push([elements.shift(), elements.shift()]);
        }

        return this.linear_interpolate(x, points);
    }

    linear_interpolate (x, points) {
        let xi; let yi; let xNext; let yNext;
        for (let i = 0; i < points.length - 1; i++) {
            [xi, yi] = points[i];
            [xNext, yNext] = points[i + 1];
            if (xi <= x && x <= xNext) break;
        }

        if (x < points[0][0]) {
            [xi, yi] = points[0];
            [xNext, yNext] = points[1];
        } else if (x > points[points.length - 1][0]) {
            [xi, yi] = points[points.length - 2];
            [xNext, yNext] = points[points.length - 1];
        }

        return ((yNext - yi) / (xNext - xi) * (x - xi)) + yi;
    }


    *parenthetic_contents (string) {
        const stack = [];
        for (let i = 0; i < string.length; i++) {
            const c = string[i];
            if (c === '(') stack.push(i);
            else if (c === ')' && stack.length > 0) {
                const start = stack.pop();
                yield [stack.length, string.slice(start + 1, i)];
            }
        }
    }
}

module.exports = PASCOBLEDevice;
