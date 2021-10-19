const {TransientObject} = require("..");
const {assert} = require("chai");

describe("TransientObject", function() {
    it("is a Function", function() {
        assert.isFunction(TransientObject);
    });

    describe("options", function() {
        describe("id", function() {
            it("sets id", function() {
                let to = new TransientObject({id: 123});
                assert.strictEqual(to.id, 123);
            });
        });

        describe("props", function() {
            it("sets all props", function() {
                let to = new TransientObject({props: ["foo", "bar"]});
                // eslint-disable-next-line no-prototype-builtins
                assert.isTrue(to.hasOwnProperty("foo"));
                // eslint-disable-next-line no-prototype-builtins
                assert.isTrue(to.hasOwnProperty("foo"));
                to.foo = 1;
                to.bar = "beer";
                assert.strictEqual(to.foo, 1);
                assert.strictEqual(to.bar, "beer");
                assert.isUndefined(to.data.foo);
                assert.isUndefined(to.data.bar);
                assert.deepEqual(to.toString(), "{}");
            });
        });
    });

    describe("Proxy", function() {
        describe("getter", function() {
            it("throws if not loaded", function() {
                let to = new TransientObject();

                assert.throws(() => {
                    // eslint-disable-next-line no-unused-vars
                    let x = to.foo;
                }, Error, "can't get value 'foo' before loading TransientObject");
            });

            it("intercepts getter", async function() {
                let to = new TransientObject();
                await to.load();

                assert.isFalse(to.isDirty);
                assert.isUndefined(to.foo);
            });
        });

        describe("setter", function() {
            it("throws if not loaded", function() {
                let to = new TransientObject();

                assert.throws(() => {
                    to.foo = "bar";
                }, Error, "can't set value 'foo' before loading TransientObject");
            });

            it("setter for defined value", async function() {
                let to = new TransientObject();
                await to.load();

                assert.isFalse(to.isDirty);
                to.isDirty = true;
                assert.isTrue(to.isDirty);
            });

            it("setter for undefined value", async function() {
                let to = new TransientObject();
                await to.load();

                assert.isUndefined(to.foo);
                assert.strictEqual(Object.keys(to.data).length, 0);

                to.foo = "bar";

                assert.strictEqual(to.foo, "bar");
                assert.strictEqual(Object.keys(to.data).length, 1);
                assert.deepEqual(to.data, {foo: "bar"});
            });

            it("intercepts deep setter for defined value");
        });
    });

    describe("cache", function() {
        it("retreives object with same ID", function() {
            let to1 = new TransientObject({id: 123});
            let to2 = new TransientObject({id: 123});

            assert.strictEqual(to1, to2);
        });

        it("deletes object", async function() {
            let to = new TransientObject({id: 123});
            assert.isTrue(TransientObject.cache.has(123));

            await to.delete();

            assert.isFalse(TransientObject.cache.has(123));
        });

        it("deleteId succeeds", async function() {
            new TransientObject({id: 123});
            assert.isTrue(TransientObject.cache.has(123));

            let ret = await TransientObject.deleteId(123);

            assert.isTrue(ret);
            assert.isFalse(TransientObject.cache.has(123));
        });

        it("deleteId fails", async function() {
            let ret = await TransientObject.deleteId(456);

            assert.isFalse(ret);
        });
    });

    it("toString", async function() {
        let to = new TransientObject();
        await to.load();

        to.beer = "yum";
        assert.strictEqual(to.toString(), "{\"beer\":\"yum\"}");
    });

    it("toJson", async function() {
        let to = new TransientObject();
        await to.load();

        to.beer = "yum";
        assert.strictEqual(to.toJson(), "{\"beer\":\"yum\"}");
    });
});
