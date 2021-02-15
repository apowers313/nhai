const {Breakpoint, EventBase, EventBusBase, Perception, PerceptionEvent} = require("..");

const {assert} = require("chai");
const sinon = require("sinon");

process.on("unhandledRejection", (err) => {
    console.log("GOT ERROR:", err);
    throw err;
});

// helpers
let testBus;

class TestEvent extends EventBase {
    get sourceName() {
        return "dummy";
    }

    get sourceType() {
        return "test";
    }

    get allowedEventTypes() {
        return new Set(["foo", "bar"]);
    }

    get eventBus() {
        return testBus;
    }
}

testBus = new EventBusBase(TestEvent);

describe("Breakpoint", function() {
    afterEach(function() {
        Perception.eventBus.removeAllListeners();
    });

    it("is a function", function() {
        assert.isFunction(Breakpoint);
    });

    describe("checkBreak", function() {
        it("can break", function(done) {
            let pe = new PerceptionEvent("perception", "haptics");
            const cbSpy = sinon.spy();
            Perception.eventBus.on("data", cbSpy);
            Breakpoint.setBreakpoint("*");

            pe.emit("data");
            assert.strictEqual(cbSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            Breakpoint.run();
            setTimeout(() => {
                assert.strictEqual(cbSpy.callCount, 1);
                assert.isFalse(Breakpoint.inBreak);
                assert.isFalse(Breakpoint.setBreak);
                done();
            }, 5);
        });
    });
});
