const {PipelineStage} = require("../index");

const {assert} = require("chai");
const {delay} = require("./helpers/helpers");
const sinon = require("sinon");
let stageSpy;
let testOpts;

function testConvFn() {}

class TestPipelineStage extends PipelineStage {
    constructor() {
        super("test", testOpts);
        this.fn = stageSpy;
    }
}

describe("PipelineStage", function() {
    beforeEach(function() {
        stageSpy = sinon.spy(async function testFn(input) {
            await delay(5);
            return input * 2;
        });
        testOpts = {};
    });

    afterEach(function() {
        PipelineStage.clearConverters();
        PipelineStage.clearAll();
    });

    describe("register", function() {
        it("does register", function() {
            PipelineStage.register("test", TestPipelineStage);
        });

        it("throws on duplicate", function() {
            PipelineStage.register("test", TestPipelineStage);
            assert.throws(() => {
                PipelineStage.register("test", TestPipelineStage);
            }, Error, "PipelineStage.register: 'test' already registered");
        });

        it("allows force", function() {
            PipelineStage.register("test", TestPipelineStage);
            PipelineStage.register("test", TestPipelineStage, true);
        });
    });

    describe("create", function() {
        it("returns new pipeline stage", function() {
            PipelineStage.register("test", TestPipelineStage);
            let ret = PipelineStage.create("test");
            assert.instanceOf(ret, TestPipelineStage);
        });

        it("throws if not found", function() {
            assert.throws(() => {
                PipelineStage.create("foo");
            }, Error, "PipelineStage.create: 'foo' not found");
        });
    });

    describe("setOutput", function() {
        it("chains a stage", function() {
            PipelineStage.register("test", TestPipelineStage);
            let s1 = PipelineStage.create("test");
            let s2 = PipelineStage.create("test");
            assert.isNull(s1.nextStage);
            s1.setOutput(s2);
            assert.strictEqual(s1.nextStage, s2);
        });

        it("throws if types are incompatible", function() {
            PipelineStage.register("test", TestPipelineStage);
            testOpts = {outputType: "foo"};
            let s1 = PipelineStage.create("test");
            testOpts = {inputType: "bar"};
            let s2 = PipelineStage.create("test");
            assert.throws(() => {
                s1.setOutput(s2);
            }, Error, "PipelineStage.addOutput: test outputs 'foo', cannot convert to 'bar' for test");
        });
    });

    describe("run", function() {
        it("runs the stage", async function() {
            PipelineStage.register("test", TestPipelineStage);
            let s = PipelineStage.create("test");
            assert.strictEqual(stageSpy.callCount, 0);
            let p = s.run(16);
            assert.strictEqual(stageSpy.callCount, 1);
            assert.instanceOf(p, Promise);
            let res = await p;
            assert.strictEqual(res, 32);
        });

        it("runs the stage and the following stage", async function() {
            PipelineStage.register("test", TestPipelineStage);
            let s1 = PipelineStage.create("test");
            let s2 = PipelineStage.create("test");
            s1.setOutput(s2);
            assert.strictEqual(stageSpy.callCount, 0);
            let res = await s1.run(16);
            assert.strictEqual(stageSpy.callCount, 2);
            assert.strictEqual(res, 64);
        });

        it("converts types", async function() {
            PipelineStage.register("test", TestPipelineStage);
            PipelineStage.registerConverter("bigger", "smaller", (input) => input - 31);
            testOpts = {outputType: "bigger"};
            let s1 = PipelineStage.create("test");
            testOpts = {inputType: "smaller"};
            let s2 = PipelineStage.create("test");
            s1.setOutput(s2);
            assert.strictEqual(stageSpy.callCount, 0);
            let res = await s1.run(16);
            assert.strictEqual(stageSpy.callCount, 2);
            assert.strictEqual(res, 2);
        });
    });

    describe("registerConverter", function() {
        it("registers a converter", function() {
            PipelineStage.registerConverter("test-input", "test-output", testConvFn);
        });

        it("registers multiple to same input type", function() {
            PipelineStage.registerConverter("test-input", "test-output1", testConvFn);
            PipelineStage.registerConverter("test-input", "test-output2", testConvFn);
        });

        it("throws if exists", function() {
            PipelineStage.registerConverter("test-input", "test-output", testConvFn);
            assert.throws(() => {
                PipelineStage.registerConverter("test-input", "test-output", testConvFn);
            }, Error, "PipelineStage.registerConverter: 'test-input -> test-output' already registered");
        });
    });

    describe("findConverter", function() {
        it("can find a function", function() {
            PipelineStage.registerConverter("test-input", "test-output", testConvFn);
            let fn = PipelineStage.findConverter("test-input", "test-output");
            assert.strictEqual(fn, testConvFn);
        });

        it("returns null if input not found", function() {
            let ret = PipelineStage.findConverter("foo", "test-output");
            assert.isNull(ret);
        });

        it("returns null if output not found", function() {
            PipelineStage.registerConverter("test-input", "test-output", testConvFn);
            let ret = PipelineStage.findConverter("test-input", "bar");
            assert.isNull(ret);
        });

        it("returns default converter if types are the same", function() {
            const val = "oogie boogie";
            let fn = PipelineStage.findConverter("test-type", "test-type");
            let res = fn(val);
            assert.strictEqual(res, val);
        });
    });
});
