import {Component, EventBus, Perception, PerceptionEvent} from "../mod";
import {assert} from "chai";

class PerceptionEventTest extends PerceptionEvent {
    sourceName = "bob";
    sourceType = "whee";
}

describe("PerceptionEvent", function() {
    describe("events", function() {
        it("PerceptionEvent is class", function() {
            assert.isFunction(PerceptionEvent);
        });
    });
});

// eslint-disable-next-line mocha/max-top-level-suites
describe("Perception", function() {
    afterEach(async function() {
        await Perception.eventBus.shutdown();
        Component.clearList();
    });

    it("is Component", function() {
        assert.isFunction(Perception);
        assert.instanceOf(Perception.prototype, Component);
    });

    describe("eventBus", function() {
        it("is singleton", function() {
            assert.isObject(Perception.eventBus);
            const eb1 = Perception.eventBus;
            assert.instanceOf(eb1, EventBus);
            const eb2 = Perception.eventBus;
            assert.strictEqual(eb1, eb2);
        });
    });

    describe("input", function() {
        it("emits an input event", async function() {
            const o = {foo: "bar"};
            await Perception.eventBus.listen((e: PerceptionEvent) => {
                process.nextTick(() => {
                    assert.strictEqual(e.type, "data");
                    assert.strictEqual(e.data, o);
                });
            });

            // eslint-disable-next-line no-var
            var p = new Perception("smell");
            p.input(new PerceptionEventTest("data", o));
        });
    });
});
