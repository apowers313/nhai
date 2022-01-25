const {assert} = require("chai");
const sinon = require("sinon");

const {testMagic} = require("./helpers/jupyterTest.js");
const {Breakpoint, Log} = require("..");
const {testBus, TestEvent, doesNotSettle, delay, debugLine} = require("./helpers/helpers.js");

describe("%step", function() {
    before(function() {
        Log.init();
    });

    afterEach(function() {
        testBus.removeAllListeners();
        Breakpoint.clearAll();
    });

    it("runs one more event", async function() {
        let te = new TestEvent();
        const cbSpy = sinon.spy();
        testBus.on("foo", cbSpy);
        Breakpoint.setBreakpoint();

        await doesNotSettle(te.emit("foo"));
        assert.strictEqual(cbSpy.callCount, 0);
        assert.isTrue(Breakpoint.inBreak);

        // step once
        await testMagic(
            // magic command
            "%step\n",
            // return value
            undefined,
            // stdout
            [debugLine("Stepping program execution.")],
            // stderr
            [],
            // print output
            // true,
        );

        await doesNotSettle(te.emit("foo"));
        assert.strictEqual(cbSpy.callCount, 1);
        assert.isTrue(Breakpoint.inBreak);

        // step twice
        await testMagic(
            // magic command
            "%step\n",
            // return value
            undefined,
            // stdout
            [debugLine("Stepping program execution.")],
            // stderr
            [],
            // print output
            // true,
        );

        await doesNotSettle(te.emit("foo"));
        assert.strictEqual(cbSpy.callCount, 2);
        assert.isTrue(Breakpoint.inBreak);

        // continue running program normally
        Breakpoint.run();

        await delay(5);

        assert.strictEqual(cbSpy.callCount, 3);
        assert.isFalse(Breakpoint.inBreak);
    });

    it("errors when not in a break", async function() {
        await testMagic(
            // magic command
            "%step\n",
            // return value
            undefined,
            // stdout
            [],
            // stderr
            ["Step failed: not currently in a breakpoint"],
            // print output
            // true,
        );
    });
});
