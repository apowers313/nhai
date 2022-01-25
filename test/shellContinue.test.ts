const {assert} = require("chai");
const sinon = require("sinon");
const {testBus, TestEvent, delay, doesNotSettle, debugLine} = require("./helpers/helpers.js");

const {testMagic} = require("./helpers/jupyterTest.js");
const {Breakpoint, Log} = require("..");

describe("%continue", function() {
    before(function() {
        Log.init();
    });

    afterEach(function() {
        testBus.removeAllListeners();
        Breakpoint.clearAll();
    });

    it("runs program", async function() {
        let te = new TestEvent();
        const cbSpy = sinon.spy();
        testBus.on("foo", cbSpy);
        Breakpoint.setBreakpoint();

        await doesNotSettle(te.emit("foo"));
        assert.strictEqual(cbSpy.callCount, 0);
        assert.isTrue(Breakpoint.inBreak);

        await testMagic(
            // magic command
            "%continue\n",
            // return value
            undefined,
            // stdout
            [debugLine("Continuing program execution.")],
            // stderr
            [],
            // print output
            // true,
        );

        await delay(5);

        assert.strictEqual(cbSpy.callCount, 1);
        assert.isFalse(Breakpoint.inBreak);
    });

    it("errors when not in a break", async function() {
        await testMagic(
            // magic command
            "%continue\n",
            // return value
            undefined,
            // stdout
            [],
            // stderr
            ["Continue failed: not currently in a breakpoint"],
            // print output
            // true,
        );
    });
});
