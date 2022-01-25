const {Pipeline, PipelineStage} = require("../index");

const {assert} = require("chai");
const sinon = require("sinon");
const {delay} = require("./helpers/helpers");

let testOpts;
let test1Spy;
let test2Spy;
let test3Spy;

class Test1PipelineStage extends PipelineStage {
    constructor(name, opts) {
        super("test1", testOpts);
        this.fn = test1Spy;
        this.opts = opts;
    }
}

class Test2PipelineStage extends PipelineStage {
    constructor() {
        super("test2", testOpts);
        this.fn = test2Spy;
    }
}

class Test3PipelineStage extends PipelineStage {
    constructor() {
        super("test3", testOpts);
        this.fn = test3Spy;
    }
}

describe("Pipeline", function() {
    before(function() {
        PipelineStage.register("test1", Test1PipelineStage);
        PipelineStage.register("test2", Test2PipelineStage);
        PipelineStage.register("test3", Test3PipelineStage);
    });

    after(function() {
        PipelineStage.clearAll();
    });

    beforeEach(function() {
        test1Spy = sinon.spy(async function testFn(input) {
            return input * 2;
        });
        test2Spy = sinon.spy(async function testFn(input) {
            await delay(5);
            return input * 5;
        });
        test3Spy = sinon.spy(async function testFn(input) {
            await delay(15);
            return input * 100;
        });
        testOpts = {};
    });

    it("is function", function() {
        assert.isFunction(Pipeline);
    });

    describe("build", function() {
        it("builds from string", function() {
            let ps = Pipeline.build("test1");
            assert.instanceOf(ps, Test1PipelineStage);
            assert.isNull(ps.nextStage);
        });

        it("builds one from array", function() {
            let ps = Pipeline.build([
                "test1",
            ]);
            assert.instanceOf(ps, Test1PipelineStage);
            assert.isNull(ps.nextStage);
        });

        it("builds two from array", function() {
            let ps = Pipeline.build([
                "test1", "test2",
            ]);
            assert.instanceOf(ps, Test1PipelineStage);
            assert.instanceOf(ps.nextStage, Test2PipelineStage);
            assert.isNull(ps.nextStage.nextStage);
        });

        it("builds three from array", function() {
            let ps = Pipeline.build([
                "test1", "test2", "test3",
            ]);
            assert.instanceOf(ps, Test1PipelineStage);
            assert.instanceOf(ps.nextStage, Test2PipelineStage);
            assert.instanceOf(ps.nextStage.nextStage, Test3PipelineStage);
            assert.isNull(ps.nextStage.nextStage.nextStage);
        });

        it("builds from object", function() {
            let ps = Pipeline.build({
                test1: {foo: "bar"},
            });
            assert.instanceOf(ps, Test1PipelineStage);
            assert.isNull(ps.nextStage);
            assert.deepEqual(ps.opts, {foo: "bar"});
        });

        it("builds from serial object");
        it("throws on number");
        it("throws on undefined");
        it("throws if object has more than one key");
        it("throws if object has unknown key");
    });

    describe("run", function() {
        it("runs single stage");
        it("runs two stages");
        it("errors if no stages set");
    });

    describe("toString", function() {
        it("creates empty string");
        it("creates string from one stage");
        it("creates string from two stages");
    });

    describe("create", function() {
        it("creates a Pipeline");
        it("errors on bad name");
        it("registers Pipeline");
        it("errors if Pipeline already exists with same name");
    });

    describe("get", function() {
        it("returns Pipeline");
        it("returns undefined when not found");
    });
});
