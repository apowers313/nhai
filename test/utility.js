const {assert} = require("chai");

const {Utility} = require("../index");
const {checkType, checkInstance} = Utility;

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
});
