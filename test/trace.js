const {Trace, Perception} = require("..");

process.on("unhandledRejection", (err) => {
    console.log("GOT ERROR:", err);
    throw err;
});

describe("Trace", function() {
    afterEach(function() {
        Perception.eventBus.removeAllListeners();
        Trace.clearEventHistory();
        // Trace.run();
    });

    describe("getEventHistory", function() {
        it("returns events");
        it("is immutable");
    });

    describe("clearEventHistory", function() {
        it("clears history");
    });
});
