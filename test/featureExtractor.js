const {FeatureExtractor, Component, Perception, PerceptionEvent, EventFilter, EventListener} = require("../index");
const {assert} = require("chai");

describe("FeatureExtractor", function() {
    afterEach(async function() {
        await Perception.eventBus.removeAllListeners();
        Component.clearList();
    });

    it("is Component", function() {
        assert.isFunction(FeatureExtractor);
        assert.instanceOf(FeatureExtractor.prototype, Component);
    });

    describe("listen", function() {
        it("catches events", async function() {
            let o = {beer: "yum"};
            let e = new PerceptionEvent("haptics", "perception");
            let fe = new FeatureExtractor("bob", function(... args) {
                assert.strictEqual(args.length, 2);
                assert.strictEqual(args[0], o);
                assert.strictEqual(args[1], e);
            });
            fe.listen("haptics");
            await e.emit("data", o);
        });

        it("emits return value", async function() {
            let ret = {tequila: "blech"};
            let e = new PerceptionEvent("haptics", "perception");
            let fe = new FeatureExtractor("bob", function() {
                return ret;
            });
            fe.listen("haptics");

            // listen for feature-extractor event
            let f = new EventFilter("allow", {eventType: "data", sourceType: "feature-extractor", sourceName: "bob", all: true});
            new EventListener(Perception.eventBus, f, function(feEvent) {
                assert.strictEqual(feEvent.data, ret);
            });

            await e.emit("data");
        });
    });

    describe("input", function() {
        it("throws when abstract implementation");
        it("receives event");
    });
});
