const {Context} = require("..");
const {assert} = require("chai");

describe("Context", function() {
    it("is function", function() {
        assert.isFunction(Context);
    });

    it("is constructable", function() {
        new Context();
    });
});
