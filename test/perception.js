const {Perception, PerceptionEvent, EventBase, EventBusBase, Component} = require("../index");
const {assert} = require("chai");

describe("PerceptionEvent", function() {
    describe("events", function() {
        it("PerceptionEvent is class", function() {
            assert.isFunction(PerceptionEvent);
            assert.instanceOf(PerceptionEvent.prototype, EventBase);
        });
    });
});

describe("Perception", function() {
    afterEach(function() {
        Perception.eventBus.removeAllListeners();
        Component.clearList();
    });

    it("is Component", function() {
        assert.isFunction(Perception);
        assert.instanceOf(Perception.prototype, Component);
    });

    it("throws if dataType isn't a class", function() {
        assert.throws(() => {
            new Perception("foo", 3);
        }, TypeError, "Perception constructor expected 'dataType' to be a class");
    });

    describe("eventBus", function() {
        it("is singleton", function() {
            assert.isObject(Perception.eventBus);
            let eb1 = Perception.eventBus;
            assert.instanceOf(eb1, EventBusBase);
            let eb2 = Perception.eventBus;
            assert.strictEqual(eb1, eb2);
        });
    });

    it("throws on no name", function() {
        assert.throws(() => {
            new Perception();
        }, TypeError, "Component.constructor expected 'name' to be a string, got: undefined");
    });

    describe("input", function() {
        it("validates input type", function() {
            let p = new Perception("foo", Object);
            p.input({});
            assert.throws(() => {
                p.input(3);
            }, TypeError, "Perception.input expected 'data' to be a object, got: 3");
        });

        it("emits an input event", function(done) {
            let o = {foo: "bar"};
            Perception.eventBus.on("data", (e) => {
                process.nextTick(() => {
                    assert.instanceOf(e, PerceptionEvent);
                    assert.strictEqual(e.type, "data");
                    assert.strictEqual(e.data, o);
                    done();
                });
            });

            // eslint-disable-next-line no-var
            var p = new Perception("smell", Object);
            p.input(o);
        });
    });
});
