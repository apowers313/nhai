const assert = require("chai").assert;
const { Config } = require("..");

describe("config", function() {
    it("is class", function() {
        assert.isFunction(Config);
    });

    it("has static function getConfig", function() {
        assert.isFunction(Config.getConfig);
    });

    describe("getConfig", function() {
        it("returns a Map", function() {
            let c = Config.getConfig();
            assert.instanceOf(c, Map);
        });

        it("has version", function() {
            let version = require("../package.json").version;
            assert.strictEqual(Config.getConfig().get("version"), version);
        });
    });

});