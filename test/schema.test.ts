const {assert} = require("chai");
const {Schema} = require("../index");

describe("Schema", function() {
    beforeEach(async function() {
        await Schema.init();
    });

    afterEach(async function() {
        await Schema.shutdown();
    });

    it("is a function", function() {
        assert.isFunction(Schema);
    });

    describe("loadSchema", function() {
        it("loads a file", function() {
            Schema.loadSchema("test", "./test/helpers/helperSchema.json");
        });
    });

    describe("validate", function() {
        it("validates based on name", function() {
            Schema.loadSchema("person", "./test/helpers/helperSchema.json");

            // compliant data
            let res = Schema.validate("person", {
                firstName: "John",
                lastName: "Doe",
                age: 42,
            });
            assert.isTrue(res);

            // non-compliant data: name is boolean
            res = Schema.validate("person", {
                firstName: true,
                lastName: "Doe",
                age: 42,
            });
            assert.isFalse(res);

            // non-compliant data: age is negative
            res = Schema.validate("person", {
                firstName: true,
                lastName: "Doe",
                age: -1,
            });
            assert.isFalse(res);
        });

        it("validates based on ID", function() {
            Schema.loadSchema("person", "./test/helpers/helperSchema.json");

            // compliant data
            let res = Schema.validate("https://example.com/person.schema.json", {
                firstName: "John",
                lastName: "Doe",
                age: 42,
            });
            assert.isTrue(res);

            // non-compliant data: name is boolean
            res = Schema.validate("https://example.com/person.schema.json", {
                firstName: true,
                lastName: "Doe",
                age: 42,
            });
            assert.isFalse(res);

            assert.throws(() => {
                // bad URL
                Schema.validate("https://foo.com/person.schema.json", {
                    firstName: "John",
                    lastName: "Doe",
                    age: 42,
                });
            }, Error, "Schema.validate doesn't recognize the schema: https://foo.com/person.schema.json");
        });

        it("validates schema with reference to another loaded schema", function() {
            Schema.loadSchema("person", "./test/helpers/helperSchema.json");
            Schema.loadSchema("address", "./test/helpers/helperSchemaRef.json");

            // compliant data
            let res = Schema.validate("address", {
                address: "123 Main St.",
                city: "Chicago",
                zipcode: 12345,
                person: {
                    firstName: "John",
                    lastName: "Doe",
                    age: 42,
                },
            });
            assert.isTrue(res);

            // missing address
            res = Schema.validate("address", {
                // address: "123 Main St.",
                city: "Chicago",
                zipcode: 12345,
                person: {
                    firstName: "John",
                    lastName: "Doe",
                    age: 42,
                },
            });
            assert.isFalse(res);

            // negative age
            res = Schema.validate("address", {
                address: "123 Main St.",
                city: "Chicago",
                zipcode: 12345,
                person: {
                    firstName: "John",
                    lastName: "Doe",
                    age: -1,
                },
            });
            assert.isFalse(res);
        });
    });
});
