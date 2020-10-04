const {Log, Config} = require("../index");
const {assert} = require("chai");
const stdMocks = require("std-mocks");

describe("Log", function() {
    it("is Function", function() {
        assert.isFunction(Log);
    });

    it("has logging functions");

    it("prints to stdout", function() {
        assert.strictEqual(Config.get("app-name"), "nhai");

        stdMocks.use();
        Log.info("this is a test");
        stdMocks.restore();

        let output = stdMocks.flush();
        assert.strictEqual(output.stdout.length, 1);
        assert.strictEqual(output.stderr.length, 0);
        let logObj = JSON.parse(output.stdout[0]);
        assert.strictEqual(logObj.name, "nhai");
        assert.strictEqual(logObj.msg, "this is a test");
    });
});
