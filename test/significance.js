const {assert} = require("chai");
const {Significance, SignificanceEvent, Component, EventBase} = require("..");
const sinon = require("sinon");
const sandbox = sinon.createSandbox();

describe("Significance", function() {
    it("is Component", function() {
        assert.isFunction(Significance);
        assert.instanceOf(Significance.prototype, Component);
    });

    describe("setWeight / getWeight", function() {
        it("default weight 1.0", function() {
            let ret = Significance.getWeight("test");
            assert.strictEqual(ret, 1.0);
        });

        it("sets and gets the weight", function() {
            Significance.setWeight("test", 2.4);
            let ret = Significance.getWeight("test");
            assert.strictEqual(ret, 2.4);
        });
    });

    describe("events", function() {
        beforeEach(function() {
            sandbox.spy(Significance.prototype);
        });

        afterEach(function() {
            sandbox.restore();
        });

        it("catches intrinsic change", function() {
            let s = new Significance();
            console.log("spy installed");

            let e = new SignificanceEvent("test", "intrinsic");
            e.emit("change", {
                oldVal: 1,
                newVal: 2,
                intrinsic: {},
            });
            assert.strictEqual(s.calculateChange.callCount, 1);
            assert.strictEqual(s.calculateChange.args[0][0], e);
        });

        it("fires significance");
        it("applies weight");
    });
});

describe("SignificanceEvent", function() {
    it("is EventBase", function() {
        assert.isFunction(SignificanceEvent);
        assert.instanceOf(SignificanceEvent.prototype, EventBase);
    });
});
