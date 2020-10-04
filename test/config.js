const {assert} = require("chai");
const {Config} = require("..");

describe("config", function() {
    it("is class", function() {
        assert.isFunction(Config);
    });

    it("has static function getConfig", function() {
        assert.isFunction(Config.getConfig);
    });

    it("get", function() {
        let cv = Config.get("version");
        let {version} = require("../package.json");
        assert.strictEqual(cv, version);
    });

    it("set", function() {
        Config.set("foo", "bar");
        let val = Config.get("foo");
        assert.strictEqual(val, "bar");
    });

    describe("getConfig", function() {
        it("returns a Map", function() {
            let c = Config.getConfig();
            assert.instanceOf(c, Map);
        });

        it("has version", function() {
            let {version} = require("../package.json");
            assert.strictEqual(Config.getConfig().get("version"), version);
        });
    });
});
