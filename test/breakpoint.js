const {Breakpoint, EventBase, EventBusBase} = require("..");

const {assert} = require("chai");
const sinon = require("sinon");

process.on("unhandledRejection", (err) => {
    console.log("GOT ERROR:", err);
    throw err;
});

// helpers
let testBus;

class TestEvent extends EventBase {
    get sourceName() {
        return "mySourceName";
    }

    get sourceType() {
        return "mySourceType";
    }

    get allowedEventTypes() {
        return new Set(["foo", "bar"]);
    }

    get eventBus() {
        return testBus;
    }
}

testBus = new EventBusBase(TestEvent);

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe("Breakpoint", function() {
    afterEach(function() {
        testBus.removeAllListeners();
        Breakpoint.clearAll();
    });

    it("is a function", function() {
        assert.isFunction(Breakpoint);
    });

    describe("checkBreak", function() {
        it("can break", async function() {
            let te = new TestEvent();
            const cbSpy = sinon.spy();
            testBus.on("foo", cbSpy);
            Breakpoint.setBreakpoint();

            te.emit("foo");
            assert.strictEqual(cbSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            Breakpoint.run();
            await delay(5);

            assert.strictEqual(cbSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("doesn't break", async function() {
            let te = new TestEvent();
            const cbSpy = sinon.spy();
            testBus.on("foo", cbSpy);
            // Breakpoint.setBreakpoint();

            assert.strictEqual(cbSpy.callCount, 0);
            te.emit("foo");
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);

            // Breakpoint.run();
            await delay(5);

            assert.strictEqual(cbSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("breaks on sourcetype", async function() {
            let te = new TestEvent();
            const cbSpy = sinon.spy();
            testBus.on("foo", cbSpy);
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            te.emit("foo");
            assert.strictEqual(cbSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            Breakpoint.run();
            await delay(5);

            assert.strictEqual(cbSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("handles different breakpoints", async function() {
            let te = new TestEvent();

            // foo
            const fooSpy = sinon.spy();
            testBus.on("foo", fooSpy);
            new Breakpoint({
                eventType: "foo",
                all: true,
            });

            // bar
            const barSpy = sinon.spy();
            testBus.on("bar", barSpy);
            new Breakpoint({
                eventType: "bar",
                all: true,
            });

            // break on foo event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 0);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);

            // break on bar event
            te.emit("bar");
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("breaks every time", async function() {
            let te = new TestEvent();

            // foo
            const fooSpy = sinon.spy();
            testBus.on("foo", fooSpy);
            new Breakpoint({
                eventType: "foo",
                all: true,
            });

            // break on foo event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);

            // break on bar event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 1);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 2);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("breaks after count", async function() {
            let te = new TestEvent();

            // foo
            const fooSpy = sinon.spy();
            testBus.on("foo", fooSpy);
            new Breakpoint({
                eventType: "foo",
                count: 10,
                all: true,
            });

            for (let i = 0; i < 9; i++) {
                // break on foo event
                te.emit("foo");
                assert.strictEqual(fooSpy.callCount, i + 1);
                assert.isFalse(Breakpoint.inBreak);
                assert.isFalse(Breakpoint.setBreak);
            }
            assert.strictEqual(fooSpy.callCount, 9);

            // break on bar event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 9);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 10);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("breaks after count twice", async function() {
            let te = new TestEvent();

            // foo
            const fooSpy = sinon.spy();
            fooSpy.callCount = 0;
            testBus.on("foo", fooSpy);
            new Breakpoint({
                eventType: "foo",
                count: 10,
                all: true,
            });

            for (let i = 0; i < 9; i++) {
                // break on foo event
                te.emit("foo");
                assert.strictEqual(fooSpy.callCount, i + 1);
                assert.isFalse(Breakpoint.inBreak);
                assert.isFalse(Breakpoint.setBreak);
            }
            assert.strictEqual(fooSpy.callCount, 9);

            // break on bar event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 9);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 10);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);

            for (let i = 0; i < 9; i++) {
                // break on foo event
                te.emit("foo");
                assert.strictEqual(fooSpy.callCount, i + 11);
                assert.isFalse(Breakpoint.inBreak);
                assert.isFalse(Breakpoint.setBreak);
            }
            assert.strictEqual(fooSpy.callCount, 19);

            // break on bar event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 19);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 20);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("breaks on all", async function() {
            let te = new TestEvent();

            // foo
            const fooSpy = sinon.spy();
            testBus.on("foo", fooSpy);
            new Breakpoint({
                eventType: "foo",
                all: true,
            });

            // bar
            const barSpy = sinon.spy();
            testBus.on("bar", barSpy);
            new Breakpoint({
                eventType: "bar",
                all: true,
            });

            // break on foo event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 0);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);

            // break on bar event
            te.emit("bar");
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("doesn't remove breakpoint after trigger", async function() {
            let te = new TestEvent();

            const fooSpy = sinon.spy();
            testBus.on("foo", fooSpy);
            const barSpy = sinon.spy();
            testBus.on("bar", barSpy);
            new Breakpoint({
                every: true,
            });

            // break on foo event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 0);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);

            // break on bar event
            te.emit("bar");
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("breaks once", async function() {
            let te = new TestEvent();

            // foo
            const fooSpy = sinon.spy();
            fooSpy.callCount = 0;
            testBus.on("foo", fooSpy);
            new Breakpoint({
                eventType: "foo",
                once: true,
                all: true,
            });

            // break on foo event
            te.emit("foo");
            assert.strictEqual(fooSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);
            assert.isTrue(Breakpoint.setBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);

            // don't break on foo event again
            te.emit("foo");
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 2);
            assert.isFalse(Breakpoint.inBreak);
            assert.isFalse(Breakpoint.setBreak);
        });

        it("clear");
        it("disable");
        it("enable");
    });

    describe("toString", function() {
        afterEach(function() {
            Breakpoint.clearAll();
        });

        it("shows name and criteria", function() {
            let bp;

            bp = new Breakpoint({
                sourceName: "testSource",
                all: true,
            });
            assert.strictEqual(bp.toString(), "bp1: \"all::sourceName:testSource\"");

            bp = new Breakpoint({
                sourceType: "mySourceType",
                any: true,
            });
            assert.strictEqual(bp.toString(), "bp2: \"any::sourceType:mySourceType\"");

            bp = new Breakpoint({
                eventType: "blah",
                none: true,
            });
            assert.strictEqual(bp.toString(), "bp3: \"none::eventType:blah\"");

            bp = new Breakpoint({
                every: true,
            }, "bob");
            assert.strictEqual(bp.toString(), "bob: \"*\"");
        });

        it("shows flags", function() {
            let bp;

            bp = new Breakpoint({
                sourceName: "testSource",
                all: true,
                once: true,
            });
            assert.strictEqual(bp.toString(), "bp1: \"all::sourceName:testSource\" [once]");

            bp = new Breakpoint({
                sourceType: "mySourceType",
                any: true,
                disabled: true,
            });
            assert.strictEqual(bp.toString(), "bp2: \"any::sourceType:mySourceType\" [disabled]");

            bp = new Breakpoint({
                eventType: "blah",
                none: true,
                once: true,
                disabled: true,
            });
            assert.strictEqual(bp.toString(), "bp3: \"none::eventType:blah\" [disabled,once]");
        });

        it("shows count", async function() {
            let te = new TestEvent();
            const cbSpy = sinon.spy();
            testBus.on("foo", cbSpy);
            let bp = new Breakpoint({
                sourceName: "mySourceName",
                all: true,
                count: 10,
            }, "foo");
            assert.strictEqual(bp.toString(), "foo: \"all::sourceName:mySourceName\" (0/10)");

            te.emit("foo");
            assert.strictEqual(cbSpy.callCount, 1);
            assert.strictEqual(bp.toString(), "foo: \"all::sourceName:mySourceName\" (1/10)");

            te.emit("foo");
            assert.strictEqual(cbSpy.callCount, 2);
            assert.strictEqual(bp.toString(), "foo: \"all::sourceName:mySourceName\" (2/10)");
        });
    });

    describe("list", function() {
        afterEach(function() {
            Breakpoint.clearAll();
        });

        it("returns array of strings", function() {
            new Breakpoint({
                sourceName: "testSource",
                all: true,
            });

            new Breakpoint({
                sourceType: "mySourceType",
                any: true,
            });

            new Breakpoint({
                eventType: "blah",
                none: true,
            });

            new Breakpoint({
                every: true,
            }, "bob");

            new Breakpoint({
                sourceName: "testSource",
                all: true,
                once: true,
            });

            new Breakpoint({
                sourceType: "mySourceType",
                any: true,
                disabled: true,
            });

            new Breakpoint({
                eventType: "blah",
                none: true,
                once: true,
                disabled: true,
            });

            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
                count: 10,
            }, "foo");

            let bpList = Breakpoint.list;
            assert.isArray(bpList);
            assert.strictEqual(bpList.length, 8);

            assert.strictEqual(bpList[0].toString(), "bp1: \"all::sourceName:testSource\"");
            assert.strictEqual(bpList[1].toString(), "bp2: \"any::sourceType:mySourceType\"");
            assert.strictEqual(bpList[2].toString(), "bp3: \"none::eventType:blah\"");
            assert.strictEqual(bpList[3].toString(), "bob: \"*\"");
            assert.strictEqual(bpList[4].toString(), "bp4: \"all::sourceName:testSource\" [once]");
            assert.strictEqual(bpList[5].toString(), "bp5: \"any::sourceType:mySourceType\" [disabled]");
            assert.strictEqual(bpList[6].toString(), "bp6: \"none::eventType:blah\" [disabled,once]");
            assert.strictEqual(bpList[7].toString(), "foo: \"all::sourceName:mySourceName\" (0/10)");
        });
    });

    describe("name", function() {
        it("sets breakpoint name");
        it("sets generic name");
        it("clearAll resets generic name");
    });

    describe("clear", function() {
        it("clear by name");
        it("clear by number");
    });

    describe("clearAll", function() {
        it("removes all breakpoints");
    });
});
