const {StatusImage, EventListener, HtmlTemplate} = require("../index");
const {assert} = require("chai");
const {TestEvent, TestSync} = require("./helpers/helpers.js");

describe("StatusImage", function() {
    afterEach(function() {
        EventListener.clearListenAll();
    });

    it("exists", function() {
        assert.isFunction(StatusImage);
    });

    it("catches event", async function() {
        let si = new StatusImage("./test/helpers/data.hbs", ["foo"]);
        let te = new TestEvent();

        assert.strictEqual(si.eventCount, 0);
        await te.emit("foo", 42);
        assert.strictEqual(si.eventCount, 1);
    });

    it("resets on sync", async function() {
        let si = new StatusImage("./test/helpers/data.hbs", ["foo"]);
        let te = new TestEvent();
        let ts = new TestSync();

        assert.strictEqual(si.eventCount, 0);
        assert.strictEqual(si.data.size, 0);
        await te.emit("foo", 42);
        assert.strictEqual(si.eventCount, 1);
        assert.strictEqual(si.data.size, 1);
        await ts.emit("tick", 1);
        assert.strictEqual(si.eventCount, 2);
        assert.strictEqual(si.data.size, 0);
    });

    describe("render", function() {
        beforeEach(async function() {
            await HtmlTemplate.init();
        });

        afterEach(async function() {
            await HtmlTemplate.shutdown();
        });

        it("renders template based on event data", async function() {
            let si = new StatusImage("./test/helpers/data.hbs", ["foo"]);

            let te = new TestEvent();
            await te.emit("foo", 42);

            let d = si.render();
            assert.strictEqual(d, "Test template \n\n42!");
        });

        it("renders SVG", async function() {
            let si = new StatusImage("statusImg.hbs", ["foo"]);

            let te = new TestEvent();
            await te.emit("foo", 42);

            let d = si.render();
            // console.log(d);
            // assert.strictEqual(d, "Test template \n\n42!");
        });

        it("auto-renders on tick");
    });
});
