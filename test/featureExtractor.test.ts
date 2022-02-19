import {Component, FeatureExtractor, FeatureExtractorEvent, Perception, PerceptionEvent} from "../mod";
import {skip, take} from "rxjs/operators";
import {assert} from "chai";

class PerceptionEventTest extends PerceptionEvent {
    sourceName = "haptics";
    sourceType = "perception";
}

describe("FeatureExtractor", function() {
    afterEach(async function() {
        await Perception.eventBus.reset();
        Component.clearList();
    });

    it("is Component", function() {
        assert.isFunction(FeatureExtractor);
        assert.instanceOf(FeatureExtractor.prototype, Component);
    });

    describe("listen", function() {
        it("catches events", function(done) {
            const o = {beer: "yum"};
            const e = new PerceptionEventTest("data", o);
            const fe = new FeatureExtractor("bob", function(rcvEvt: PerceptionEvent): null {
                assert.strictEqual(rcvEvt.data, o);
                assert.strictEqual(rcvEvt, e);
                done();
                return null;
            });
            fe.attach("haptics");
            Perception.eventBus.send(e);
        });

        it("emits return value", function(done) {
            const feature = new FeatureExtractorEvent("data", {tequila: "blech"});
            const fe = new FeatureExtractor("bob", function(_evt: PerceptionEvent): FeatureExtractorEvent {
                return feature;
            });
            fe.attach("haptics");

            // listen for feature-extractor event
            Perception
                .eventBus
                .pipe([
                    skip(1),
                    take(1),
                ],
                (retEvt: PerceptionEvent) => {
                    assert.strictEqual(retEvt.sourceType, "feature-extractor");
                    assert.strictEqual(retEvt.sourceName, "bob");
                    assert.strictEqual(retEvt.type, "data");
                    assert.strictEqual(retEvt, feature);
                    done();
                });

            Perception.eventBus.send(new PerceptionEventTest("data", {}));
        });
    });

    describe("input", function() {
        it("throws when abstract implementation");
        it("receives event");
    });
});
