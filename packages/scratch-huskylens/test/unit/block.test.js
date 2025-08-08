import { blockClass } from "../../src/vm/extensions/block/huskylens.js";

import Runtime from "../../src/vm/engine/runtime.js";
import { MbitMore } from "../../src/vm/extensions/block/protocol.ts"

describe("blockClass", function() {
    const runtime = new Runtime();
    runtime.peripheralExtensions.microbitMore = new MbitMore();

    it("should create an instance of blockClass", function() {
        const block = new blockClass(runtime);
        expect(block).toBeInstanceOf(blockClass);
    });
});
