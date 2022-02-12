import {TestBus, TestEvent} from "./helpers/helpers";
import {EventBus} from "../mod";
import {assert} from "chai";

describe("EventBus", function() {
    afterEach(function() {
        EventBus.clear();
    });

    it("is constructable", function() {
        assert.isFunction(TestBus);
        new TestBus("test");
    });

    describe("send", function() {
        it("sends an event", function() {
            const tb = new TestBus("test");
            tb.send(new TestEvent({value: "bar"}));
        });
    });

    describe("listen", function() {
        it("allows function listener", function(done) {
            const tb = new TestBus("test");

            tb.listen((evt: TestEvent) => {
                assert.instanceOf(evt, TestEvent);
                assert.strictEqual(evt.data.value, "foo");
                done();
            });

            tb.send(new TestEvent({value: "foo"}));
        });

        it("allows async function listener");
    });
});
