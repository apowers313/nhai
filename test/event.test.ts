/* eslint-disable @typescript-eslint/no-empty-function, mocha/max-top-level-suites */

import {EventBase, EventBusBase, EventFilter, EventListener} from "../mod";
import {TestEvent, TestFilterEvent, delay, testBus, testBusListenerCount} from "./helpers/helpers";
import {assert} from "chai";
import sinon from "sinon";

describe("EventBusBase", function() {
    afterEach(async function() {
        await (testBus as any).removeAllListeners();
    });

    it("is Function", function() {
        assert.isFunction(EventBusBase);
    });

    it("constructs", function() {
        class NewBus extends EventBusBase<TestEvent> {}

        new NewBus();
    });

    it("addListener", async function() {
        await testBus.addListener("foo", function(e: EventBase) {
            console.log("got e", e);
            assert.instanceOf(e, EventBase);
            assert.strictEqual(e.data, 42);
        });

        await testBus.send(new TestEvent("foo", 42));
    });

    it("sequentially resolves multiple listeners with Promises");

    it("on", async function() {
        await testBus.on("foo", (e) => {
            assert.instanceOf(e, EventBase);
            assert.strictEqual(e.data, 43);
        });

        await testBus.send(new TestEvent("foo", 43));
    });

    it("once", async function() {
        let count = (testBus as any).listenerCount("foo");
        assert.strictEqual(count, 0);

        await testBus.once("foo", (e) => {
            assert.instanceOf(e, EventBase);
            assert.strictEqual(e.data, 44);
        });

        await testBus.send(new TestEvent("foo", 44));
        count = (testBus as any).listenerCount("foo");
        assert.strictEqual(count, 0);
    });

    it("emit returns Promise", function() {
        const ret = testBus.send(new TestEvent("foo", 46));
        assert.instanceOf(ret, Promise);
    });

    it("emit resolves to true if listener", async function() {
        await testBus.once("foo", ()=>{});
        const p = testBus.send(new TestEvent("foo", 46));

        assert.instanceOf(p, Promise);
        return p.then((res) => {
            assert.isBoolean(res);
            assert.isTrue(res);
        });
    });

    it("emit resolves to false if no listeners", function() {
        const p = testBus.send(new TestEvent("foo", 46));

        assert.instanceOf(p, Promise);
        return p.then((res) => {
            assert.isBoolean(res);
            assert.isFalse(res);
        });
    });

    it("rejects on emitting non-EventBase event", function(done) {
        testBus.send(new TestEvent("blah", 45))
            .then(() => {
                assert.fail("should not have resolved");
            })
            .catch((e) => {
                assert.instanceOf(e, TypeError);
                assert.strictEqual(e.message, "EventBusBase.checkEvent expected 'event' to be a object, got: 45");
                done();
            });
    });
});

// describe("EventBase", function() {
//     afterEach(function() {
//         testBus.removeAllListeners();
//     });

//     it("is Function", function() {
//         assert.isFunction(EventBase);
//     });

//     it("throws if constructed", function() {
//         assert.throws(() => {
//             new EventBase();
//         }, Error);
//     });

//     describe("instantiated", function() {
//         it("can be constructed", function() {
//             const t = new TestEvent();
//             assert.instanceOf(t, EventBase);
//         });

//         it("can emit", async function() {
//             const t = new TestEvent();
//             const d = {
//                 cookie: 0xDEADBEEF, // mmm... beef cookies
//             };

//             await testBus.once("foo", (e) => {
//                 assert.strictEqual(e.data, d);
//             });

//             await t.emit("foo", d);
//         });

//         it("can emit with multiple args", async function() {
//             const t = new TestEvent();
//             const d = {
//                 cookie: 0xDEADBEEF, // mmm... beef cookies
//             };

//             await testBus.once("foo", (e, ... args) => {
//                 assert.strictEqual(args.length, 3);
//                 assert.strictEqual(args[0], 0xBEEF);
//                 assert.strictEqual(args[1], "beer");
//                 assert.strictEqual(args[2], d);
//                 assert.strictEqual(e.data.length, 3);
//                 assert.strictEqual(e.data[0], 0xBEEF);
//                 assert.strictEqual(e.data[1], "beer");
//                 assert.strictEqual(e.data[2], d);
//             });

//             await t.emit("foo", 0xBEEF, "beer", d);
//         });

//         it("throws on bad event type", function(done) {
//             const t = new TestEvent();
//             t.emit("something")
//                 .then(() => {
//                     assert.fail("should not have resolved");
//                 })
//                 .catch((e) => {
//                     assert.instanceOf(e, TypeError);
//                     assert.strictEqual(e.message, "event type 'something' not one of the allowedEventTypes");
//                     done();
//                 });
//         });
//     });

//     describe("bad construction", function() {
//         it("throws on abstract sourceName", function() {
//             class BadTestEvent extends EventBase {
//                 get sourceType() {
//                     return "test";
//                 }

//                 get allowedEventTypes() {
//                     return new Set(["foo", "bar"]);
//                 }

//                 get eventBus() {
//                     return testBus;
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, Error, "sourceName not implemented");
//         });

//         it("throws on wrong sourceName type", function() {
//             class BadTestEvent extends EventBase {
//                 get sourceName() {
//                     return null;
//                 }

//                 get sourceType() {
//                     return "test";
//                 }

//                 get allowedEventTypes() {
//                     return new Set(["foo", "bar"]);
//                 }

//                 get eventBus() {
//                     return testBus;
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, TypeError, "EventBase.constructor expected 'sourceName' to be a string, got: null");
//         });

//         it("throws on abstract sourceType", function() {
//             class BadTestEvent extends EventBase {
//                 get allowedEventTypes() {
//                     return new Set(["foo", "bar"]);
//                 }

//                 get eventBus() {
//                     return testBus;
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, Error, "sourceType not implemented");
//         });

//         it("throws on wrong sourceType type", function() {
//             class BadTestEvent extends EventBase {
//                 get sourceType() {
//                     return 3;
//                 }

//                 get allowedEventTypes() {
//                     return new Set(["foo", "bar"]);
//                 }

//                 get eventBus() {
//                     return testBus;
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, TypeError, "EventBase.constructor expected 'sourceType' to be a string, got: 3");
//         });

//         it("throws on abstract allowedEventTypes", function() {
//             class BadTestEvent extends EventBase {
//                 get sourceType() {
//                     return "test";
//                 }

//                 get eventBus() {
//                     return testBus;
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, Error, "allowedEventTypes not implemented");
//         });

//         it("throws on wrong allowedEventTypes type", function() {
//             class BadTestEvent extends EventBase {
//                 get sourceType() {
//                     return "test";
//                 }

//                 get allowedEventTypes() {
//                     return 3;
//                 }

//                 get eventBus() {
//                     return testBus;
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, TypeError, "EventBase.constructor expected 'allowedEventTypes' to be a object, got: 3");
//         });

//         it("throws on abstract eventBus", function() {
//             class BadTestEvent extends EventBase {
//                 get sourceType() {
//                     return "test";
//                 }

//                 get allowedEventTypes() {
//                     return new Set(["foo", "bar"]);
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, Error, "eventBus not implemented");
//         });

//         it("throws on wrong EventBus type", function() {
//             class BadTestEvent extends EventBase {
//                 get sourceType() {
//                     return "test";
//                 }

//                 get allowedEventTypes() {
//                     return new Set(["foo", "bar"]);
//                 }

//                 get eventBus() {
//                     return 3;
//                 }
//             }

//             assert.throws(() => {
//                 new BadTestEvent();
//             }, TypeError, "EventBase.constructor expected 'eventBus' to be a object, got: 3");
//         });
//     });
// });

describe("EventFilter", function() {
    it("is Function", function() {
        assert.isFunction(EventFilter);
    });

    it("sets allow type", function() {
        const f = new EventFilter("allow", {sourceType: "foo", all: true});
        assert.strictEqual(f.allow, true);
        assert.strictEqual(f.deny, false);
    });

    it("sets deny type", function() {
        const f = new EventFilter("deny", {sourceType: "foo", all: true});
        assert.strictEqual(f.deny, true);
        assert.strictEqual(f.allow, false);
    });

    it("throws on bad type");

    it("sets default priority", function() {
        const f = new EventFilter("deny", {sourceType: "foo", all: true});
        assert.strictEqual(f.priority, 100);
    });

    it("throws on bad priority");

    it("sets priority", function() {
        const f = new EventFilter("deny", {sourceType: "foo", all: true}, 747);
        assert.strictEqual(f.priority, 747);
    });

    it("throws on bad criteria object");

    it("sets critera", function() {
        const c = {sourceType: "foo", all: true};
        const f = new EventFilter("deny", c, 747);
        assert.strictEqual(f.criteria, c);
        assert.strictEqual(f.criteria.sourceType, "foo");
        assert.strictEqual(f.criteria.all, true);
    });

    describe("buildTestFn", function() {
        it("creates a function", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", all: true});
            assert.isFunction(fn);
        });

        it("matches based on sourceType", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", all: true});
            const e = new TestFilterEvent({sourceType: "foo"});
            assert.strictEqual(fn(e), true);
        });

        it("doesn't match wrong sourceType", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", all: true});
            const e = new TestFilterEvent({sourceType: "bar"});
            assert.strictEqual(fn(e), false);
        });

        it("matches based on sourceName", function() {
            const fn = EventFilter.buildTestFn({sourceName: "beer", all: true});
            const e = new TestFilterEvent({sourceName: "beer"});
            assert.strictEqual(fn(e), true);
        });

        it("doesn't match wrong sourceName", function() {
            const fn = EventFilter.buildTestFn({sourceName: "beer", all: true});
            const e = new TestFilterEvent({sourceName: "wine"});
            assert.strictEqual(fn(e), false);
        });

        it("matches based on eventType", function() {
            const fn = EventFilter.buildTestFn({eventType: "register", all: true});
            const e = new TestFilterEvent({eventType: "register"});
            assert.strictEqual(fn(e), true);
        });

        it("doesn't match wrong eventType", function() {
            const fn = EventFilter.buildTestFn({eventType: "register", all: true});
            const e = new TestFilterEvent({eventType: "init"});
            assert.strictEqual(fn(e), false);
        });

        it("matches on custom function");
        it("doesn't match on custom function");

        it("matches any", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", eventType: "register", any: true});
            const e = new TestFilterEvent({sourceType: "foo", eventType: "register"});
            assert.strictEqual(fn(e), true);
        });

        it("partial matches any", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", eventType: "register", any: true});
            const e = new TestFilterEvent({sourceType: "bar", eventType: "register"});
            assert.strictEqual(fn(e), true);
        });

        it("doesn't match any", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", eventType: "register", any: true});
            const e = new TestFilterEvent({sourceType: "bar", eventType: "init"});
            assert.strictEqual(fn(e), false);
        });

        it("matches all", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", eventType: "register", all: true});
            const e = new TestFilterEvent({sourceType: "foo", eventType: "register"});
            assert.strictEqual(fn(e), true);
        });

        it("doesn't match all", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", eventType: "register", all: true});
            const e = new TestFilterEvent({sourceType: "bar", eventType: "register"});
            assert.strictEqual(fn(e), false);
        });

        it("matches none", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", eventType: "register", none: true});
            const e = new TestFilterEvent({sourceType: "bar", eventType: "init"});
            assert.strictEqual(fn(e), true);
        });

        it("doesn't match none", function() {
            const fn = EventFilter.buildTestFn({sourceType: "foo", eventType: "register", none: true});
            const e = new TestFilterEvent({sourceType: "foo", eventType: "init"});
            assert.strictEqual(fn(e), false);
        });

        // it("throws on unknown criteria", function() {
        //     assert.throws(() => {
        //         EventFilter.buildTestFn({something: "yep"});
        //     }, TypeError, "key 'something' isn't a valid filter criteria");
        // });

        it("throws on missing 'any', 'all', or 'none'", function() {
            assert.throws(() => {
                EventFilter.buildTestFn({sourceType: "foo"});
            }, Error, "expected 'criteria' to include at least one of 'any', 'all', or 'none'");
        });

        it("throws on empty object", function() {
            assert.throws(() => {
                EventFilter.buildTestFn({});
            }, Error, "expected 'criteria' to include at least one of");
        });

        // it("throws on empty criteria", function() {
        //     assert.throws(() => {
        //         EventFilter.buildTestFn();
        //     }, TypeError, "buildTestFn expected 'criteria' to be a object, got: undefined");
        // });

        // it("throws on non-Object criteria", function() {
        //     assert.throws(() => {
        //         EventFilter.buildTestFn(3);
        //     }, TypeError, "buildTestFn expected 'criteria' to be a object, got: 3");
        // });

        it("can only specify one of 'any', 'all', or 'none'");
    });

    it("matchEvent true");
    it("matchEvent false");

    it("allowEvent true", function() {
        const f = new EventFilter("allow", {sourceName: "mySourceName", all: true}, 747);
        const te = new TestEvent("test", 31337);
        assert.isTrue(f.allowEvent(te));
        assert.isFalse(f.denyEvent(te));
    });

    it("allowEvent false", function() {
        const f = new EventFilter("allow", {sourceName: "bob", all: true}, 747);
        const te = new TestEvent("test", 31338);
        assert.isFalse(f.allowEvent(te));
        assert.isFalse(f.denyEvent(te));
    });

    it("denyEvent true", function() {
        const f = new EventFilter("deny", {sourceName: "mySourceName", all: true}, 747);
        const te = new TestEvent("test", 31339);
        assert.isTrue(f.denyEvent(te));
        assert.isFalse(f.allowEvent(te));
    });

    it("denyEvent false", function() {
        const f = new EventFilter("deny", {sourceName: "bob", all: true}, 747);
        const te = new TestEvent("test", 31340);
        assert.isFalse(f.denyEvent(te));
        assert.isFalse(f.allowEvent(te));
    });
});

describe("EventListener", function() {
    afterEach(function() {
        (testBus as any).removeAllListeners();
    });

    it("is Function", function() {
        assert.isFunction(EventListener);
    });

    // it("ignores null filterList", function() {
    //     const l = new EventListener(testBus, null, () => {});
    //     assert.strictEqual(l.filterList.length, 0);
    // });

    // it("filterList is Array", function() {
    //     const l = new EventListener(testBus, null, () => {});
    //     assert.isArray(l.filterList);
    // });

    it("adds single filter", function() {
        const f = new EventFilter("allow", {sourceType: "foo", any: true});
        const l = new EventListener((testBus as any), f, () => {});
        assert.strictEqual(l.filterList.length, 1);
    });

    it("adds filter list", function() {
        const f1 = new EventFilter("allow", {sourceType: "foo", any: true});
        const f2 = new EventFilter("allow", {sourceType: "foo", any: true});
        const fl = [f1, f2];
        const l = new EventListener((testBus as any), fl, () => {});
        assert.strictEqual(l.filterList.length, 2);
    });

    // it("adds filter after construction", function() {
    //     const f = new EventFilter("allow", {sourceType: "foo", any: true});
    //     const l = new EventListener(testBus, null, () => {});
    //     l.addFilter(f);
    //     assert.strictEqual(l.filterList.length, 1);
    // });

    // it("adds filters in any order", function() {
    //     const l = new EventListener(testBus, null, () => {});
    //     l.addFilter(new EventFilter("allow", {sourceType: "three", any: true}));
    //     l.addFilter(new EventFilter("allow", {sourceType: "one", any: true}));
    //     l.addFilter(new EventFilter("allow", {sourceType: "four", any: true}));
    //     l.addFilter(new EventFilter("allow", {sourceType: "two", any: true}));
    //     assert.isArray(l.filterList);
    //     assert.strictEqual(l.filterList.length, 4);
    //     assert.strictEqual(l.filterList[0].criteria.sourceType, "three");
    //     assert.strictEqual(l.filterList[1].criteria.sourceType, "one");
    //     assert.strictEqual(l.filterList[2].criteria.sourceType, "four");
    //     assert.strictEqual(l.filterList[3].criteria.sourceType, "two");
    // });

    // it("adds filters in priority order", function() {
    //     const l = new EventListener(testBus, null, () => {});
    //     l.addFilter(new EventFilter("allow", {sourceType: "three", any: true}, 10));
    //     l.addFilter(new EventFilter("allow", {sourceType: "one", any: true}, 1));
    //     l.addFilter(new EventFilter("allow", {sourceType: "four", any: true}, 17));
    //     l.addFilter(new EventFilter("allow", {sourceType: "two", any: true}, 3));
    //     assert.isArray(l.filterList);
    //     assert.strictEqual(l.filterList.length, 4);
    //     assert.strictEqual(l.filterList[0].criteria.sourceType, "one");
    //     assert.strictEqual(l.filterList[1].criteria.sourceType, "two");
    //     assert.strictEqual(l.filterList[2].criteria.sourceType, "three");
    //     assert.strictEqual(l.filterList[3].criteria.sourceType, "four");
    // });

    it("can mix priority and non-priority events");

    it("listens for allowed events", function() {
        assert.strictEqual(testBusListenerCount(), 0);
        const f = new EventFilter("allow", {eventType: "foo", any: true});
        const l = new EventListener((testBus as any), f, () => {});
        assert.instanceOf(l.attachedEvents, Set);
        assert.strictEqual(l.attachedEvents.size, 1);
        assert.isTrue(l.attachedEvents.has("foo"));
        assert.strictEqual(testBusListenerCount(), 1);
    });

    it("listens for all events if none specified", function() {
        assert.strictEqual(testBusListenerCount(), 0);
        const f = new EventFilter("allow", {sourceName: "foo", any: true});
        const l = new EventListener((testBus as any), f, () => {});
        assert.instanceOf(l.attachedEvents, Set);
        assert.strictEqual(l.attachedEvents.size, 2);
        assert.isTrue(l.attachedEvents.has("foo"));
        assert.isTrue(l.attachedEvents.has("bar"));
        assert.strictEqual(testBusListenerCount(), 2);
    });

    it("catches event", async function() {
        assert.strictEqual(testBusListenerCount(), 0);
        const f = new EventFilter("allow", {eventType: "foo", any: true});
        new EventListener((testBus as any), f, myCallback);
        await testBus.send(new TestEvent("foo", 42));

        function myCallback(e) {
            assert.instanceOf(e, EventBase);
        }
    });

    it("ignores event", async function() {
        assert.strictEqual(testBusListenerCount(), 0);
        const f = new EventFilter("allow", {eventType: "foo", any: true});
        new EventListener((testBus as any), f, myCallback);
        await testBus.send(new TestEvent("bar", 42));

        function myCallback() {
            assert.fail("should not have caught event");
        }

        await delay(20);
    });

    it("catches both");

    describe("listenAllList", function() {
        it("is Array", function() {
            assert.isArray(EventListener.listenAllList);
        });
    });

    describe("clearListenAll", function() {
        afterEach(function() {
            EventListener.clearListenAll();
        });

        it("catches event", async function() {
            assert.strictEqual(EventListener.listenAllList.length, 0);
            EventListener.listenAll(() => {});
            assert.strictEqual(EventListener.listenAllList.length, 1);
            EventListener.clearListenAll();
            assert.strictEqual(EventListener.listenAllList.length, 0);
        });
    });

    describe("listenAll", function() {
        afterEach(function() {
            EventListener.clearListenAll();
        });

        it("catches event", async function() {
            const cbSpy = sinon.spy();

            assert.strictEqual(EventListener.listenAllList.length, 0);
            EventListener.listenAll(cbSpy);
            assert.strictEqual(EventListener.listenAllList.length, 1);
            assert.strictEqual(cbSpy.callCount, 0);

            await testBus.send(new TestEvent("foo", 42));

            assert.strictEqual(cbSpy.callCount, 1);
            assert.strictEqual(cbSpy.args[0].length, 1);
            assert.isObject(cbSpy.args[0][0]);
            assert.strictEqual(cbSpy.args[0][0].type, "foo");
            assert.strictEqual(cbSpy.args[0][0].data, 42);
        });
    });
});
