const {FeatureExtractor, Component} = require("../index");
const {assert} = require("chai");

describe("FeatureExtractor", function() {
    it("is Component", function() {
        assert.isFunction(FeatureExtractor);
        assert.instanceOf(FeatureExtractor.prototype, Component);
    });

    describe("listen", function() {
        it("catches events");
        it("ignores events");
    });

    describe("input", function() {
        it("throws when abstract implementation");
        it("receives event");
    });
});
