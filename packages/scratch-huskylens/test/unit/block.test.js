import { describe, it } from "mocha";
import { expect } from "chai";
import { blockClass } from "../../src/vm/extensions/block/index.js";

describe("blockClass", () => {
    const runtime = {
        formatMessage: function (msg) {
            return msg.default;
        }
    };

    it("should create an instance of blockClass", () => {
        const block = new blockClass(runtime);
        expect(block).to.be.an.instanceOf(blockClass);
    });
});
