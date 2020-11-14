const {assert} = require("chai");
const {Config} = require("..");
const fs = require("fs");
const path = require("path");

// helpers
function copyFile(srcPath, dstPath) {
    let data = fs.readFileSync(srcPath);
    fs.writeFileSync(dstPath, data);
}

function deleteFile(path) {
    fs.unlinkSync(path);
}

describe("config", function() {
    it("is class", function() {
        assert.isFunction(Config);
    });

    it("has static function getConfig", function() {
        assert.isFunction(Config.getConfig);
    });

    it("get", function() {
        let cv = Config.get("app-version");
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
            assert.strictEqual(Config.getConfig().get("app-version"), version);
        });
    });

    describe("init", function() {
        describe("YAML", function() {
            beforeEach(function() {
                copyFile(path.join(__dirname, "helpers", "config.yml"), path.join(process.cwd(), ".nhairc"));
            });

            afterEach(function() {
                deleteFile(path.join(process.cwd(), ".nhairc"));
            });

            it("loads file", async function() {
                await Config.init();
                assert.strictEqual(Config.get("test"), "yaml-cookie-yummy");
            });

            it("preserves defaults", async function() {
                await Config.init();
                assert.strictEqual(Config.get("app-version"), require("../package.json").version);
            });

            it("sets configFileList", async function() {
                await Config.init();
                assert.deepEqual(Config.configFileList, [
                    {
                        config: {test: "yaml-cookie-yummy"},
                        filepath: "/Users/ampower/Projects/personal/nhai/.nhairc",
                    },
                ]);
            });
        });
    });
});
