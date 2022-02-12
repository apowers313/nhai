/* eslint-disable jsdoc/require-jsdoc */

import {Event, EventBus} from "../../mod";
import {assert} from "chai";

export interface TestData {
    value: string;
}

export class TestEvent extends Event {
    type: "test";
    data: TestData;

    constructor(value: TestData) {
        super();

        this.type = "test";
        this.data = value;
    }
}

export class TestBus extends EventBus<TestEvent> {

}

export const testEventBus = new TestBus("test");

// export class TestFilterEvent extends EventBase {
//     constructor(o) {
//         // TODO: dummy arguments to pass linting
//         super("foo", {});

//         // this.sourceName = o.sourceName;
//         // this.sourceType = o.sourceType;
//         this.type = o.eventType;
//     }

//     get sourceName() {
//         return this.sourceName || "empty";
//     }

//     get sourceType() {
//         return this.sourceType || "empty";
//     }

//     get allowedEventTypes() {
//         return new Set(["register", "init"]);
//     }

//     get eventBus() {
//         return testBus;
//     }
// }

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
