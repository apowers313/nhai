const {Action, ActionSelection, Component} = require("../index");
const {assert} = require("chai");

describe("Action", function() {
    describe("addAction", function() {
        afterEach(function() {
            Action.clearActions();
        });

        it("isFunction", function() {
            assert.isFunction(Action.addAction);
        });

        describe("addAction", function() {
            it("adds action");
            it("cant add duplicate", function() {
                Action.addAction("foo", ()=>{});
                assert.throws(() => {
                    Action.addAction("foo", ()=>{});
                }, Error, "addAction 'foo' already exists");
            });
        });

        describe("getActionList", function() {
            it("returns Map");
        });

        describe("clearActions", function() {
            it("clears action list");
        });
    });
});

describe("ActionSelection", function() {
    beforeEach(function() {
        Action.clearActions();
        Component.clearList();
    });

    it("is component", function() {
        assert.isFunction(ActionSelection);
        assert.instanceOf(ActionSelection.prototype, Component);
    });

    describe("synchronous performAction", function() {
        it("calls action", function(done) {
            // should be the only action available, safe to assume that it triggers
            Action.addAction("test", () => {
                done();
            });
            let as = new ActionSelection();
            as.performAction();
        });

        it("calls action on 'waiting' event");
        it("emits 'action' event");
    });
});
