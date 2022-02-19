import {TestBus, TestEvent} from "./helpers/helpers";
import {skip, take} from "rxjs/operators";
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

    describe("filter", function() {
        it("catches event", function(done) {
            const tb = new TestBus("test");

            tb.filter([
                (evt: TestEvent) => evt.data.value !== "beer",
            ],
            (evt: TestEvent) => {
                assert.notEqual(evt.data.value, "beer");
                assert.strictEqual(evt.data.value, "test");
                done();
            });

            tb.send(new TestEvent({value: "test"}));
        });
        it("ignores event", function(done) {
            const tb = new TestBus("test");

            tb.filter([
                (evt: TestEvent) => evt.data.value !== "beer",
            ],
            (evt: TestEvent) => {
                assert.notEqual(evt.data.value, "beer");
                assert.strictEqual(evt.data.value, "test");
                done();
            });

            tb.send(new TestEvent({value: "beer"}));
            tb.send(new TestEvent({value: "test"}));
        });
    });

    describe("pipe", function() {
        it("works with filter operators", function(done) {
            const tb = new TestBus("test");

            tb.pipe([
                skip(1),
                take(1),
            ],
            (evt: TestEvent) => {
                assert.notEqual(evt.data.value, "beer");
                assert.strictEqual(evt.data.value, "test");
                done();
            });

            tb.send(new TestEvent({value: "beer"}));
            tb.send(new TestEvent({value: "test"}));
        });
    });

    describe("reset", function() {
        it("removes subscribers", function() {
            const tb = new TestBus("test");
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            function listener1(_evt: TestEvent) {}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            function listener2(_evt: TestEvent) {}
            tb.listen(listener1);
            tb.listen(listener2);
            tb.reset();
        });
    });
});
