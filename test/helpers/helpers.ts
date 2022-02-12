/* eslint-disable jsdoc/require-jsdoc */

import {EventBase, EventBusBase} from "../../mod";
import {assert} from "chai";

export class TestEvent extends EventBase {
    get sourceName() {
        return "mySourceName";
    }

    get sourceType() {
        return "mySourceType";
    }
}

export class TestSync extends EventBase {
    get sourceName() {
        return "synchronize";
    }

    get sourceType() {
        return "synchronize";
    }

    get allowedEventTypes() {
        return new Set(["tick"]);
    }

    get eventBus() {
        return testSyncBus;
    }
}

export class TestFilterEvent extends EventBase {
    constructor(o) {
        // TODO: dummy arguments to pass linting
        super("foo", {});

        // this.sourceName = o.sourceName;
        // this.sourceType = o.sourceType;
        this.type = o.eventType;
    }

    get sourceName() {
        return this.sourceName || "empty";
    }

    get sourceType() {
        return this.sourceType || "empty";
    }

    get allowedEventTypes() {
        return new Set(["register", "init"]);
    }

    get eventBus() {
        return testBus;
    }
}

export class TestBus extends EventBusBase<TestEvent> {}

export class TestSyncBus extends EventBusBase<TestSync> {}
export const testBus: TestBus = new TestBus();
export const testSyncBus = new TestSyncBus();

export function testBusListenerCount() {
    const names = (testBus as any).eventNames();
    if (names.length === 0) {
        return 0;
    }

    const totalCount = names.map((event) => (testBus as any).listenerCount(event));
    return totalCount.reduce((total, num) => total + num);
}

export function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function doesNotSettle(p, ms = 5) {
    const timeout = new Promise((resolve) => {
        setTimeout(() => resolve("timeout"), ms);
    });

    const res = await Promise.race([p, timeout]);
    assert.strictEqual(res, "timeout", `Promise should not have settled in ${ms} ms`);
}

// lines from Log include timestamps, color, etc.
// this looks to make sure the debug line has the part we care about
export function debugLine(expectedLine) {
    return (receivedLine) => {
        if (receivedLine.indexOf(expectedLine) === -1) {
            throw new Error(`expected line '${expectedLine}' not found in '${receivedLine}'`);
        }
    };
}

export const testTemplateContents = `Test template {{name}}

{{foo}}!`;

export const cytoscapeTemplateContents = `<script>
requirejs.config({
    paths: {
        cytoscape: [
        ]
    }
})
</script>`;
