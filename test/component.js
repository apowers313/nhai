const {Component, EventBase, EventBusBase} = require("../index");
const {assert} = require("chai");

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
        return new Set(["register", "foo", "bar"]);
    }

    get eventBus() {
        return testBus;
    }
}

testBus = new EventBusBase(TestEvent);

describe("Component", function() {
    afterEach(function() {
        Component.clearList();
    });

    it("can construct", function() {
        let c = new Component("foo", "bar", TestEvent);
        assert.instanceOf(c, Component);
        assert.strictEqual(c.name, "foo");
        assert.strictEqual(c.type, "bar");
    });

    it("throws on bad name", function() {
        assert.throws(() => {
            new Component(undefined, "type", TestEvent);
        }, TypeError, "Component.constructor expected 'name' to be a string, got: undefined");
    });

    it("throws on bad type", function() {
        assert.throws(() => {
            new Component("name", 3, TestEvent);
        }, TypeError, "Component.constructor expected 'type' to be a string, got: 3");
    });

    it("throws on unrecognized type");
    it("throws on unrecognized module class");
    it("registers component");

    describe("get", function() {
        it("returns a Map", function() {
            let l = Component.list;
            assert.instanceOf(l, Map);
            assert.strictEqual(l.size, 0);
        });
    });

    describe("clearList", function() {
        it("returns a Map", function() {
            let l = Component.list;
            assert.instanceOf(l, Map);
            assert.strictEqual(l.size, 0);
            l.set("foo", "bar");
            assert.strictEqual(l.size, 1);
            Component.clearList();
            assert.strictEqual(l.size, 0);
        });
    });

    describe("register", function() {
        it("registers module", function() {
            let c = new Component("myName", "myType", TestEvent);
            Component.register(c);
            let l = Component.list;
            assert.strictEqual(l.get("myName"), c);
        });

        it("throws on registering non-Component", function() {
            assert.throws(() => {
                Component.register({});
            }, TypeError, "Component.register expected 'comp' to be instanceof Component, got: Object");
        });

        it("throws on duplicate name", function() {
            new Component("myName", "myType1", TestEvent);
            assert.throws(() => {
                new Component("myName", "myType2", TestEvent);
            });
        });

        it("allows re-registration of same object", function() {
            let c = new Component("myName", "myType", TestEvent);
            Component.register(c);
            Component.register(c);
        });
    });
});

