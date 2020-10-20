const {Trace, Perception, PerceptionEvent} = require("..");

const {assert} = require("chai");
const sinon = require("sinon");

process.on("unhandledRejection", (err) => {
    console.log("GOT ERROR:", err);
    throw err;
});

describe("Trace", function() {
    afterEach(function() {
        Perception.eventBus.removeAllListeners();
        Trace.clearEventHistory();
        // Trace.run();
    });

    it("is a function", function() {
        assert.isFunction(Trace);
    });

    describe("checkBreak", function() {
        it("can break", function(done) {
            let pe = new PerceptionEvent("perception", "haptics");
            const cbSpy = sinon.spy();
            Perception.eventBus.on("data", cbSpy);
            Trace.setBreakpoint("*");

            pe.emit("data");
            assert.strictEqual(cbSpy.callCount, 0);

            Trace.run();
            setTimeout(() => {
                assert.strictEqual(cbSpy.callCount, 1);
                done();
            }, 5);
        });
    });

    describe("getEventHistory", function() {
        it("returns events");
        it("is immutable");
    });

    describe("clearEventHistory", function() {
        it("clears history");
    });
});
