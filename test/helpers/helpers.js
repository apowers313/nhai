/* eslint-disable jsdoc/require-jsdoc */

const {EventBase, EventBusBase} = require("../..");
const {assert} = require("chai");

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

class TestFilterEvent extends EventBase {
    constructor(o) {
        super();

        this._sourceName = o.sourceName;
        this._sourceType = o.sourceType;
        this.type = o.eventType;
    }

    get sourceName() {
        return this._sourceName || "empty";
    }

    get sourceType() {
        return this._sourceType || "empty";
    }

    get allowedEventTypes() {
        return new Set(["register", "init"]);
    }

    get eventBus() {
        return testBus;
    }
}

testBus = new EventBusBase(TestEvent);
function testBusListenerCount() {
    let names = testBus.eventNames();
    if (names.length === 0) {
        return 0;
    }

    let totalCount = names.map((event) => testBus.listenerCount(event));
    return totalCount.reduce((total, num) => total + num);
}

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function doesNotSettle(p, ms = 5) {
    let timeout = new Promise((resolve) => {
        setTimeout(() => resolve("timeout"), ms);
    });

    let res = await Promise.race([p, timeout]);
    assert.strictEqual(res, "timeout", `Promise should not have settled in ${ms} ms`);
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

module.exports = {
    delay,
    doesNotSettle,
    testBus,
    TestEvent,
    TestFilterEvent,
    testBusListenerCount,
    debugLine,
};
