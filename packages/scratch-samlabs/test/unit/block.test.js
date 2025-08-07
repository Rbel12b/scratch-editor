import { blockClass } from "../../src/vm/extensions/block/samlabs.js";

import Runtime from "../../src/vm/engine/runtime.js";

describe("blockClass", function() {
    const runtime = new Runtime();

    it("should create an instance of blockClass", function() {
        const block = new blockClass(runtime);
        expect(block).toBeInstanceOf(blockClass);
    });
});
