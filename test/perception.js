/* eslint-disable jsdoc/require-jsdoc */

const {Perception, PerceptionEvent, EventBase, EventBusBase} = require("../index");
const {assert} = require("chai");

describe("PerceptionEvent", function() {
    describe("events", function() {
        it("PerceptionEvent is class", function() {
            assert.isFunction(PerceptionEvent);
            assert.instanceOf(PerceptionEvent.prototype, EventBase);
        });

        it("getEventBus returns event bus singleton", function() {
            assert.isFunction(Perception.getEventBus);
            let eb1 = Perception.getEventBus();
            assert.instanceOf(eb1, EventBusBase);
            let eb2 = Perception.getEventBus();
            assert.strictEqual(eb1, eb2);
        });

        it("registers Component on register event");
    });
});
