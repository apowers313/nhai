const {assert} = require("chai");
const {Significance, SignificanceEvent, Component, EventBase, Intrinsic, Synchronize} = require("..");
const sinon = require("sinon");
const sandbox = sinon.createSandbox();

describe("Significance", function() {
    beforeEach(function() {
        Synchronize.init();
    });

    afterEach(function() {
        Synchronize.shutdown();
        Component.clearList();
        Significance.eventBus.removeAllListeners();
        Significance.clearWeights();
    });

    it("is Component", function() {
        assert.isFunction(Significance);
        assert.instanceOf(Significance.prototype, Component);
    });

    describe("setWeight / getWeight", function() {
        it("default weight 1.0", function() {
            let ret = Significance.getWeight("test");
            assert.strictEqual(ret, 1.0);
        });

        it("sets and gets the weight", function() {
            Significance.setWeight("test", 2.4);
            let ret = Significance.getWeight("test");
            assert.strictEqual(ret, 2.4);
        });
    });

    describe("events", function() {
        beforeEach(function() {
            sandbox.spy(Significance.prototype);
        });

        afterEach(function() {
            sandbox.restore();
        });

        it("catches intrinsic change", function() {
            let s = new Significance();

            let e = new SignificanceEvent("test", "intrinsic");
            e.emit("change", {
                oldVal: 1,
                newVal: 2,
                intrinsic: {},
            });
            assert.strictEqual(s.getChange.callCount, 1);
            assert.strictEqual(s.getChange.args[0][0], e);
        });

        it("fires significance", function(done) {
            Significance.eventBus.on("significance", (e) => {
                assert.isObject(e.data);
                assert.strictEqual(e.data.significance, 0);
                assert.isArray(e.data.changes);
                assert.strictEqual(e.data.changes.length, 0);
                done();
            });

            new Significance();
            Synchronize.nextTick();
        });
    });

    describe("weight", function() {
        it("no change", function(done) {
            Significance.eventBus.on("significance", (e) => {
                assert.isObject(e.data);
                assert.strictEqual(e.data.significance, 0);
                assert.isArray(e.data.changes);
                assert.strictEqual(e.data.changes.length, 0);
                done();
            });

            new Significance();
            console.log("doing tick");
            Synchronize.nextTick();
        });

        it("no weight", function(done) {
            Significance.eventBus.on("significance", (e) => {
                assert.isObject(e.data);
                assert.strictEqual(e.data.significance, 0.5);
                assert.isArray(e.data.changes);
                assert.strictEqual(e.data.changes.length, 1);
                assert.strictEqual(e.data.changes[0].type, "test");
                assert.strictEqual(e.data.changes[0].val, 0.5);
                assert.strictEqual(e.data.changes[0].weightedVal, 0.5);
                done();
            });

            new Significance();

            let i = new Intrinsic("test", {
                min: 0,
                max: 100,
            });
            i.value = 50;

            Synchronize.nextTick();
        });

        it("weighted", function(done) {
            Significance.eventBus.on("significance", (e) => {
                assert.isObject(e.data);
                assert.strictEqual(e.data.significance, 2);
                assert.isArray(e.data.changes);
                assert.strictEqual(e.data.changes.length, 1);
                assert.strictEqual(e.data.changes[0].type, "test");
                assert.strictEqual(e.data.changes[0].val, 0.5);
                assert.strictEqual(e.data.changes[0].weightedVal, 2);
                done();
            });

            new Significance();

            Significance.setWeight("test", 4);
            let i = new Intrinsic("test", {
                min: 0,
                max: 100,
            });
            i.value = 50;

            Synchronize.nextTick();
        });

        it("multi-change, multi-weight", function(done) {
            Significance.eventBus.on("significance", (e) => {
                assert.isObject(e.data);
                assert.strictEqual(e.data.significance, 2.75);
                assert.isArray(e.data.changes);
                assert.strictEqual(e.data.changes.length, 3);

                // test1
                assert.strictEqual(e.data.changes[0].type, "test1");
                assert.strictEqual(e.data.changes[0].val, 0.5);
                assert.strictEqual(e.data.changes[0].weightedVal, 0.5);

                // test2
                assert.strictEqual(e.data.changes[1].type, "test2");
                assert.strictEqual(e.data.changes[1].val, 0.125);
                assert.equal(e.data.changes[1].weightedVal, 0.25);

                // test3
                assert.strictEqual(e.data.changes[2].type, "test3");
                assert.strictEqual(e.data.changes[2].val, 0.1);
                assert.strictEqual(e.data.changes[2].weightedVal, 2);

                done();
            });

            new Significance();

            // .5 * 1 = .5
            let i1 = new Intrinsic("test1", {
                min: 0,
                max: 100,
            });
            i1.value = 50;

            // .125 * 2 = .25
            Significance.setWeight("test2", 2);
            let i2 = new Intrinsic("test2", {
                min: 10,
                max: 26,
            });
            i2.value = 12;

            // .1 * 20 = 2
            Significance.setWeight("test3", 20);
            let i3 = new Intrinsic("test3", {
                min: -43,
                max: 57,
            });
            i3.value = -33;

            Synchronize.nextTick();
        });
    });
});

describe("SignificanceEvent", function() {
    it("is EventBase", function() {
        assert.isFunction(SignificanceEvent);
        assert.instanceOf(SignificanceEvent.prototype, EventBase);
    });
});
