import {TestEvent, testEventBus} from "./helpers/helpers";
import {Component} from "../mod";
import {assert} from "chai";
// const {TestEvent} = require("./helpers/helpers.js");

class TestComponent extends Component<TestEvent> {
    eventBus = testEventBus;
}

describe("Component", function() {
    afterEach(function() {
        Component.clearList();
    });

    it("can construct", function() {
        const c = new TestComponent("foo", "bar");
        assert.instanceOf(c, Component);
        assert.strictEqual(c.name, "foo");
        assert.strictEqual(c.type, "bar");
    });

    it("registers component");

    describe("get", function() {
        it("returns a Map", function() {
            const l = Component.list;
            assert.instanceOf(l, Map);
            assert.strictEqual(l.size, 0);
        });
    });

    describe("clearList", function() {
        it("returns a Map", function() {
            const l = Component.list;
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
            const c = new TestComponent("myName", "myType");
            Component.register(c);
            const l = Component.list;
            assert.strictEqual(l.get("myName"), c);
        });

        it("throws on duplicate name", function() {
            new TestComponent("myName", "myType1");
            assert.throws(() => {
                new TestComponent("myName", "myType2");
            });
        });

        it("allows re-registration of same object", function() {
            const c = new TestComponent("myName", "myType");
            Component.register(c);
            Component.register(c);
        });
    });

    describe("sendEvent", function() {
        it("sends", function() {
            const c = new TestComponent("foo", "bar");
            c.sendEvent(new TestEvent({value: "foo"}));
        });

        it("emits event");
        it("throws on bad type");
    });
});

