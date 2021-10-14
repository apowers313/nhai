const {Node} = require("..");
const {assert} = require("chai");

describe("Node", function() {
    it("is Function", function() {
        assert.isFunction(Node);
    });
});
