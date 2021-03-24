const {DeltaFeatureExtractor} = require("../src/DeltaFeatureExtractor");
const {FeatureExtractor, Component, Perception, PerceptionEvent} = require("..");
const {Grid} = require("../src/Grid");
const {assert} = require("chai");
const sinon = require("sinon");
const helperScreens = require("./helpers/screens");

// helpers
function charToNum(ch) {
    if (typeof ch !== "string" || ch.length !== 1) {
        throw new TypeError("bad arg in charToNum");
    }

    return ch.charCodeAt(0);
}
const screen1 = Grid.from(helperScreens[1].split("\n"));
const screen2 = Grid.from(helperScreens[2].split("\n"));
const delta1to2 = [
    {x: 30, y: 9, oldVal: charToNum("@"), newVal: charToNum("<")},
    {x: 30, y: 10, oldVal: charToNum("."), newVal: charToNum("@")},
    {x: 29, y: 11, oldVal: 0, newVal: charToNum("#")},
    {x: 30, y: 11, oldVal: 0, newVal: charToNum("#")},
    {x: 27, y: 13, oldVal: 0, newVal: charToNum(".")},
    {x: 26, y: 14, oldVal: 0, newVal: charToNum(".")},
];

describe("DeltaFeatureExtractor", function() {
    beforeEach(async function() {
        Component.clearList();
        await Perception.eventBus.removeAllListeners();
    });

    it("is FeatureExtractor", function() {
        assert.isFunction(DeltaFeatureExtractor);
        assert.instanceOf(DeltaFeatureExtractor.prototype, FeatureExtractor);
    });

    describe("createDelta", function() {
        it("creates delta", function() {
            let dfe = new DeltaFeatureExtractor();
            let ret1 = dfe.createDelta(screen1);
            assert.isNull(ret1);
            let ret2 = dfe.createDelta(screen2);
            assert.isArray(ret2);
            assert.deepEqual(ret2, delta1to2);
        });

        it("returns 'null' if Grids are the same", function() {
            let dfe = new DeltaFeatureExtractor();
            let ret1 = dfe.createDelta(screen1);
            assert.isNull(ret1);
            let ret2 = dfe.createDelta(screen1);
            assert.isNull(ret2);
        });

        it("catches perception 'data' and emits delta 'data'", async function() {
            // setup
            let dfe = new DeltaFeatureExtractor();
            dfe.listen("vision");
            let deltaSpy = sinon.spy(dfe, "createDelta");
            let eventSpy = sinon.spy((evt) => {
                switch (eventSpy.callCount) {
                case 1:
                case 2:
                    assert.strictEqual(evt.sourceName, "vision");
                    assert.strictEqual(evt.sourceType, "perception");
                    return;
                case 3:
                    assert.strictEqual(evt.sourceName, "delta");
                    assert.strictEqual(evt.sourceType, "feature-extractor");
                    assert.deepEqual(evt.data, delta1to2);
                    return;
                default:
                    throw new Error("too many events");
                }
            });
            await Perception.eventBus.on("data", eventSpy);

            // send first screen
            let pe1 = new PerceptionEvent("vision", "perception");
            await pe1.emit("data", screen1);
            assert.strictEqual(deltaSpy.callCount, 1);
            assert.strictEqual(deltaSpy.args[0].length, 2);
            assert.strictEqual(deltaSpy.args[0][0], screen1);
            assert.strictEqual(deltaSpy.args[0][1], pe1);
            assert.isNull(deltaSpy.returnValues[0]);

            // send second screen
            let pe2 = new PerceptionEvent("vision", "perception");
            await pe2.emit("data", screen2);
            assert.strictEqual(deltaSpy.callCount, 2);
            assert.strictEqual(deltaSpy.args[1].length, 2);
            assert.strictEqual(deltaSpy.args[1][0], screen2);
            assert.strictEqual(deltaSpy.args[1][1], pe2);
            assert.isNull(deltaSpy.returnValues[0]);
        });
    });
});
