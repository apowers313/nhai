const {assert} = require("chai");
const {Significance, SignificanceEvent, Component, EventBase} = require("..");

describe("Significance", function() {
    it("is Component", function() {
        assert.isFunction(Significance);
        assert.instanceOf(Significance.prototype, Component);
    });
});

describe("SignificanceEvent", function() {
    it("is EventBase", function() {
        assert.isFunction(SignificanceEvent);
        assert.instanceOf(SignificanceEvent.prototype, EventBase);
    });
});
