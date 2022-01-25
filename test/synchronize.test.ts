const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {assert} = chai;

const {Synchronize, Config, Log, Utility} = require("../index");
const {spy, stub} = require("sinon");
const {delay} = Utility;

let origWatchdog = Config.get("environment-sync-watchdog-timeout");

describe("Synchronize", function() {
    before(function() {
        Log.init();
        Log.setStdoutLevel("error");
    });

    after(function() {
        Log.setStdoutLevel(Config.get("log-level"));
    });

    afterEach(async function() {
        Config.set("environment-synchronous", true);
        Config.set("environment-sync-watchdog-timeout", origWatchdog);
        await Synchronize.shutdown();
    });

    it("is Function", function() {
        assert.isFunction(Synchronize);
    });

    describe("nextTick", function() {
        it("throws if environment is asychronous", function() {
            Config.set("environment-synchronous", false);
            Synchronize.init();

            return assert.isRejected(Synchronize.nextTick(), Error, "Synchronize.nextTick should only be called in a synchronous environment (see: Config('environment-synchronous'))");
        });

        it("throws if not initialized", function() {
            return assert.isRejected(Synchronize.nextTick(), Error, "Please call Synchronize.init() before Synchronize.nextTick()");
        });

        it("calls callback", async function() {
            let cb = spy();
            await Synchronize.init();
            await Synchronize.register(cb);
            assert.strictEqual(cb.callCount, 0);
            await Synchronize.nextTick();
            assert.strictEqual(cb.callCount, 1);

            assert.strictEqual(cb.args[0].length, 2);
            assert.isObject(cb.args[0][0]); // event object
            assert.strictEqual(cb.args[0][1], 1);
        });
    });

    describe("tickCount", function() {
        it("increments with nextTick", function() {
            Synchronize.init();
            assert.strictEqual(Synchronize.tickCount, 0);
        });

        it("throws if not initialized", function() {
            assert.throws(() => {
                // eslint-disable-next-line no-unused-vars
                let x = Synchronize.tickCount;
            }, Error, "Please call Synchronize.init() before getting Synchronize.tickCount");
        });
    });

    describe("synchronous", function() {
        describe("watchdog", function() {
            let wd;
            afterEach(async function() {
                wd.restore();
                await Synchronize.shutdown();
            });

            it("throws if nextTick not called", function(done) {
                let err;
                wd = stub(Synchronize, "syncWatchdog").callsFake(() => {
                    try {
                        wd.wrappedMethod();
                    } catch (e) {
                        err = e;
                    }
                });

                Config.set("environment-sync-watchdog-timeout", 10);
                Synchronize.init();
                setTimeout(() => {
                    assert.strictEqual(wd.callCount, 1);
                    assert.instanceOf(err, Error);
                    assert.strictEqual(err.message, "Synchronize synchronous watchdog timed out after 10ms without Synchronize.nextTick() being called");
                    done();
                }, 12);
            });

            it("repeats every X ms", async function() {
                // this.retries(3); // XXX: this test can be a little flakey...
                wd = spy(Synchronize, "syncWatchdog");
                Config.set("environment-sync-watchdog-timeout", 100);
                await Synchronize.init();
                await delay(90);
                await Synchronize.nextTick();
                await delay(90);
                await Synchronize.nextTick();
                await delay(90);
                await Synchronize.nextTick();
                await delay(90);
                Synchronize.pauseWatchdog();
                assert.strictEqual(wd.callCount, 3);
            });
        });
    });

    describe("asynchronous", function() {
        it("triggers very X ms");
    });
});
