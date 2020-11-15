const {assert} = require("chai");
const {Config} = require("..");
const fs = require("fs");
const path = require("path");
const os = require("os");

// helpers
const cwd = process.cwd();
const workingDir = os.tmpdir();
const jsHelperPath = path.join(__dirname, "helpers", "config.js");
const yamlHelperPath = path.join(__dirname, "helpers", "config.yml");
const jsonHelperPath = path.join(__dirname, "helpers", "config.json");
const jsConfigPath = path.join(workingDir, ".nhairc.js");
const yamlConfigPath = path.join(workingDir, ".nhairc");
const jsonConfigPath = path.join(workingDir, ".nhairc.json");
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
        describe("JS", function() {
            beforeEach(function() {
                copyFile(jsHelperPath, jsConfigPath);
                process.chdir(workingDir);
            });

            afterEach(function() {
                deleteFile(path.join(workingDir, ".nhairc.js"));
                process.chdir(cwd);
            });

            it("loads file", async function() {
                await Config.init();
                assert.strictEqual(Config.get("test"), "cookie-abc123");
            });

            it("preserves defaults", async function() {
                await Config.init();
                assert.strictEqual(Config.get("app-version"), require("../package.json").version);
            });

            it("sets configFileList", async function() {
                await Config.init();
                assert.instanceOf(Config.configFileList, Array);
                assert.strictEqual(Config.configFileList.length, 1);
                assert.deepEqual(Config.configFileList[0].config, {test: "cookie-abc123"});
                assert.match(Config.configFileList[0].filepath, /\.nhairc\.js$/);
            });
        });

        describe("YAML", function() {
            beforeEach(function() {
                copyFile(yamlHelperPath, yamlConfigPath);
                process.chdir(workingDir);
            });

            afterEach(function() {
                deleteFile(yamlConfigPath);
                process.chdir(cwd);
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
                assert.instanceOf(Config.configFileList, Array);
                assert.strictEqual(Config.configFileList.length, 1);
                assert.deepEqual(Config.configFileList[0].config, {test: "yaml-cookie-yummy"});
                assert.match(Config.configFileList[0].filepath, /\.nhairc$/);
            });
        });

        describe("JSON", function() {
            beforeEach(function() {
                copyFile(jsonHelperPath, jsonConfigPath);
                process.chdir(workingDir);
            });

            afterEach(function() {
                deleteFile(jsonConfigPath);
                process.chdir(cwd);
            });

            it("loads file", async function() {
                await Config.init();
                assert.strictEqual(Config.get("test"), "happy little json!");
            });

            it("preserves defaults", async function() {
                await Config.init();
                assert.strictEqual(Config.get("app-version"), require("../package.json").version);
            });

            it("sets configFileList", async function() {
                await Config.init();
                assert.instanceOf(Config.configFileList, Array);
                assert.strictEqual(Config.configFileList.length, 1);
                assert.deepEqual(Config.configFileList[0].config, {test: "happy little json!"});
                assert.match(Config.configFileList[0].filepath, /\.nhairc\.json$/);
            });
        });
    });
});
