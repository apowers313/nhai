const {assert} = require("chai");
const {Intrinsic, Component, Significance} = require("..");

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

        it("emits 'change'", function(done) {
            let i = new Intrinsic("test");
            Significance.eventBus.on("change", (e) => {
                assert.strictEqual(e.type, "change");
                assert.strictEqual(e.data, 3.14159);
                done();
            });
            i.value = 3.14159;
        });
    });
});
