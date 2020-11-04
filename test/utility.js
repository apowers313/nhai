const {assert} = require("chai");

const {Utility} = require("../index");
const {checkType, checkInstance, randomSeed, randomFloat, randomInt} = Utility;

// helpers
class TestClass {}

class OtherClass {}

describe("Utility", function() {
    describe("checkType", function() {
        it("throws on wrong type", function() {
            assert.throws(() => {
                checkType("myFn", "testVal", 3, "string");
            }, TypeError, "myFn expected 'testVal' to be a string, got: 3");
        });

        it("allows right type", function() {
            checkType("myFn", "testVal", 3, "number");
        });

        it("allows class", function() {
            checkType("myFn", "testClass", TestClass, "class");
        });

        it("throws if class is not function", function() {
            let testClass = new TestClass();
            assert.throws(() => {
                checkType("myFn", "testClass", testClass, "class");
            }, TypeError, "myFn expected 'testClass' to be a class, got: [object Object]");
        });

        it("throws if class is undefined", function() {
            assert.throws(() => {
                checkType("myFn", "testClass", undefined, "class");
            }, TypeError, "myFn expected 'testClass' to be a class, got: undefined");
        });

        // it("throws if class is not declared as class", function() {
        //     function testClass() {}
        //     assert.throws(() => {
        //         checkType("myFn", "testClass", testClass, "class");
        //     }, TypeError, "myFn expected 'testClass' to be a class");
        // });
    });

    describe("checkInstance", function() {
        it("throws on wrong instance", function() {
            assert.throws(() => {
                let otherClass = new OtherClass();
                checkInstance("myFn", "otherClass", otherClass, TestClass);
            }, TypeError, "myFn expected 'otherClass' to be instanceof TestClass, got: OtherClass");
        });

        it("throws on non-object", function() {
            assert.throws(() => {
                checkInstance("myFn", "otherClass", 3, TestClass);
            }, TypeError, "myFn expected 'otherClass' to be a object, got: 3");
        });

        it("throws on undefined", function() {
            assert.throws(() => {
                checkInstance("myFn", "otherClass", undefined, TestClass);
            }, TypeError, "myFn expected 'otherClass' to be a object, got: undefined");
        });

        it("allows right instance", function() {
            let testClass = new TestClass();
            checkInstance("myFn", "testClass", testClass, TestClass);
        });
    });

    describe("random", function() {
        it("returns random float", function() {
            let f = randomFloat();
            assert.isNumber(f);
            assert.isFalse(f % 1 === 0);
        });

        it("returns random int", function() {
            let i = randomInt();
            assert.isNumber(i);
            assert.isTrue(i % 1 === 0);
        });

        it("returns same sequence for same seed", function() {
            randomSeed("hello.");
            assert.strictEqual(randomFloat(), 0.9282578795792454);
            assert.strictEqual(randomFloat(), 0.3752569768646784);
            assert.strictEqual(randomFloat(), 0.7316977468919549);
        });

        it("returns different sequence for different seed", function() {
            randomSeed("hello!");
            assert.notStrictEqual(randomFloat(), 0.9282578795792454);
            assert.notStrictEqual(randomFloat(), 0.3752569768646784);
            assert.notStrictEqual(randomFloat(), 0.7316977468919549);
        });

        it("accepts integer seed", function() {
            randomSeed(3);
            assert.strictEqual(randomFloat(), 0.7568531143538124);
            assert.strictEqual(randomFloat(), 0.6138858151827953);
            assert.strictEqual(randomFloat(), 0.9803335113014127);
        });

        it("accepts object seed", function() {
            randomSeed({foo: "bar"});
            assert.strictEqual(randomFloat(), 0.3799992233952366);
            assert.strictEqual(randomFloat(), 0.7128710993724056);
            assert.strictEqual(randomFloat(), 0.6180286446270832);
        });

        it("accepts date seed", function() {
            randomSeed(new Date(0));
            assert.strictEqual(randomFloat(), 0.45849928108785903);
            assert.strictEqual(randomFloat(), 0.41759607379639296);
            assert.strictEqual(randomFloat(), 0.9148432874951367);
            randomSeed(new Date(0));
            console.warn("Date(0)", new Date(0));
            console.warn("randomoFloat", randomFloat());
        });

        it("undefined seed is non-deterministic", function() {
            randomSeed();
            let r1 = randomFloat();
            let r2 = randomFloat();
            let r3 = randomFloat();
            randomSeed();
            assert.notStrictEqual(randomFloat(), r1);
            assert.notStrictEqual(randomFloat(), r2);
            assert.notStrictEqual(randomFloat(), r3);
        });

        it("null seed is non-deterministic", function() {
            randomSeed(null);
            let r1 = randomFloat();
            let r2 = randomFloat();
            let r3 = randomFloat();
            randomSeed(null);
            assert.notStrictEqual(randomFloat(), r1);
            assert.notStrictEqual(randomFloat(), r2);
            assert.notStrictEqual(randomFloat(), r3);
        });
    });
});
