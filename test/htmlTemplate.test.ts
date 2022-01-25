const {assert} = require("chai");
const {HtmlTemplate} = require("../index");
const {testTemplateContents, cytoscapeTemplateContents} = require("./helpers/helpers.js");

describe("HtmlTemplate", function() {
    beforeEach(async function() {
        await HtmlTemplate.init();
    });

    afterEach(async function() {
        await HtmlTemplate.shutdown();
    });

    it("is function", function() {
        assert.isFunction(HtmlTemplate);
    });

    describe("constructor", function() {
        it("template from helper", function() {
            let t = new HtmlTemplate("./test/helpers/data.hbs");
            assert.strictEqual(t.rawTemplate, testTemplateContents);
            assert.isFunction(t.hbTemplate);
        });
    });

    describe("toHtml", function() {
        it("creates HTML", function() {
            let t = new HtmlTemplate("Hi there {{{name}}}!");
            let h = t.toHtml({name: "bob"});
            assert.strictEqual(h, "Hi there bob!");
        });

        it("resolves partials", function() {
            let t = new HtmlTemplate("{{> cytoscapeInit}} blah!");
            let h = t.toHtml({name: "bob"});
            assert.strictEqual(h, `${cytoscapeTemplateContents} blah!`);
        });
    });

    describe("globals", function() {
        it("adds / gets / resets globals", function() {
            assert.deepEqual(HtmlTemplate.getGlobals(), {});
            HtmlTemplate.setGlobal("foo", 42);
            assert.deepEqual(HtmlTemplate.getGlobals(), {foo: 42});
            HtmlTemplate.resetGlobals();
            assert.deepEqual(HtmlTemplate.getGlobals(), {});
        });

        it("setGlobal throws on non-string key", function() {
            assert.throws(() => {
                HtmlTemplate.setGlobal(42, "foo");
            }, TypeError, "HtmlTemplate.setGlobal expected 'key' to be a string, got: 42");
        });

        // it("setGlobal throws if key exists", function() {
        //     HtmlTemplate.setGlobal("foo", "bar");
        //     assert.throws(() => {
        //         HtmlTemplate.setGlobal("foo", 42);
        //     }, TypeError, "HtmlTemplate.setGlobal: 'foo' already exists");
        // });

        it("passes in globals", function() {
            HtmlTemplate.setGlobal("foo", 42);
            let t = new HtmlTemplate("{{{json templateGlobal}}}");
            let h = t.toHtml();
            assert.strictEqual(h, "{\"foo\":42}");
        });
    });
});
