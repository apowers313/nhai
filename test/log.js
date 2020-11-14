/* eslint-disable no-control-regex */

const {Log, Config} = require("../index");
const {assert} = require("chai");
const stdMocks = require("std-mocks");

const newStream = {
    name: "newStream",
    stream: process.stderr,
    level: "fatal",
};

describe("Log", function() {
    beforeEach(function() {
        Log.init();
    });

    it("is Function", function() {
        assert.isFunction(Log);
    });

    it("log at all levels", function() {
        stdMocks.use();
        Log.trace("trace uno");
        Log.debug("debug deux");
        Log.info("info thrice");
        Log.warn("warn fier");
        Log.error("error go");
        Log.fatal("fatal roku");
        stdMocks.restore();

        let output = stdMocks.flush();
        assert.strictEqual(output.stdout.length, 6);
        assert.strictEqual(output.stderr.length, 0);
        assert.match(output.stdout[0], /^.*nhai TRACE: \u001b\[37mtrace uno\u001b\[39m\n$/);
        assert.match(output.stdout[1], /^.*nhai DEBUG: \u001b\[36mdebug deux\u001b\[39m\n$/);
        assert.match(output.stdout[2], /^.*nhai INFO: {2}\u001b\[32minfo thrice\u001b\[39m\n$/);
        assert.match(output.stdout[3], /^.*nhai WARN: {2}\u001b\[33mwarn fier\u001b\[39m\n$/);
        assert.match(output.stdout[4], /^.*nhai ERROR: \u001b\[31merror go\u001b\[39m\n$/);
        assert.match(output.stdout[5], /^.*nhai FATAL: \u001b\[41mfatal roku\u001b\[49m\n$/);
    });

    it("child logger", function() {
        let l = new Log("baby");
        stdMocks.use();
        l.trace("trace uno");
        l.debug("debug deux");
        l.info("info thrice");
        l.warn("warn fier");
        l.error("error go");
        l.fatal("fatal roku");
        stdMocks.restore();

        let output = stdMocks.flush();
        assert.strictEqual(output.stdout.length, 6);
        assert.strictEqual(output.stderr.length, 0);
        assert.match(output.stdout[0], /^.*nhai TRACE: \[baby\] \u001b\[37mtrace uno\u001b\[39m\n$/);
        assert.match(output.stdout[1], /^.*nhai DEBUG: \[baby\] \u001b\[36mdebug deux\u001b\[39m\n$/);
        assert.match(output.stdout[2], /^.*nhai INFO: {2}\[baby\] \u001b\[32minfo thrice\u001b\[39m\n$/);
        assert.match(output.stdout[3], /^.*nhai WARN: {2}\[baby\] \u001b\[33mwarn fier\u001b\[39m\n$/);
        assert.match(output.stdout[4], /^.*nhai ERROR: \[baby\] \u001b\[31merror go\u001b\[39m\n$/);
        assert.match(output.stdout[5], /^.*nhai FATAL: \[baby\] \u001b\[41mfatal roku\u001b\[49m\n$/);
    });

    it("prints to stdout", function() {
        assert.strictEqual(Config.get("app-name"), "nhai");

        stdMocks.use();
        Log.info("this is a test");
        stdMocks.restore();

        let output = stdMocks.flush();
        assert.strictEqual(output.stdout.length, 1);
        assert.strictEqual(output.stderr.length, 0);
        assert.match(output.stdout[0], /^.*nhai INFO: {2}\u001b\[32mthis is a test\u001b\[39m\n$/);

        // If testing against raw JSON output:
        // let logObj = JSON.parse(output.stdout[0]);
        // assert.strictEqual(logObj.name, "nhai");
        // assert.strictEqual(logObj.msg, "this is a test");
    });

    describe("getLogger", function() {
        it("returns singleton", function() {
            let l1 = Log.getLogger();
            let l2 = Log.getLogger();
            assert.strictEqual(l1, l2);
            assert.isArray(l1.streams);
            assert.strictEqual(l1.streams.length, Config.get("log-file-enabled") ? 2 : 1);
            // console.log("logger", l1);
        });
    });

    describe("setStdoutLevel", function() {
        it("sets the current logging level", function() {
            Log.setStdoutLevel("trace");
            stdMocks.use();
            Log.trace("whee!");
            Log.info("serious");
            stdMocks.restore();

            let output = stdMocks.flush();
            assert.strictEqual(output.stdout.length, 2);
            assert.strictEqual(output.stderr.length, 0);
            assert.match(output.stdout[0], /^.*nhai TRACE: \u001b\[37mwhee!\u001b\[39m\n$/);
            assert.match(output.stdout[1], /^.*nhai INFO: {2}\u001b\[32mserious\u001b\[39m\n$/);

            stdMocks.use();
            Log.setStdoutLevel("info");
            Log.trace("excited!");
            Log.info("harumph");
            stdMocks.restore();

            output = stdMocks.flush();
            assert.strictEqual(output.stdout.length, 1);
            assert.strictEqual(output.stderr.length, 0);
            assert.match(output.stdout[0], /^.*nhai INFO: {2}\u001b\[32mharumph\u001b\[39m\n$/);

            Log.setStdoutLevel("trace");
        });

        it("throws on no argument", function() {
            assert.throws(() => {
                Log.setStdoutLevel();
            }, TypeError, "setStdoutLevel expected level to be a number and a multiple of 10 between 0 and 61");
        });

        it("throws on unexpected type", function() {
            assert.throws(() => {
                Log.setStdoutLevel({});
            }, TypeError, "setStdoutLevel expected level to be a number and a multiple of 10 between 0 and 61");
        });

        it("throws on bad number", function() {
            assert.throws(() => {
                Log.setStdoutLevel(7);
            }, TypeError, "setStdoutLevel expected level to be a number and a multiple of 10 between 0 and 61");
        });

        it("throws on unknown name", function() {
            assert.throws(() => {
                Log.setStdoutLevel("bob");
            }, TypeError, "unknown log level name: bob");
        });
    });

    describe("getStdoutLevel", function() {
        it("returns the current logging level", function() {
            let o;
            Log.setStdoutLevel("trace");
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "trace", levelValue: 10});

            Log.setStdoutLevel("debug");
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "debug", levelValue: 20});

            Log.setStdoutLevel("info");
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "info", levelValue: 30});

            Log.setStdoutLevel("warn");
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "warn", levelValue: 40});

            Log.setStdoutLevel("error");
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "error", levelValue: 50});

            Log.setStdoutLevel("fatal");
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "fatal", levelValue: 60});

            Log.setStdoutLevel(10);
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "trace", levelValue: 10});

            Log.setStdoutLevel(20);
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "debug", levelValue: 20});

            Log.setStdoutLevel(30);
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "info", levelValue: 30});

            Log.setStdoutLevel(40);
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "warn", levelValue: 40});

            Log.setStdoutLevel(50);
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "error", levelValue: 50});

            Log.setStdoutLevel(60);
            o = Log.getStdoutLevel();
            assert.deepEqual(o, {levelName: "fatal", levelValue: 60});
        });
    });

    describe("addStream", function() {
        it("adds a stream to the Logger", function() {
            Log.addStream(newStream);

            let l = Log.getLogger();
            assert.isArray(l.streams);
            assert.strictEqual(l.streams.length, Config.get("log-file-enabled") ? 3 : 2);
            assert.strictEqual(l.streams[Config.get("log-file-enabled") ? 2 : 1].name, newStream.name);

            stdMocks.use();
            Log.fatal("foo");
            stdMocks.restore();

            let output = stdMocks.flush();
            assert.strictEqual(output.stdout.length, 1);
            assert.strictEqual(output.stderr.length, 1);
            let jsonMsg = JSON.parse(output.stderr[0]);
            assert.strictEqual(jsonMsg.name, Config.get("app-name"));
            assert.strictEqual(jsonMsg.msg, "foo");

            // cleanup
            l.streams.pop();
        });
    });
});
