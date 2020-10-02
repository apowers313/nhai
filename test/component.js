const { PerceptionEvent, Component } = require("../index");
const assert = require("chai").assert;

describe("Component", function() {
    it("accepts argument inputs", function() {
        let d = {
            beer: "mmm"
        };
        let c = new Component("foo", "bar", d);
        assert.instanceOf(c, Component);
        assert.strictEqual(c.module, d);
        assert.strictEqual(c.name, "foo");
        assert.strictEqual(c.type, "bar");
    });

    it("accepts event input", function() {
        let pe = new PerceptionEvent("foo", "bar");
        pe.data = {};
        let c = new Component(pe);
        assert.instanceOf(c, Component);
        assert.strictEqual(c.module, pe.data);
        assert.strictEqual(c.name, "foo");
        assert.strictEqual(c.type, "bar");
    });

    it("throws on bad name", function() {
        assert.throws(() => {
            new Component(undefined, "type", {data: "foo"});
        }, TypeError, "expected 'name' to be String while constructing Component");
    });

    it("throws on bad type", function() {
        assert.throws(() => {
            new Component("name", 3, {data: "foo"});
        }, TypeError, "expected 'type' to be String while constructing Component");
    });

    it("throws on bad data", function() {
        assert.throws(() => {
            new Component("name", "type", undefined);
        }, TypeError, "expected 'module' to be Object while constructing Component");
    });

    it("throws on unrecognized type");
    it("throws on unrecognized module class");

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
        afterEach(function() {
            Component.clearList();
        });

        it("registers module", function() {
            let c = new Component("myName", "myType", {data: "foo"});
            Component.register(c);
            let l = Component.list;
            assert.strictEqual(l.get("myName"), c);
        });

        it("registers based on event", function() {
            let pe = new PerceptionEvent("foo", "bar");
            pe.data = {};
            let c = new Component(pe);
            Component.register(c);
            let l = Component.list;
            assert.strictEqual(l.get("foo"), c);
        });

        it("throws on registering non-Component", function() {
            assert.throws(() => {
                Component.register({});
            }, TypeError, "registerModule expected Component argument");
        });

        it("throws on duplicate name", function() {
            let c1 = new Component("myName", "myType1", {data: "foo"});
            let c2 = new Component("myName", "myType2", {data: "bar"});
            Component.register(c1);
            assert.throws(() => {
                Component.register(c2);
            });
        });

        it("allows re-registration of same object", function() {
            let c = new Component("myName", "myType", {data: "foo"});
            Component.register(c);
            Component.register(c);
        });
    });
});

