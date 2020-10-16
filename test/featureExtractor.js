const {FeatureExtractor, Component, Perception, PerceptionEvent, EventFilter, EventListener} = require("../index");
const {assert} = require("chai");

describe("FeatureExtractor", function() {
    afterEach(function() {
        Perception.eventBus.removeAllListeners();
        Component.clearList();
    });

    it("is Component", function() {
        assert.isFunction(FeatureExtractor);
        assert.instanceOf(FeatureExtractor.prototype, Component);
    });

    describe("listen", function() {
        it("catches events", function(done) {
            let o = {beer: "yum"};
            let e = new PerceptionEvent("haptics", "perception");
            let fe = new FeatureExtractor("bob", function(... args) {
                assert.strictEqual(args.length, 2);
                assert.strictEqual(args[0], o);
                assert.strictEqual(args[1], e);
                done();
            });
            fe.listen("haptics");
            e.emit("data", o);
        });

        it("emits return value", function(done) {
            let ret = {tequila: "blech"};
            let e = new PerceptionEvent("haptics", "perception");
            let fe = new FeatureExtractor("bob", function() {
                return ret;
            });
            fe.listen("haptics");
            e.emit("data");

            // listen for feature-extractor event
            let f = new EventFilter("allow", {eventType: "data", sourceType: "feature-extractor", sourceName: "bob", all: true});
            new EventListener(Perception.eventBus, f, function(feEvent) {
                assert.strictEqual(feEvent.data, ret);
                done();
            });
        });
    });

    describe("input", function() {
        it("throws when abstract implementation");
        it("receives event");
    });
});
