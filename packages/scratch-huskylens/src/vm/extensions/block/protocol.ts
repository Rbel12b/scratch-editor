/**
 * @file huskylens.ts
 * @brief Modified version of DFRobot's HuskyLens MakeCode library.
 *
 * This is a modified and extended version of the original HuskyLens library by DFRobot.
 * Significant changes have been made to support integration with the scratch runtime and the MicroBit-more scartch extension.
 *
 * Original library:
 *   https://github.com/DFRobot/pxt-DFRobot_HuskyLens
 *   HuskyLens is an AI vision sensor with built-in features like face recognition, object tracking,
 *   object and color recognition, line tracking, and QR code reading. It aims to simplify AI training
 *   and vision processing.
 *
 * Original author: Jie Tang (jie.tang@dfrobot.com)
 * Original date: 2020-03-17
 *
 * Modifications by: Rbel12b
 * Modification date: 2025-08
 *
 * Copyright (c) 2025 Rbel12b
 * Based on code by DFRobot (http://www.dfrobot.com)
 *
 * @license MIT Lesser General Public License (see original repository for full license text)
 */

// @ts-ignore
import Base64Util from '../../util/base64-util';

const MM_SERVICE = {
    ID: '0b50f3e4-607f-4151-9091-7d008d6ffc5c',
    WRITE_CH: '0b500140-607f-4151-9091-7d008d6ffc5c',
    READ_CH: '0b500141-607f-4151-9091-7d008d6ffc5c',
    STATUS_CH: '0b500142-607f-4151-9091-7d008d6ffc5c'
};

const FRAME_BUFFER_SIZE = 128;
const HEADER_0_INDEX = 0;
const HEADER_1_INDEX = 1;
const ADDRESS_INDEX = 2;
const CONTENT_SIZE_INDEX = 3;
const COMMAND_INDEX = 4;
const CONTENT_INDEX = 5;
const PROTOCOL_SIZE = 6;

export enum Content1 {
    xCenter = 1,
    yCenter = 2,
    width = 3,
    height = 4
}

export enum Content2 {
    xOrigin = 1,
    yOrigin = 2,
    xTarget = 3,
    yTarget = 4
}

export enum Content3 {
    ID = 5,
    xCenter = 1,
    yCenter = 2,
    width = 3,
    height = 4
}

export enum Content4 {
    ID = 5,
    xOrigin = 1,
    yOrigin = 2,
    xTarget = 3,
    yTarget = 4

}

export enum HUSKYLENSResultType_t {
    HUSKYLENSResultBlock = 1,
    HUSKYLENSResultArrow = 2,
}

let FIRST = {
    first: -1,
    xCenter: -1,
    xOrigin: -1,
    protocolSize: -1,
    algorithmType: -1,
    requestID: -1,
};

export enum HUSKYLENSMode {
    SAVE,
    LOAD,
}
export enum HUSKYLENSphoto {
    PHOTO,
    SCREENSHOT
}
enum protocolCommand {
    COMMAND_REQUEST = 0x20,
    COMMAND_REQUEST_BLOCKS = 0x21,
    COMMAND_REQUEST_ARROWS = 0x22,
    COMMAND_REQUEST_LEARNED = 0x23,
    COMMAND_REQUEST_BLOCKS_LEARNED = 0x24,
    COMMAND_REQUEST_ARROWS_LEARNED = 0x25,
    COMMAND_REQUEST_BY_ID = 0x26,
    COMMAND_REQUEST_BLOCKS_BY_ID = 0x27,
    COMMAND_REQUEST_ARROWS_BY_ID = 0x28,
    COMMAND_RETURN_INFO = 0x29,
    COMMAND_RETURN_BLOCK = 0x2A,
    COMMAND_RETURN_ARROW = 0x2B,
    COMMAND_REQUEST_KNOCK = 0x2C,
    COMMAND_REQUEST_ALGORITHM = 0x2D,
    COMMAND_RETURN_OK = 0x2E,
    COMMAND_REQUEST_LEARN = 0x2F,
    COMMAND_REQUEST_FORGET = 0x30,
    COMMAND_REQUEST_SENSOR = 0x31,
}

export enum protocolAlgorithm {
    ALGORITHM_FACE_RECOGNITION = 0,
    ALGORITHM_OBJECT_TRACKING = 1,
    ALGORITHM_OBJECT_RECOGNITION = 2,
    ALGORITHM_LINE_TRACKING = 3,
    ALGORITHM_COLOR_RECOGNITION = 4,
    ALGORITHM_TAG_RECOGNITION = 5,
    OBJECTCLASSIFICATION,
    QRRECOGMITION,
    BARCODERECOGNITION,
}

interface BLEInterface {
    startNotifications(serviceId: string, characteristicId: string, callback: (value: any) => void): Promise<void>;
    write(serviceId: string, characteristicId: string, data: string, encoding: string, response: boolean): Promise<void>;
    handleDisconnectError(error: unknown): void;
}

interface MbitMore {
    isConnected(): boolean;
    _ble: BLEInterface;
    bleBusy: boolean;
    bleAccessWaiting: boolean;
    bleBusyTimeoutID: number;
}


export class HuskylensProtocol {
    mbitMore: MbitMore;
    readLen: number = 0;
    waitingForRead: boolean = false;
    readBuf: Uint8Array = new Uint8Array(0);
    connected: boolean = false;

    protocolPtr: number[][] = [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0]]
    Protocol_t: number[] = [0, 0, 0, 0, 0, 0]
    i = 1;
    send_index = 0;
    receive_index = 0;

    COMMAND_REQUEST = 0x20;

    receive_buffer: number[] = [];
    send_buffer: number[] = [];
    buffer: number[] = [];

    send_fail = false;
    receive_fail = false;
    content_current = 0;
    content_end = 0;
    content_read_end = false;

    command: number = 0;
    content: number = 0;

    constructor(runtime: any) {
        if (runtime.peripheralExtensions.microbitMore) {
            this.mbitMore = runtime.peripheralExtensions.microbitMore;
        } else {
            throw Error('microbit-more extension not found');
        }
        runtime.registerPeripheralExtension('huskylens', this.mbitMore);
    }

    /**
     * HuskyLens init I2C until success
     */
    initI2c(): void {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        while (!this.readKnock());
    }

    /**
     * HuskyLens change mode algorithm until success.
     */
    async initMode(mode: protocolAlgorithm) {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        this.writeAlgorithm(mode, protocolCommand.COMMAND_REQUEST_ALGORITHM);

        const start = Date.now();
        while (true) {
            if (await this.wait(protocolCommand.COMMAND_RETURN_OK)) {
                break;
            }
            if (Date.now() - start > 500) {
                // Timeout after 0.5s
                break;
            }
        }
    }

    /**
     * HuskyLens requests data and stores it in the result.
     */
    async request(): Promise<void> {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        this.protocolWriteCommand(protocolCommand.COMMAND_REQUEST);
        await this.processReturn();
    }
    /**
     * HuskyLens get the number of the learned ID from result.
     */
    getIds(): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        return this.Protocol_t[2];
    }
    /**
     * The box or arrow HuskyLens got from result appears in screen?
     */
    isAppear_s(Ht: HUSKYLENSResultType_t): boolean {
        if (!this.mbitMore.isConnected()) {
            return false;
        }
        switch (Ht) {
            case 1:
                return this.countBlocks_s() != 0 ? true : false;
            case 2:
                return this.countArrows_s() != 0 ? true : false;
            default:
                return false;
        }
    }
    /**
     * HuskyLens get the parameter of box near the screen center from result.
     */
    readBox_s(data: Content3): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_x
        let hk_y = this.readBlockCenterParameterDirect();
        if (hk_y != -1) {
            switch (data) {
                case 1:
                    hk_x = this.protocolPtr[hk_y][1]; break;
                case 2:
                    hk_x = this.protocolPtr[hk_y][2]; break;
                case 3:
                    hk_x = this.protocolPtr[hk_y][3]; break;
                case 4:
                    hk_x = this.protocolPtr[hk_y][4]; break;
                default:
                    hk_x = this.protocolPtr[hk_y][5];
            }
        }
        else hk_x = -1
        return hk_x;
    }
    /**
     * HuskyLens get the parameter of arrow near the screen center from result.
     */
    readArrow_s(data: Content4): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_x
        let hk_y = this.readArrowCenterParameterDirect()
        if (hk_y != -1) {
            switch (data) {
                case 1:
                    hk_x = this.protocolPtr[hk_y][1]; break;
                case 2:
                    hk_x = this.protocolPtr[hk_y][2]; break;
                case 3:
                    hk_x = this.protocolPtr[hk_y][3]; break;
                case 4:
                    hk_x = this.protocolPtr[hk_y][4]; break;
                default:
                    hk_x = this.protocolPtr[hk_y][5];
            }
        } else hk_x = -1
        return hk_x;
    }
    /**
     * The ID Huskylens got from result has been learned before?
     * @param id to id ,eg: 1
     */
    isLearned(id: number): boolean {
        if (!this.mbitMore.isConnected()) {
            return false;
        }
        let hk_x = this.countLearnedIDs();
        if (id <= hk_x) return true;
        return false;
    }
    /**
     * The box or arrow corresponding to ID obtained by HuskyLens from result appears in screen？
     * @param id to id ,eg: 1
     */
    isAppear(id: number, Ht: HUSKYLENSResultType_t): boolean {
        if (!this.mbitMore.isConnected()) {
            return false;
        }
        switch (Ht) {
            case 1:
                return this.countBlocks(id) != 0 ? true : false;
            case 2:
                return this.countArrows(id) != 0 ? true : false;
            default:
                return false;
        }
    }
    /**
     * HuskyLens get the parameter of the box corresponding to ID from result.
     * @param id to id ,eg: 1
     */
    readeBox(id: number, number1: Content1): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_y = this.cycle_block(id, 1);
        let hk_x = 0;
        if (this.countBlocks(id) != 0) {
            if (hk_y != null) {
                switch (number1) {
                    case 1:
                        hk_x = this.protocolPtr[hk_y][1]; break;
                    case 2:
                        hk_x = this.protocolPtr[hk_y][2]; break;
                    case 3:
                        hk_x = this.protocolPtr[hk_y][3]; break;
                    case 4:
                        hk_x = this.protocolPtr[hk_y][4]; break;
                }
            }
            else hk_x = -1;
        }
        else hk_x = -1;
        return hk_x ?? 0;
    }
    /**
    * HuskyLens get the parameter of the arrow corresponding to ID from result.
    * @param id to id ,eg: 1
    */
    readeArrow(id: number, number1: Content2): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_y = this.cycle_arrow(id, 1);
        let hk_x
        if (this.countArrows(id) != 0) {
            if (hk_y != null) {

                switch (number1) {
                    case 1:
                        hk_x = this.protocolPtr[hk_y][1]; break;
                    case 2:
                        hk_x = this.protocolPtr[hk_y][2]; break;
                    case 3:
                        hk_x = this.protocolPtr[hk_y][3]; break;
                    case 4:
                        hk_x = this.protocolPtr[hk_y][4]; break;
                    default:
                        hk_x = -1;
                }
            }
            else hk_x = -1;
        }
        else hk_x = -1;
        return hk_x;
    }
    /**
     * HuskyLens get the box or arrow total number from result.
     *
     */
    getBox(Ht: HUSKYLENSResultType_t): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        switch (Ht) {
            case 1:
                return this.countBlocks_s();
            case 2:
                return this.countArrows_s();
            default:
                return 0;
        }
    }
    /**
     * HuskyLens get the parameter of Nth box from result.
     * @param index to index ,eg: 1
     */
    readBox_ss(index: number, data: Content3): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_x = -1
        let hk_i = index - 1
        if (this.protocolPtr[hk_i][0] == protocolCommand.COMMAND_RETURN_BLOCK) {
            switch (data) {
                case 1:
                    hk_x = this.protocolPtr[hk_i][1]; break;
                case 2:
                    hk_x = this.protocolPtr[hk_i][2]; break;
                case 3:
                    hk_x = this.protocolPtr[hk_i][3]; break;
                case 4:
                    hk_x = this.protocolPtr[hk_i][4]; break;
                default:
                    hk_x = this.protocolPtr[hk_i][5];
            }
        } else hk_x = -1;
        return hk_x;

    }
    /**
     * HuskyLens get the parameter of the Nth arrow from result.
     * @param index to index ,eg: 1
    */
    readArrow_ss(index: number, data: Content4): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_x
        let hk_i = index - 1
        if (this.protocolPtr[hk_i][0] == protocolCommand.COMMAND_RETURN_ARROW) {
            switch (data) {
                case 1:
                    hk_x = this.protocolPtr[hk_i][1]; break;
                case 2:
                    hk_x = this.protocolPtr[hk_i][2]; break;
                case 3:
                    hk_x = this.protocolPtr[hk_i][3]; break;
                case 4:
                    hk_x = this.protocolPtr[hk_i][4]; break;
                default:
                    hk_x = this.protocolPtr[hk_i][5];
            }
        } else hk_x = -1;
        //protocolPtr[hk_i][0] = 0;
        return hk_x;
    }
    /**
     * HuskyLens get the total number of box or arrow from result.
     * @param id to id ,eg: 1
     */
    getBox_S(id: number, Ht: HUSKYLENSResultType_t): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        switch (Ht) {
            case 1:
                return this.countBlocks(id);
            case 2:
                return this.countArrows(id);
            default:
                return 0;
        }
    }
    /**
     * HuskyLens get the parameter of the Nth box corresponding to ID from result.
     * @param id to id ,eg: 1
     * @param index to index ,eg: 1
     */
    readeBox_index(id: number, index: number, number1: Content1): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_y = this.cycle_block(id, index);
        let hk_x
        if (this.countBlocks(id) != 0) {
            if (hk_y != null) {
                switch (number1) {
                    case 1:
                        hk_x = this.protocolPtr[hk_y][1]; break;
                    case 2:
                        hk_x = this.protocolPtr[hk_y][2]; break;
                    case 3:
                        hk_x = this.protocolPtr[hk_y][3]; break;
                    case 4:
                        hk_x = this.protocolPtr[hk_y][4]; break;
                    default:
                        hk_x = -1;
                }
            }
            else hk_x = -1;
        }
        else hk_x = -1;
        return hk_x;
    }
    /**
     * HuskyLens get the parameter of the Nth arrow corresponding to ID from result.
     * @param id to id ,eg: 1
     * @param index to index ,eg: 1
     */
    readeArrow_index(id: number, index: number, number1: Content2): number {
        if (!this.mbitMore.isConnected()) {
            return 0;
        }
        let hk_y = this.cycle_arrow(id, index);
        let hk_x
        if (this.countArrows(id) != 0) {
            if (hk_y != null) {
                switch (number1) {
                    case 1:
                        hk_x = this.protocolPtr[hk_y][1]; break;
                    case 2:
                        hk_x = this.protocolPtr[hk_y][2]; break;
                    case 3:
                        hk_x = this.protocolPtr[hk_y][3]; break;
                    case 4:
                        hk_x = this.protocolPtr[hk_y][4]; break;
                    default:
                        hk_x = -1;
                }
            }
            else hk_x = -1;
        }
        else hk_x = -1;
        return hk_x;
    }
    /**
     * Huskylens automatic learning ID
     * @param id to id ,eg: 1
     */
    writeLearn1(id: number): void {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        this.writeAlgorithm(id, 0X36)
        //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
     * Huskylens forget all learning data of the current algorithm
     */
    forgetLearn(): void {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        this.writeAlgorithm(0x47, 0X37)
        //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
     * Set ID name
     * @param id to id ,eg: 1
     * @param name to name ,eg: "DFRobot"
     */
    writeName(id: number, name: string): void {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        //do{
        let newname = name;
        let buffer = this.husky_lens_protocol_write_begin(0x2f);
        this.send_buffer[this.send_index] = id;
        this.send_buffer[this.send_index + 1] = (newname.length + 1) * 2;
        this.send_index += 2;
        for (let i = 0; i < newname.length; i++) {
            this.send_buffer[this.send_index] = newname.charCodeAt(i);
            //serial.writeNumber(newname.charCodeAt(i))
            this.send_index++;
        }
        this.send_buffer[this.send_index] = 0;
        this.send_index += 1;
        let length = this.husky_lens_protocol_write_end();
        this.protocolWrite(buffer);
        //}while(!await wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
     * Display characters on the screen
     * @param name to name ,eg: "DFRobot"
     * @param x to x ,eg: 150
     * @param y to y ,eg: 30
     */
    writeOSD(name: string, x: number, y: number): void {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        //do{
        let buffer = this.husky_lens_protocol_write_begin(0x34);
        this.send_buffer[this.send_index] = name.length;
        if (x > 255) {
            this.send_buffer[this.send_index + 2] = (x % 255);
            this.send_buffer[this.send_index + 1] = 0xff;
        } else {
            this.send_buffer[this.send_index + 1] = 0;
            this.send_buffer[this.send_index + 2] = x;
        }
        this.send_buffer[this.send_index + 3] = y;
        this.send_index += 4;
        for (let i = 0; i < name.length; i++) {
            this.send_buffer[this.send_index] = name.charCodeAt(i);
            //serial.writeNumber(name.charCodeAt(i));
            this.send_index++;
        }
        let length = this.husky_lens_protocol_write_end();
        //serial.writeNumber(length)
        this.protocolWrite(buffer);
        //}while(!await wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
     * HuskyLens clear characters in the screen
     */
    clearOSD(): void {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        this.writeAlgorithm(0x45, 0X35);
        //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
     * Photos and screenshots
     */
    async takePhotoToSDCard(request: HUSKYLENSphoto): Promise<void> {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        switch (request) {
            case HUSKYLENSphoto.PHOTO:
                this.writeAlgorithm(0x40, 0X30)
                //while(!await wait(protocolCommand.COMMAND_RETURN_OK))
                break;
            case HUSKYLENSphoto.SCREENSHOT:
                this.writeAlgorithm(0x49, 0X39)
                //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
                break;
            default:
                this.writeAlgorithm(0x40, 0X30)
            //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
        }
        await new Promise<void>(resolve => {
            setTimeout(() => resolve(), 500);
        });
    }
    /**
     * Save data model
     */
    async saveModelToTFCard(command: HUSKYLENSMode, data: number): Promise<void> {
        if (!this.mbitMore.isConnected()) {
            return;
        }
        switch (command) {
            case HUSKYLENSMode.SAVE:
                this.writeAlgorithm(data, 0x32);
                //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
                break;
            case HUSKYLENSMode.LOAD:
                this.writeAlgorithm(data, 0x33);
                //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
                break;
            default:
                this.writeAlgorithm(data, 0x32);
            //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
        }
        await new Promise<void>(resolve => {
            setTimeout(() => resolve(), 500);
        });
    }

    validateCheckSum() {

        let stackSumIndex = this.receive_buffer[3] + CONTENT_INDEX;
        let hk_sum = 0;
        for (let i = 0; i < stackSumIndex; i++) {
            hk_sum += this.receive_buffer[i];
        }
        hk_sum = hk_sum & 0xff;

        return (hk_sum == this.receive_buffer[stackSumIndex]);
    }

    husky_lens_protocol_write_end() {
        if (this.send_fail) {
            return 0;
        }
        if (this.send_index + 1 >= FRAME_BUFFER_SIZE) {
            return 0;
        }
        this.send_buffer[CONTENT_SIZE_INDEX] = this.send_index - CONTENT_INDEX;

        let hkSum = 0;
        for (let i = 0; i < this.send_index; i++) {
            hkSum += this.send_buffer[i];
        }

        hkSum = hkSum & 0xff;
        this.send_buffer[this.send_index] = hkSum;
        this.send_index++;
        return this.send_index;
    }

    husky_lens_protocol_write_begin(command = 0) {
        this.send_fail = false;
        this.send_buffer[HEADER_0_INDEX] = 0x55;
        this.send_buffer[HEADER_1_INDEX] = 0xAA;
        this.send_buffer[ADDRESS_INDEX] = 0x11;
        // send_buffer[CONTENT_SIZE_INDEX] = datalen;
        this.send_buffer[COMMAND_INDEX] = command;
        this.send_index = CONTENT_INDEX;
        return this.send_buffer;
    }

    protocolWrite(buffer: number[]) {
        let data = new Uint8Array(buffer.length + 2);
        data[0] = 0x32;
        data[1] = buffer.length;
        data.set(buffer, 2);
        this.write(data);
    }

    async processReturn() {
        if (!await this.wait(protocolCommand.COMMAND_RETURN_INFO)) return false;
        this.protocolReadFiveInt16(protocolCommand.COMMAND_RETURN_INFO);
        for (let i = 0; i < this.Protocol_t[1]; i++) {

            if (!await this.wait()) return false;
            if (this.protocolReadFiveInt161(i, protocolCommand.COMMAND_RETURN_BLOCK)) continue;
            else if (this.protocolReadFiveInt161(i, protocolCommand.COMMAND_RETURN_ARROW)) continue;
            else return false;
        }
        return true;
    }

    async wait(command = 0) {
        if (!this.mbitMore.isConnected())
        {
            return true;
        }
        this.timerBegin();
        while (!this.timerAvailable()) {
            if (await this.protocolAvailable()) {
                if (command) {
                    if (this.husky_lens_protocol_read_begin(command)) {
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                return false;
            }
            // await new Promise(resolve => setTimeout(resolve, 10));
        }
        return false;
    }

    husky_lens_protocol_read_begin(command = 0) {
        if (command == this.receive_buffer[COMMAND_INDEX]) {
            this.content_current = CONTENT_INDEX;
            this.content_read_end = false;
            this.receive_fail = false;
            return true;
        }
        return false;
    }

    timeOutDuration = 100;
    timeOutTimer: number = 0;

    timerBegin() {
        this.timeOutTimer = Date.now();
    }

    timerAvailable() {
        return (Date.now() - this.timeOutTimer > this.timeOutDuration);
    }

    async protocolAvailable() {
        if (!this.mbitMore.isConnected())
        {
            return false;
        }
        if (!this.waitingForRead) {
            this.waitingForRead = true;
            this.write(new Uint8Array([0x32, 0, 16]));
        }
        const start = Date.now();
        await new Promise<void>(resolve => {
            const check = () => {
                if (!this.waitingForRead || Date.now() - start > 500) {
                    resolve();
                } else {
                    setTimeout(check, 10);
                }
            };
            check();
        });
        let buf = this.readBuf;
        console.log("Decoding:", buf);
        for (let i = 0; i < 16; i++) {
            if (this.husky_lens_protocol_receive(buf[i])) {
                return true;
            }
        }
        return false;
    }

    husky_lens_protocol_receive(data: number): boolean {
        switch (this.receive_index) {
            case HEADER_0_INDEX:
                if (data != 0x55) { this.receive_index = 0; return false; }
                this.receive_buffer[HEADER_0_INDEX] = 0x55;
                break;
            case HEADER_1_INDEX:
                if (data != 0xAA) { this.receive_index = 0; return false; }
                this.receive_buffer[HEADER_1_INDEX] = 0xAA;
                break;
            case ADDRESS_INDEX:
                this.receive_buffer[ADDRESS_INDEX] = data;
                break;
            case CONTENT_SIZE_INDEX:
                if (data >= FRAME_BUFFER_SIZE - PROTOCOL_SIZE) { this.receive_index = 0; return false; }
                this.receive_buffer[CONTENT_SIZE_INDEX] = data;
                break;
            default:
                this.receive_buffer[this.receive_index] = data;

                if (this.receive_index == this.receive_buffer[CONTENT_SIZE_INDEX] + CONTENT_INDEX) {
                    this.content_end = this.receive_index;
                    this.receive_index = 0;
                    return this.validateCheckSum();

                }
                break;
        }
        this.receive_index++;
        return false;
    }

    husky_lens_protocol_write_int16(content = 0) {

        let x: number = ((content.toString()).length)
        if (this.send_index + x >= FRAME_BUFFER_SIZE) { this.send_fail = true; return; }
        this.send_buffer[this.send_index] = content & 0xff;
        this.send_buffer[this.send_index + 1] = (content >> 8) & 0xff;
        this.send_index += 2;
    }

    protocolReadFiveInt16(command = 0) {
        if (this.husky_lens_protocol_read_begin(command)) {
            this.Protocol_t[0] = command;
            this.Protocol_t[1] = this.husky_lens_protocol_read_int16();
            this.Protocol_t[2] = this.husky_lens_protocol_read_int16();
            this.Protocol_t[3] = this.husky_lens_protocol_read_int16();
            this.Protocol_t[4] = this.husky_lens_protocol_read_int16();
            this.Protocol_t[5] = this.husky_lens_protocol_read_int16();
            this.husky_lens_protocol_read_end();
            return true;
        }
        else {
            return false;
        }
    }

    protocolReadFiveInt161(i: number, command = 0) {
        if (this.husky_lens_protocol_read_begin(command)) {
            this.protocolPtr[i][0] = command;
            this.protocolPtr[i][1] = this.husky_lens_protocol_read_int16();
            this.protocolPtr[i][2] = this.husky_lens_protocol_read_int16();
            this.protocolPtr[i][3] = this.husky_lens_protocol_read_int16();
            this.protocolPtr[i][4] = this.husky_lens_protocol_read_int16();
            this.protocolPtr[i][5] = this.husky_lens_protocol_read_int16();
            this.husky_lens_protocol_read_end();
            return true;
        }
        else {
            return false;
        }
    }

    husky_lens_protocol_read_int16() {
        if (this.content_current >= this.content_end || this.content_read_end) { this.receive_fail = true; return 0; }
        let result = this.receive_buffer[this.content_current + 1] << 8 | this.receive_buffer[this.content_current];
        this.content_current += 2
        return result;
    }

    husky_lens_protocol_read_end() {
        if (this.receive_fail) {
            this.receive_fail = false;
            return false;
        }
        return this.content_current == this.content_end;
    }

    countLearnedIDs() {
        return this.Protocol_t[2]
    }

    countBlocks(ID: number) {
        let counter = 0;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK && this.protocolPtr[i][5] == ID) counter++;
        }
        return counter;
    }

    countBlocks_s() {
        let counter = 0;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK) counter++;
        }
        //serial.writeNumber(counter)
        return counter;
    }

    countArrows(ID: number) {
        let counter = 0;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW && this.protocolPtr[i][5] == ID) counter++;
        }
        return counter;
    }

    countArrows_s() {
        let counter = 0;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW) counter++;
        }
        return counter;
    }

    async readKnock() {
        if (!this.mbitMore.isConnected())
        {
            return true;
        }
        for (let i = 0; i < 5; i++) {
            this.protocolWriteCommand(protocolCommand.COMMAND_REQUEST_KNOCK);//I2C
            if (await this.wait(protocolCommand.COMMAND_RETURN_OK)) {
                return true;
            }
        }
        return false;
    }

    async writeForget() {
        for (let i = 0; i < 5; i++) {
            this.protocolWriteCommand(protocolCommand.COMMAND_REQUEST_FORGET);
            if (await this.wait(protocolCommand.COMMAND_RETURN_OK)) {
                return true;
            }
        }
        return false;
    }

    protocolWriteCommand(command = 0) {
        if (!this.mbitMore.isConnected())
        {
            return;
        }
        this.Protocol_t[0] = command;
        let buffer = this.husky_lens_protocol_write_begin(this.Protocol_t[0]);
        let length = this.husky_lens_protocol_write_end();
        this.protocolWrite(buffer);
    }

    protocolReadCommand(command = 0) {
        if (this.husky_lens_protocol_read_begin(command)) {
            this.Protocol_t[0] = command;
            this.husky_lens_protocol_read_end();
            return true;
        }
        else {
            return false;
        }
    }

    writeAlgorithm(algorithmType: number, comemand = 0) {
        this.protocolWriteOneInt16(algorithmType, comemand);
        //return true//await wait(protocolCommand.COMMAND_RETURN_OK);
        //while(!await wait(protocolCommand.COMMAND_RETURN_OK));
        //return true
    }

    async writeLearn(algorithmType: number) {
        this.protocolWriteOneInt16(algorithmType, protocolCommand.COMMAND_REQUEST_LEARN);
        return await this.wait(protocolCommand.COMMAND_RETURN_OK);
    }

    protocolWriteOneInt16(algorithmType: number, command = 0) {
        let buffer = this.husky_lens_protocol_write_begin(command);
        this.husky_lens_protocol_write_int16(algorithmType);
        let length = this.husky_lens_protocol_write_end();
        this.protocolWrite(buffer);
    }

    cycle_block(ID: number, index = 1): number {
        let counter = 0;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK && this.protocolPtr[i][5] == ID) {
                counter++;
                if (index == counter) return i;

            }
        }
        return 0;
    }

    cycle_arrow(ID: number, index = 1): number {
        let counter = 0;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW && this.protocolPtr[i][5] == ID) {
                counter++;
                if (index == counter) return i;

            }
        }
        return 0;
    }

    readBlockCenterParameterDirect(): number {
        let distanceMinIndex = -1;
        let distanceMin = 65535;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK) {
                let distance = Math.round(Math.sqrt(Math.abs(this.protocolPtr[i][1] - 320 / 2))) + Math.round(Math.sqrt(Math.abs(this.protocolPtr[i][2] - 240 / 2)));
                if (distance < distanceMin) {
                    distanceMin = distance;
                    distanceMinIndex = i;
                }
            }
        }
        return distanceMinIndex
    }

    readArrowCenterParameterDirect(): number {
        let distanceMinIndex = -1;
        let distanceMin = 65535;
        for (let i = 0; i < this.Protocol_t[1]; i++) {
            if (this.protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW) {
                let distance = Math.round(Math.sqrt(Math.abs(this.protocolPtr[i][1] - 320 / 2))) + Math.round(Math.sqrt(Math.abs(this.protocolPtr[i][2] - 240 / 2)));
                if (distance < distanceMin) {
                    distanceMin = distance;
                    distanceMinIndex = i;
                }
            }
        }
        return distanceMinIndex
    }

    /**
     * write to the micro:bit's I2C interface -> HuskyLens.
     */
    write(command: Uint8Array): void {
        if (!this.mbitMore.isConnected()) {
            this.connected = false;
            console.warn('Micro:bit not connected.');
            return;
        }

        const initializeIfNeeded = (): Promise<void> => {
            if (this.connected) return Promise.resolve();

            return this.mbitMore._ble.startNotifications(
                MM_SERVICE.ID,
                MM_SERVICE.STATUS_CH,
                this.onNotifyStatus.bind(this)
            ).then(() => {
                return this.mbitMore._ble.startNotifications(
                    MM_SERVICE.ID,
                    MM_SERVICE.READ_CH,
                    this.onNotifyRead.bind(this)
                );
            }).then(() => {
                this.connected = true;
                return new Promise<void>(resolve => setTimeout(resolve, 100)); // allow notification setup
            }).catch(e => {
                console.error('Failed to start BLE notifications:', e);
            });
        };

        const tryWrite = (retries = 5): Promise<void> => {
            if (!this.mbitMore.isConnected()) {
                console.warn('Micro:bit disconnected during write.');
                return Promise.resolve();
            }

            if (this.mbitMore.bleBusy) {
                if (retries <= 0) {
                    console.warn('BLE busy and retries exhausted.');
                    return Promise.resolve();
                }

                return new Promise(resolve => setTimeout(resolve, 20))
                    .then(() => tryWrite(retries - 1));
            }

            const data = Base64Util.uint8ArrayToBase64(command);

            this.mbitMore.bleBusy = true;
            this.mbitMore.bleBusyTimeoutID = window.setTimeout(() => {
                this.mbitMore.bleBusy = false;
                this.mbitMore.bleAccessWaiting = false;
            }, 1000);

            return this.mbitMore._ble.write(
                MM_SERVICE.ID,
                MM_SERVICE.WRITE_CH,
                data,
                'base64',
                false
            ).catch(err => {
                console.error('BLE write failed:', err);
                this.mbitMore._ble.handleDisconnectError(err);
            }).finally(() => {
                window.clearTimeout(this.mbitMore.bleBusyTimeoutID);
                this.mbitMore.bleBusy = false;
                this.mbitMore.bleAccessWaiting = false;
            });
        };

        initializeIfNeeded().then(() => tryWrite());
    }



    /**
     * Process the data from the incoming BLE characteristic.
     */
    onNotifyStatus(msg: string) {
        const data = Base64Util.base64ToUint8Array(msg);
        this.waitingForRead = false;
    }

    onNotifyRead(msg: string) {
        const data = Base64Util.base64ToUint8Array(msg);
        this.readBuf = new Uint8Array(data.buffer.slice(1));
        console.log("Read:", this.readBuf)
    }
}
