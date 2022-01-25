const {Breakpoint} = require("..");

const {assert} = require("chai");
const sinon = require("sinon");
const {testBus, TestEvent, delay, doesNotSettle} = require("./helpers/helpers.js");
process.on("unhandledRejection", (err) => {
    console.log("GOT ERROR:", err);
    throw err;
});

describe("Breakpoint", function() {
    beforeEach(function() {
        Breakpoint.init();
    });

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

            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(cbSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            Breakpoint.run();
            await delay(5);

            assert.strictEqual(cbSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
        });

        it("doesn't break", async function() {
            let te = new TestEvent();
            const cbSpy = sinon.spy();
            testBus.on("foo", cbSpy);
            // Breakpoint.setBreakpoint();

            assert.strictEqual(cbSpy.callCount, 0);
            await te.emit("foo");
            assert.isFalse(Breakpoint.inBreak);

            // Breakpoint.run();
            await delay(5);

            assert.strictEqual(cbSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
        });

        it("breaks on sourcetype", async function() {
            let te = new TestEvent();
            const cbSpy = sinon.spy();
            testBus.on("foo", cbSpy);
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(cbSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            Breakpoint.run();
            await delay(5);

            assert.strictEqual(cbSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
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
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 0);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);

            // break on bar event
            await doesNotSettle(te.emit("bar"));
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
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
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);

            // break on bar event
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 1);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 2);
            assert.isFalse(Breakpoint.inBreak);
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
                await te.emit("foo");
                assert.strictEqual(fooSpy.callCount, i + 1);
                assert.isFalse(Breakpoint.inBreak);
            }
            assert.strictEqual(fooSpy.callCount, 9);

            // break on bar event
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 9);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 10);
            assert.isFalse(Breakpoint.inBreak);
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
                await te.emit("foo");
                assert.strictEqual(fooSpy.callCount, i + 1);
                assert.isFalse(Breakpoint.inBreak);
            }
            assert.strictEqual(fooSpy.callCount, 9);

            // break on bar event
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 9);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 10);
            assert.isFalse(Breakpoint.inBreak);

            for (let i = 0; i < 9; i++) {
                // break on foo event
                await te.emit("foo");
                assert.strictEqual(fooSpy.callCount, i + 11);
                assert.isFalse(Breakpoint.inBreak);
            }
            assert.strictEqual(fooSpy.callCount, 19);

            // break on bar event
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 19);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 20);
            assert.isFalse(Breakpoint.inBreak);
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
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 0);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);

            // break on bar event
            await doesNotSettle(te.emit("bar"));
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
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
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 0);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.isFalse(Breakpoint.inBreak);

            // break on bar event
            await doesNotSettle(te.emit("bar"));
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.strictEqual(barSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);
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
            await doesNotSettle(te.emit("foo"));
            assert.strictEqual(fooSpy.callCount, 0);
            assert.isTrue(Breakpoint.inBreak);

            // continue
            Breakpoint.run();
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 1);
            assert.isFalse(Breakpoint.inBreak);

            // don't break on foo event again
            await te.emit("foo");
            await delay(5);
            assert.strictEqual(fooSpy.callCount, 2);
            assert.isFalse(Breakpoint.inBreak);
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

            await te.emit("foo");
            assert.strictEqual(cbSpy.callCount, 1);
            assert.strictEqual(bp.toString(), "foo: \"all::sourceName:mySourceName\" (1/10)");

            await te.emit("foo");
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

    describe("find", function() {
        it("finds by name", function() {
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

            let bp = new Breakpoint({
                every: true,
            }, "bob");

            let bpFound = Breakpoint.find("bob");
            assert.isArray(bpFound);
            assert.strictEqual(bpFound.length, 1);
            assert.strictEqual(bpFound[0], bp);
        });

        it("finds by number", function() {
            new Breakpoint({
                sourceName: "testSource",
                all: true,
            });

            let bp = new Breakpoint({
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

            let bpFound = Breakpoint.find(1);
            assert.isArray(bpFound);
            assert.strictEqual(bpFound.length, 1);
            assert.strictEqual(bpFound[0], bp);
        });

        it("finds duplicate names", function() {
            new Breakpoint({
                sourceName: "testSource",
                all: true,
            }, "sam");

            new Breakpoint({
                sourceType: "mySourceType",
                any: true,
            }, "sam");

            let bp1 = new Breakpoint({
                eventType: "blah",
                none: true,
            }, "bob");

            let bp2 = new Breakpoint({
                every: true,
            }, "bob");

            let bpFound = Breakpoint.find("bob");
            assert.isArray(bpFound);
            assert.strictEqual(bpFound.length, 2);
            assert.strictEqual(bpFound[0], bp1);
            assert.strictEqual(bpFound[1], bp2);
        });
    });

    describe("clear", function() {
        it("clear by name", function() {
            let bp = new Breakpoint({
                every: true,
            }, "bob");

            // should have our breakpoint
            let bpList = Breakpoint.list;
            assert.strictEqual(bpList.length, 1);
            assert.strictEqual(bpList[0], bp.toString());

            // clear our breakpoint
            Breakpoint.clear("bob");

            // should be empty
            bpList = Breakpoint.list;
            assert.strictEqual(bpList.length, 0);
        });

        it("clear by number", function() {
            let bp = new Breakpoint({
                every: true,
            }, "bob");

            // should have our breakpoint
            let bpList = Breakpoint.list;
            assert.strictEqual(bpList.length, 1);
            assert.strictEqual(bpList[0], bp.toString());

            // clear our breakpoint
            Breakpoint.clear(0);

            // should be empty
            bpList = Breakpoint.list;
            assert.strictEqual(bpList.length, 0);
        });

        it("clears duplicate names", function() {
            let bp1 = new Breakpoint({
                every: true,
            }, "bob");
            let bp2 = new Breakpoint({
                eventType: "blah",
                none: true,
            }, "bob");

            // should have our breakpoint
            let bpList = Breakpoint.list;
            assert.strictEqual(bpList.length, 2);
            assert.strictEqual(bpList[0], bp1.toString());
            assert.strictEqual(bpList[1], bp2.toString());

            // clear our breakpoint
            Breakpoint.clear("bob");

            // should be empty
            bpList = Breakpoint.list;
            assert.strictEqual(bpList.length, 0);
        });
    });

    describe("clearAll", function() {
        it("removes all breakpoints");
    });
});
