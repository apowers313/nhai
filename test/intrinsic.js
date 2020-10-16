const {assert} = require("chai");
const {Intrinsic, Component} = require("..");

describe("Intrinsic", function() {
    it("is Component", function() {
        assert.isFunction(Intrinsic);
        assert.instanceOf(Intrinsic.prototype, Component);
    });
});
