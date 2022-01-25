const {TransientObject} = require("..");
const {assert} = require("chai");

describe("TransientObject", function() {
    afterEach(function() {
        TransientObject.cache.clear();
    });

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

        // describe("types", function() {
        //     it("sets types to specified array", function() {
        //         let t = ["foo", "bar"];
        //         let to = new TransientObject({types: t});
        //         assert.isArray(to.types);
        //         assert.strictEqual(to.types.length, 2);
        //         assert.strictEqual(to.types, t);
        //     });

        //     it("converts single string to array", function() {
        //         let to = new TransientObject({types: "beer"});
        //         assert.isArray(to.types);
        //         assert.strictEqual(to.types.length, 1);
        //         assert.strictEqual(to.types[0], "beer");
        //     });

        //     it("throws if not array", function() {
        //         assert.throws(() => {
        //             new TransientObject({types: 5});
        //         }, TypeError, "TransientObject.constructor expected 'opts.types' to be a object, got: 5");
        //     });

        //     it("throws if not array of strings", function() {
        //         assert.throws(() => {
        //             new TransientObject({types: ["beer", 42]});
        //         }, TypeError, "TransientObject.constructor expected 'opts.types[1]' to be a string, got: 42");
        //     });
        // });
    });

    describe("Proxy", function() {
        describe("getter", function() {
            it("throws if not loaded", function() {
                let to = new TransientObject({id: 123});

                assert.throws(() => {
                    // eslint-disable-next-line no-unused-vars
                    let x = to.foo;
                }, Error, "can't get value 'foo' before loading TransientObject");
            });

            it("intercepts getter", async function() {
                let to = new TransientObject({id: 123});
                await to.load();

                assert.isFalse(to.isDirty);
                assert.isUndefined(to.foo);
            });
        });

        describe("setter", function() {
            it("throws if not loaded", function() {
                let to = new TransientObject({id: 123});

                assert.throws(() => {
                    to.foo = "bar";
                }, Error, "can't set value 'foo' before loading TransientObject");
            });

            it("setter for defined value", async function() {
                let to = new TransientObject({id: 123});
                await to.load();

                assert.isFalse(to.isDirty);
                to.isDirty = true;
                assert.isTrue(to.isDirty);
            });

            it("setter for undefined value", async function() {
                let to = new TransientObject();

                assert.isUndefined(to.foo);
                assert.strictEqual(Object.keys(to.data).length, 0);

                to.foo = "bar";

                assert.strictEqual(to.foo, "bar");
                assert.strictEqual(Object.keys(to.data).length, 1);
                assert.deepEqual(to.data, {foo: "bar"});
            });

            it("intercepts deep setter for defined value");

            it("validates object", function() {
                let to = new TransientObject();
                to.setValidator = (p, v) => {
                    if (typeof v === "object") {
                        throw new Error("don't set to object");
                    }
                };

                assert.throws(() => {
                    to.foo = {test: "obj"};
                }, Error, "don't set to object");
            });

            it("throws if array");
        });
    });

    describe("free", function() {
        it("removes object from cache", async function() {
            let to = new TransientObject({id: 123});
            assert.isTrue(TransientObject.cache.has(123));

            await to.free();

            assert.isFalse(TransientObject.cache.has(123));
        });
    });

    describe("cache", function() {
        it("retreives object with same ID", function() {
            let to1 = new TransientObject({id: 123});
            let to2 = new TransientObject({id: 123});

            assert.strictEqual(to1, to2);
        });

        it("freeId succeeds", async function() {
            new TransientObject({id: 123});
            assert.isTrue(TransientObject.cache.has(123));

            let ret = await TransientObject.freeId(123);

            assert.isTrue(ret);
            assert.isFalse(TransientObject.cache.has(123));
        });

        it("freeId fails", async function() {
            let ret = await TransientObject.freeId(456);

            assert.isFalse(ret);
        });
    });

    it("toString", async function() {
        let to = new TransientObject();

        to.beer = "yum";
        assert.strictEqual(to.toString(), "{\"beer\":\"yum\"}");
    });

    it("toJSON", async function() {
        let to = new TransientObject();

        to.beer = "yum";
        assert.strictEqual(to.toJSON(), "{\"beer\":\"yum\"}");
    });

    describe("toCypherMap", function() {
        it("converts all data types", function() {
            let to = new TransientObject();
            to.str = "test";
            to.num = 42;
            to.bool = true;

            let str = to.toCypherMap();

            assert.strictEqual(str, "{ str: 'test', num: 42, bool: true }");
        });
    });

    describe("isDirty", function() {
        it("is true on new with no ID", function() {
            let to = new TransientObject();
            assert.isTrue(to.isDirty);
        });

        it("is false on new with ID", function() {
            let to = new TransientObject({id: 123});
            assert.isFalse(to.isDirty);
        });

        it("is false after load", async function() {
            let to = new TransientObject({id: 123});
            assert.isFalse(to.isDirty);
            await to.load();
            assert.isFalse(to.isDirty);
        });

        it("is false after store", async function() {
            let to = new TransientObject();
            assert.isTrue(to.isDirty);
            await to.store();
            assert.isFalse(to.isDirty);
        });

        it("is true after setting data prop", async function() {
            let to = new TransientObject({id: 123});
            assert.isFalse(to.isDirty);
            await to.load();
            assert.isFalse(to.isDirty);
            to.foo = "bar";
            assert.isTrue(to.isDirty);
        });

        it("is false after setting node prop", async function() {
            let to = new TransientObject({id: 123, props: ["foo"]});
            assert.isFalse(to.isDirty);
            to.foo = "bar";
            assert.isFalse(to.isDirty);
        });

        it("is true after adding edge");
        it("is true after removing edge");
    });

    describe("isLoaded", function() {
        it("is true on new with no ID", function() {
            let to = new TransientObject();
            assert.isTrue(to.isLoaded);
        });

        it("is false on new with ID", function() {
            let to = new TransientObject({id: 123});
            assert.isFalse(to.isLoaded);
        });

        it("is true after load", async function() {
            let to = new TransientObject({id: 123});
            assert.isFalse(to.isLoaded);
            await to.load();
            assert.isTrue(to.isLoaded);
        });
    });

    describe("load", function() {
        it("returns if loaded");

        it("errors if dirty", function(done) {
            let to = new TransientObject();
            to.foo = "bar";
            to.load()
                .then(() => {
                    throw Error("Should not load with dirty data");
                })
                .catch((e) => {
                    assert.strictEqual(e.message, "Loading node after modifying data will result in data loss");
                    done();
                });
        });
    });

    describe("addType", function() {
        it("starts empty", function() {
            let to = new TransientObject();
            assert.isArray(to.types);
            assert.strictEqual(to.types.length, 0);
        });

        it("adds type", function() {
            let to = new TransientObject();
            to.addType("foo");
            assert.isArray(to.types);
            assert.strictEqual(to.types.length, 1);
            assert.strictEqual(to.types[0], "foo");
        });

        // it("adds in order", function() {
        //     let to = new TransientObject();
        //     to.addType("foo");
        //     to.addType("bar");
        //     to.addType("baz");
        //     assert.isArray(to.types);
        //     assert.strictEqual(to.types.length, 3);
        //     assert.strictEqual(to.types[0], "foo");
        //     assert.strictEqual(to.types[1], "bar");
        //     assert.strictEqual(to.types[2], "baz");
        // });
    });

    describe("cypherTypes", function() {
        it("passes back empty string", function() {
            let to = new TransientObject();
            let str = to.cypherTypes();
            assert.strictEqual(str, "");
        });

        it("prepends colon", function() {
            let to = new TransientObject();
            to.addType("foo");
            let str = to.cypherTypes();
            assert.strictEqual(str, ":foo");
        });

        // it("creates colon separated list", function() {
        //     let to = new TransientObject();
        //     to.addType("foo");
        //     to.addType("bar");
        //     to.addType("baz");
        //     let str = to.cypherTypes();
        //     assert.strictEqual(str, ":foo:bar:baz");
        // });
    });
});
