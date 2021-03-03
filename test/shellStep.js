const {assert} = require("chai");
const sinon = require("sinon");

const {testMagic, getMagic} = require("./helpers/jupyterTest.js");
const {Breakpoint, EventBase, EventBusBase, Log} = require("..");

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

// lines from Log include timestamps, color, etc.
// this looks to make sure the debug line has the part we care about
function debugLine(expectedLine) {
    return (receivedLine) => {
        if (receivedLine.indexOf(expectedLine) === -1) {
            throw new Error(`expected line '${expectedLine}' not found in '${receivedLine}'`);
        }
    };
}

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

        te.emit("foo");
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

        await delay(5);

        te.emit("foo");
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

        await delay(5);

        te.emit("foo");
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
