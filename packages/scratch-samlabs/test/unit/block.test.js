const { blockClass } = require("../../src/vm/extensions/block/samlabs.js");
const Runtime = require("../../src/vm/engine/runtime.js");

describe("blockClass", function() {
    const runtime = new Runtime();

    it("should create an instance of blockClass", function() {
        const block = new blockClass(runtime);
        expect(block).toBeInstanceOf(blockClass);
    });
});
