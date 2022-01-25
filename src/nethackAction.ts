const {Action, ActionEvent, Utility} = require("../index");
const {checkType} = Utility;
const {once} = require("events");
const actionQueue = [];

function queueKey(key) {
    checkType("queueKey", "key", key, "string");
    if (actionQueue.length !== 0) {
        throw new Error("queueKey expected actionQueue.length to be 0");
    }

    let ch = key.charCodeAt(0);
    actionQueue.push(ch);
    return {
        action: ch,
    };
}

Action.addAction("left", queueKey.bind(null, "h"));
Action.addAction("right", queueKey.bind(null, "l"));
Action.addAction("up", queueKey.bind(null, "k"));
Action.addAction("down", queueKey.bind(null, "j"));
Action.addAction("wait", queueKey.bind(null, "."));

// eslint-disable-next-line jsdoc/require-jsdoc
async function getAction() {
    let e = new ActionEvent("nethack", "main");
    let p = once(e.eventBus, "action");
    await e.emit("waiting");
    return p;
}

module.exports = {
    actionQueue,
    getAction,
};
