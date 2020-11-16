const {Synchronize, Config, Log} = require("../index");
const {assert} = require("chai");
const {spy, stub} = require("sinon");

let origWatchdog = Config.get("environment-sync-watchdog-timeout");

describe("Synchronize", function() {
    before(function() {
        Log.init();
        Log.setStdoutLevel("error");
    });

    after(function() {
        Log.setStdoutLevel(Config.get("log-level"));
    });

    afterEach(function() {
        Config.set("environment-synchronous", true);
        Config.set("environment-sync-watchdog-timeout", origWatchdog);
        Synchronize.shutdown();
    });

    it("is Function", function() {
        assert.isFunction(Synchronize);
    });

    describe("nextTick", function() {
        it("throws if environment is asychronous", function() {
            Config.set("environment-synchronous", false);
            Synchronize.init();
            assert.throws(() => {
                Synchronize.nextTick();
            }, Error, "Synchronize.nextTick should only be called in a synchronous environment (see: Config('environment-synchronous'))");
        });

        it("throws if not initialized", function() {
            assert.throws(() => {
                Synchronize.nextTick();
            }, Error, "Please call Synchronize.init() before Synchronize.nextTick()");
        });

        it("calls callback", function() {
            let cb = spy();
            Synchronize.init();
            Synchronize.register(cb);
            assert.strictEqual(cb.callCount, 0);
            Synchronize.nextTick();
            assert.strictEqual(cb.callCount, 1);
            assert.strictEqual(cb.args[0].length, 1);
            assert.strictEqual(cb.args[0][0], 1);
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
            let intervalHandle;
            afterEach(function() {
                wd.restore();
                if (intervalHandle) {
                    clearInterval(intervalHandle);
                }
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

            it("repeats every X ms", function(done) {
                wd = spy(Synchronize, "syncWatchdog");
                Config.set("environment-sync-watchdog-timeout", 10);
                Synchronize.init();
                intervalHandle = setInterval(() => {
                    Synchronize.nextTick();
                }, 3);
                setTimeout(() => {
                    assert.strictEqual(wd.callCount, 3);
                    done();
                }, 35);
            });
        });
    });

    describe("asynchronous", function() {
        it("triggers very X ms");
    });
});
