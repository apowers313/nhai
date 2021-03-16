const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {assert} = chai;

const {Intrinsic, Component, Significance} = require("..");

// helpers
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe("Intrinsic", function() {
    afterEach(function() {
        Component.clearList();
        Significance.eventBus.removeAllListeners();
    });

    it("is Component", function() {
        assert.isFunction(Intrinsic);
        assert.instanceOf(Intrinsic.prototype, Component);
    });

    describe("value", function() {
        it("accepts string", async function() {
            let i = new Intrinsic("test");
            await i.setValue("99");
            assert.isNumber(i.getValue());
            assert.strictEqual(i.getValue(), 99);
        });

        it("accepts integer", async function() {
            let i = new Intrinsic("test");
            await i.setValue(42);
            assert.isNumber(i.getValue());
            assert.strictEqual(i.getValue(), 42);
        });

        it("accepts float string", async function() {
            let i = new Intrinsic("test");
            await i.setValue("3.14159");
            assert.isNumber(i.getValue());
            assert.strictEqual(i.getValue(), 3.14159);
        });

        it("accepts float", async function() {
            let i = new Intrinsic("test");
            await i.setValue(3.14159);
            assert.isNumber(i.getValue());
            assert.strictEqual(i.getValue(), 3.14159);
        });

        it("throws on unrecognized string", async function() {
            let i = new Intrinsic("test");
            return assert.isRejected(i.setValue("hi there!"), TypeError, "Intrinsic#defaultConverter couldn't parse string as float: 'hi there!'");
        });

        it("throws on value less than min", async function() {
            let i = new Intrinsic("test");
            return assert.isRejected(i.setValue(-1), RangeError, "Intrinsic.setValue: attempted to set value (-1) less than min (0)");
        });

        it("throws on value greater than max", async function() {
            let i = new Intrinsic("test");
            return assert.isRejected(i.setValue(101), RangeError, "Intrinsic.setValue: attempted to set value (101) greater than max (100)");
        });

        it("can be overloaded", async function() {
            const goldValue = "\\G1EBC091E:3";
            const goldRegex = /^\\G[A-F0-9]{8}:(?<goldval>[0-9]*)$/;

            class GoldIntrinsic extends Intrinsic {
                setValue(val) {
                    super.setValue(val.match(goldRegex).groups.goldval);
                }
            }

            let gi = new GoldIntrinsic("gold");
            await gi.setValue(goldValue);
            assert.isNumber(gi.getValue());
            assert.strictEqual(gi.getValue(), 3);
        });

        it("custom converter", async function() {
            function goldConverter(val) {
                const goldRegex = /^\\G[A-F0-9]{8}:(?<goldval>[0-9]*)$/;
                return Intrinsic.defaultConverter(val.match(goldRegex).groups.goldval);
            }

            let gi = new Intrinsic("gold", {
                converter: goldConverter,
            });

            await gi.setValue("\\G1EBC091E:4");
            assert.isNumber(gi.getValue());
            assert.strictEqual(gi.getValue(), 4);
        });

        it("emits 'change'", async function(done) {
            let i = new Intrinsic("test");
            Significance.eventBus.on("change", (e) => {
                assert.strictEqual(e.type, "change");
                assert.isObject(e.data);
                assert.strictEqual(e.data.oldVal, null);
                assert.strictEqual(e.data.newVal, 3.14159);
                assert.strictEqual(e.data.intrinsic, i);
                done();
            });
            await i.setValue(3.14159);
        });

        it("doesn't emit change if value is the same", async function() {
            let i = new Intrinsic("test");
            await i.setValue(3.14159);
            Significance.eventBus.on("change", () => {
                assert.fail("should not have emitted change event");
            });
            await i.setValue(3.14159);
            await delay(10);
        });

        describe("options", function() {
            describe("min", function() {
                it("default 0", function() {
                    let i = new Intrinsic("test");
                    assert.strictEqual(i.min, 0);
                });

                it("sets through opts", function() {
                    let i = new Intrinsic("test", {min: -10});
                    assert.strictEqual(i.min, -10);
                });

                it("is read only", function() {
                    let i = new Intrinsic("test", {min: -10});
                    assert.strictEqual(i.min, -10);
                    i.min = 3;
                    assert.strictEqual(i.min, -10);
                });
            });

            describe("max", function() {
                it("default 0", function() {
                    let i = new Intrinsic("test");
                    assert.strictEqual(i.max, 100);
                });

                it("sets through opts", function() {
                    let i = new Intrinsic("test", {max: 1000});
                    assert.strictEqual(i.max, 1000);
                });

                it("is read only", function() {
                    let i = new Intrinsic("test", {max: 1000});
                    assert.strictEqual(i.max, 1000);
                    i.max = 12;
                    assert.strictEqual(i.max, 1000);
                });
            });

            describe("positive", function() {
                it("default false", function() {
                    let i = new Intrinsic("test");
                    assert.strictEqual(i.positive, false);
                });

                it("sets through opts", function() {
                    let i = new Intrinsic("test", {positive: true});
                    assert.strictEqual(i.positive, true);
                });

                it("sets through opts (truthy)", function() {
                    let i = new Intrinsic("test", {positive: 1});
                    assert.strictEqual(i.positive, true);
                });

                it("sets through opts (falsy)", function() {
                    let i = new Intrinsic("test", {positive: 0});
                    assert.strictEqual(i.positive, false);
                });

                it("is read only", function() {
                    let i = new Intrinsic("test", {positive: true});
                    assert.strictEqual(i.positive, true);
                    i.positive = false;
                    assert.strictEqual(i.positive, true);
                });
            });

            it("throws if min is greater than max", function() {
                assert.throws(() => {
                    new Intrinsic("test", {min: 5, max: 4});
                }, RangeError, "Intrinsic.constructor: opts.min must be less than opts.max");
            });

            it("throws if min is the same as max", function() {
                assert.throws(() => {
                    new Intrinsic("test", {min: 5, max: 5});
                }, RangeError, "Intrinsic.constructor: opts.min must be less than opts.max");
            });
        });
    });

    describe("range", function() {
        it("works with positive", function() {
            let i = new Intrinsic("test1", {
                min: 0,
                max: 42,
            });
            assert.strictEqual(i.range, 42);

            i = new Intrinsic("test2", {
                min: 10,
                max: 50,
            });
            assert.strictEqual(i.range, 40);
        });

        it("works with negative", function() {
            let i = new Intrinsic("test1", {
                min: -10,
                max: 30,
            });
            assert.strictEqual(i.range, 40);

            i = new Intrinsic("test2", {
                min: -10,
                max: 0,
            });
            assert.strictEqual(i.range, 10);

            i = new Intrinsic("test3", {
                min: -10,
                max: -5,
            });
            assert.strictEqual(i.range, 5);
        });
    });

    describe("normalizedValue", function() {
        it("returns zero", async function() {
            let i = new Intrinsic("test1", {
                min: 0,
                max: 42,
            });
            await i.setValue(0);
            assert.strictEqual(i.normalizedValue, 0);

            i = new Intrinsic("test2", {
                min: 10,
                max: 42,
            });
            await i.setValue(10);
            assert.strictEqual(i.normalizedValue, 0);

            i = new Intrinsic("test3", {
                min: -10,
                max: 42,
            });
            await i.setValue(-10);
            assert.strictEqual(i.normalizedValue, 0);
        });

        it("returns one", async function() {
            let i = new Intrinsic("test1", {
                min: 0,
                max: 42,
            });
            await i.setValue(42);
            assert.strictEqual(i.normalizedValue, 1);

            i = new Intrinsic("test2", {
                min: -10,
                max: 0,
            });
            await i.setValue(0);
            assert.strictEqual(i.normalizedValue, 1);
        });

        it("works with positive", async function() {
            let i = new Intrinsic("test1", {
                min: 5,
                max: 30,
            });
            await i.setValue(10);
            assert.strictEqual(i.normalizedValue, 0.2);
            await i.setValue(25);
            assert.strictEqual(i.normalizedValue, 0.8);

            i = new Intrinsic("test2", {
                min: 20,
                max: 120,
            });
            await i.setValue(40);
            assert.strictEqual(i.normalizedValue, 0.2);
            await i.setValue(100);
            assert.strictEqual(i.normalizedValue, 0.8);
        });

        it("works with negative", async function() {
            let i = new Intrinsic("test3", {
                min: -43,
                max: 57,
            });
            await i.setValue(-33);
            assert.strictEqual(i.normalizedValue, 0.1);
        });
    });
});
