const {Perception, PerceptionEvent, EventBase, EventBusBase} = require("../index");
const {assert} = require("chai");

describe("PerceptionEvent", function() {
    describe("events", function() {
        it("PerceptionEvent is class", function() {
            assert.isFunction(PerceptionEvent);
            assert.instanceOf(PerceptionEvent.prototype, EventBase);
        });

        it("eventBus is an event bus singleton", function() {
            assert.isObject(Perception.eventBus);
            let eb1 = Perception.eventBus;
            assert.instanceOf(eb1, EventBusBase);
            let eb2 = Perception.eventBus;
            assert.strictEqual(eb1, eb2);
        });

        it("registers Component on register event");
    });
});
