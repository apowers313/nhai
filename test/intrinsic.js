const {assert} = require("chai");
const {Intrinsic, Component, Significance} = require("..");

describe("Intrinsic", function() {
    afterEach(function() {
        Component.clearList();
        Intrinsic.clearList();
        Significance.eventBus.removeAllListeners();
    });

    it("is Component", function() {
        assert.isFunction(Intrinsic);
        assert.instanceOf(Intrinsic.prototype, Component);
    });

    describe("value", function() {
        it("accepts string", function() {
            let i = new Intrinsic("test");
            i.value = "747";
            assert.isNumber(i.value);
            assert.strictEqual(i.value, 747);
        });

        it("accepts integer", function() {
            let i = new Intrinsic("test");
            i.value = 42;
            assert.isNumber(i.value);
            assert.strictEqual(i.value, 42);
        });

        it("accepts float string", function() {
            let i = new Intrinsic("test");
            i.value = "3.14159";
            assert.isNumber(i.value);
            assert.strictEqual(i.value, 3.14159);
        });

        it("accepts float", function() {
            let i = new Intrinsic("test");
            i.value = 3.14159;
            assert.isNumber(i.value);
            assert.strictEqual(i.value, 3.14159);
        });

        it("throws on unrecognized string", function() {
            let i = new Intrinsic("test");
            assert.throws(() => {
                i.value = "hi there!";
            }, TypeError, "Intrinsic#defaultConverter couldn't parse string as float: 'hi there!'");
        });

        it("can be overloaded", function() {
            const goldValue = "\\G1EBC091E:3";
            const goldRegex = /^\\G[A-F0-9]{8}:(?<goldval>[0-9]*)$/;

            class GoldIntrinsic extends Intrinsic {
                set value(val) {
                    super.value = val.match(goldRegex).groups.goldval;
                }

                get value() {
                    return this._value;
                }
            }

            let gi = new GoldIntrinsic("gold");
            gi.value = goldValue;
            assert.isNumber(gi.value);
            assert.strictEqual(gi.value, 3);
        });

        it("custom converter", function() {
            function goldConverter(val) {
                const goldRegex = /^\\G[A-F0-9]{8}:(?<goldval>[0-9]*)$/;
                return Intrinsic.defaultConverter(val.match(goldRegex).groups.goldval);
            }

            let gi = new Intrinsic("gold", {
                converter: goldConverter,
            });

            gi.value = "\\G1EBC091E:4";
            assert.isNumber(gi.value);
            assert.strictEqual(gi.value, 4);
        });

        it("emits 'change'", function(done) {
            let i = new Intrinsic("test");
            Significance.eventBus.on("change", (e) => {
                assert.strictEqual(e.type, "change");
                assert.isObject(e.data);
                assert.strictEqual(e.data.oldVal, null);
                assert.strictEqual(e.data.newVal, 3.14159);
                assert.strictEqual(e.data.intrinsic, i);
                done();
            });
            i.value = 3.14159;
        });

        it("doesn't emit change if value is the same", function(done) {
            let i = new Intrinsic("test");
            i.value = 3.14159;
            Significance.eventBus.on("change", () => {
                assert.fail("should not have emitted change event");
            });
            i.value = 3.14159;
            setTimeout(done, 10);
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
        });
    });
});
