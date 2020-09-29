const { EventBase, EventBusBase } = require("../index");

const assert = require("chai").assert;
// helpers
var testBus;
class TestEvent extends EventBase {
    get sourceType() {
        return "test";
    }

    get allowedTypes() {
        return new Set(["foo", "bar"]);
    }

    get eventBus() {
        return testBus;
    }
}
testBus = new EventBusBase(TestEvent);

describe("EventBusBase", function() {
    afterEach(() => {
        testBus.removeAllListeners();
    });

    it("is Function", function() {
        assert.isFunction(EventBusBase);
    });

    it("throws if constructed without EventBase", function() {
        assert.throws(() => {
            new EventBusBase();
        }, TypeError, "expected baseEvent arg to be class implementing EventBase");
    });

    it("throws if constructed with EventBase", function() {
        assert.throws(() => {
            new EventBusBase(EventBase);
        }, TypeError, "constructor requires a class derived from EventBase but attempted to pass EventBase itself");
    });

    it("constructs with class derived from EventBase", function() {
        new EventBusBase(TestEvent);
    });

    it("addListener", function(done) {
        let te = new TestEvent();

        testBus.addListener("foo", function (e) {
            assert.instanceOf(e, EventBase);
            assert.strictEqual(e.data, 42);
            done();
        });

        te.emit("foo", 42);
    });

    it("on", function(done) {
        let te = new TestEvent();

        testBus.on("foo", (e) => {
            assert.instanceOf(e, EventBase);
            assert.strictEqual(e.data, 43);
            done();
        });

        te.emit("foo", 43);
    });

    it("once", function(done) {
        let te = new TestEvent();

        testBus.once("foo", (e) => {
            assert.instanceOf(e, EventBase);
            assert.strictEqual(e.data, 44);
            done();
        });

        te.emit("foo", 44);
    });

    it("throws on emitting non-EventBase event", function() {
        testBus.on("blah", () => {});

        assert.throws(() => {
            testBus.emit("blah", 45);
        }, TypeError, "expected emitted event to be an instance of 'TestEvent'");
    });
});

describe("EventBase", function() {
    it("is Function", function() {
        assert.isFunction(EventBase);
    });

    it("throws if constructed", function() {
        assert.throws(() => {
            new EventBase();
        }, Error);
    });

    describe("instantiated", function() {
        it("can be constructed", function() {
            let t = new TestEvent();
            assert.instanceOf(t, EventBase);
        });

        it("can emit", function(done) {
            let t = new TestEvent();
            let d = {
                cookie: 0xDEADBEEF // mmm... beef cookies
            };

            testBus.once("foo", (e) => {
                assert.strictEqual(e.data, d);
                done();
            });

            t.emit("foo", d);
        });

        it("can emit with multiple args", function(done) {
            let t = new TestEvent();
            let d = {
                cookie: 0xDEADBEEF // mmm... beef cookies
            };

            testBus.once("foo", (e, ... args) => {
                assert.strictEqual(args.length, 3);
                assert.strictEqual(args[0], 0xBEEF);
                assert.strictEqual(args[1], "beer");
                assert.strictEqual(args[2], d);
                assert.strictEqual(e.data.length, 3);
                assert.strictEqual(e.data[0], 0xBEEF);
                assert.strictEqual(e.data[1], "beer");
                assert.strictEqual(e.data[2], d);
                done();
            });

            t.emit("foo", 0xBEEF, "beer", d);
        });

        it("throws on bad event type", function() {
            let t = new TestEvent();
            assert.throws(() => {
                t.emit("something");
            }, TypeError, "event type 'something' not one of the allowedTypes");
        });
    });

    describe("bad construction", function() {
        it("throws on abstract sourceType", function() {
            class BadTestEvent extends EventBase {
                get allowedTypes() {
                    return new Set(["foo", "bar"]);
                }

                get eventBus() {
                    return testBus;
                }
            }

            assert.throws(() => {
                new BadTestEvent();
            }, Error, "sourceType not implemented");
        });

        it("throws on wrong sourceType type", function() {
            class BadTestEvent extends EventBase {
                get sourceType() {
                    return 3;
                }

                get allowedTypes() {
                    return new Set(["foo", "bar"]);
                }

                get eventBus() {
                    return testBus;
                }
            }

            assert.throws(() => {
                new BadTestEvent();
            }, TypeError, "sourceType must be a String");
        });

        it("throws on abstract allowedTypes", function() {
            class BadTestEvent extends EventBase {
                get sourceType() {
                    return "test";
                }

                get eventBus() {
                    return testBus;
                }
            }

            assert.throws(() => {
                new BadTestEvent();
            }, Error, "allowedTypes not implemented");
        });

        it("throws on wrong allowedTypes type", function() {
            class BadTestEvent extends EventBase {
                get sourceType() {
                    return "test";
                }

                get allowedTypes() {
                    return 3;
                }

                get eventBus() {
                    return testBus;
                }
            }

            assert.throws(() => {
                new BadTestEvent();
            }, TypeError, "allowedTypes must be a Set");
        });

        it("throws on abstract eventBus", function() {
            class BadTestEvent extends EventBase {
                get sourceType() {
                    return "test";
                }

                get allowedTypes() {
                    return new Set(["foo", "bar"]);
                }
            }

            assert.throws(() => {
                new BadTestEvent();
            }, Error, "eventBus not implemented");
        });

        it("throws on wrong EventBus type", function() {
            class BadTestEvent extends EventBase {
                get sourceType() {
                    return "test";
                }

                get allowedTypes() {
                    return new Set(["foo", "bar"]);
                }

                get eventBus() {
                    return 3;
                }
            }

            assert.throws(() => {
                new BadTestEvent();
            }, TypeError, "eventBus must be an EventBusBase");
        });
    });
});