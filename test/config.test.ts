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
                Config.reset();
            });

            it("loads file", async function() {
                await Config.init();
                assert.strictEqual(Config.get("test"), "cookie-abc123");
            });

            it("preserves defaults", async function() {
                await Config.init();
                assert.strictEqual(Config.get("app-version"), require("../package.json").version);
            });

            it("sets fileList", async function() {
                await Config.init();
                assert.instanceOf(Config.fileList, Array);
                assert.strictEqual(Config.fileList.length, 1);
                assert.deepEqual(Config.fileList[0].config, {test: "cookie-abc123"});
                assert.match(Config.fileList[0].filepath, /\.nhairc\.js$/);
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
                Config.reset();
            });

            it("loads file", async function() {
                await Config.init();
                assert.strictEqual(Config.get("test"), "yaml-cookie-yummy");
            });

            it("preserves defaults", async function() {
                await Config.init();
                assert.strictEqual(Config.get("app-version"), require("../package.json").version);
            });

            it("sets fileList", async function() {
                await Config.init();
                assert.instanceOf(Config.fileList, Array);
                assert.strictEqual(Config.fileList.length, 1);
                assert.deepEqual(Config.fileList[0].config, {test: "yaml-cookie-yummy"});
                assert.match(Config.fileList[0].filepath, /\.nhairc$/);
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
                Config.reset();
            });

            it("loads file", async function() {
                await Config.init();
                assert.strictEqual(Config.get("test"), "happy little json!");
            });

            it("preserves defaults", async function() {
                await Config.init();
                assert.strictEqual(Config.get("app-version"), require("../package.json").version);
            });

            it("sets fileList", async function() {
                await Config.init();
                assert.instanceOf(Config.fileList, Array);
                assert.strictEqual(Config.fileList.length, 1);
                assert.deepEqual(Config.fileList[0].config, {test: "happy little json!"});
                assert.match(Config.fileList[0].filepath, /\.nhairc\.json$/);
            });
        });
    });

    describe("reset", function() {
        it("sets defaults", function() {
            Config.set("app-version", "3.14.159");
            assert.strictEqual(Config.get("app-version"), "3.14.159");
            Config.reset();
            assert.strictEqual(Config.get("app-version"), require("../package.json").version);
        });

        it("unsets initialized", function() {
            Config.load({oogie: "boogie"});
            assert.strictEqual(Config.get("oogie"), "boogie");
            Config.reset();
            assert.isUndefined(Config.get("oogie"));
        });

        it("clears fileList", async function() {
            copyFile(jsHelperPath, jsConfigPath);
            process.chdir(workingDir);

            await Config.init();
            // test is "cookie-abc123" if the config file was loaded
            assert.strictEqual(Config.get("test"), "cookie-abc123");
            assert.strictEqual(Config.fileList.length, 1);
            Config.reset();
            assert.strictEqual(Config.fileList.length, 0);

            deleteFile(path.join(workingDir, ".nhairc.js"));
            process.chdir(cwd);
        });
    });

    describe("load", function() {
        afterEach(function() {
            Config.reset();
        });

        it("sets initialized", function() {
            Config.load({tv: "off"});
            let val = Config.get("tv");
            assert.strictEqual(val, "off");
        });

        it("preserves defaults", async function() {
            Config.load({tv: "off"});
            assert.strictEqual(Config.get("app-version"), require("../package.json").version);
        });

        it("init doesn't grab config file", async function() {
            copyFile(jsHelperPath, jsConfigPath);
            process.chdir(workingDir);

            Config.load({tv: "mute"});
            await Config.init();
            // test is "cookie-abc123" if the config file was loaded
            assert.isUndefined(Config.get("test"));

            let val = Config.get("tv");
            assert.strictEqual(val, "mute");

            deleteFile(path.join(workingDir, ".nhairc.js"));
            process.chdir(cwd);
        });

        it("doesn't set fileList", async function() {
            Config.load({foo: "bar"});
            assert.strictEqual(Config.fileList.length, 0);
        });
    });

    describe("isLoaded", function() {
        afterEach(function() {
            Config.reset();
        });

        it("is true after load", function() {
            Config.load({tv: "off"});
            assert.isTrue(Config.isLoaded);
        });

        it("is true after init", async function() {
            copyFile(jsHelperPath, jsConfigPath);
            process.chdir(workingDir);

            await Config.init();
            // test is "cookie-abc123" if the config file was loaded
            assert.strictEqual(Config.get("test"), "cookie-abc123");
            assert.isTrue(Config.isLoaded);

            // cleanup
            deleteFile(path.join(workingDir, ".nhairc.js"));
            process.chdir(cwd);
        });

        it("is false after reset", function() {
            Config.reset();
            assert.isFalse(Config.isLoaded);
        });
    });
});
