const {Action, ActionEvent, Utility} = require("../index");
const {checkType} = Utility;

const actionQueue = [];

function queueKey(key) {
    checkType("queueKey", "key", key, "string");
    console.log("key", key);
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
function getAction() {
    return new Promise((resolve) => {
        let e = new ActionEvent("nethack", "main");
        e.eventBus.once("action", handleActionEvent);
        console.log("emitting");
        e.emit("waiting");

        function handleActionEvent(data) {
            e.eventBus.removeAllListeners("action");
            console.log("resolving");
            resolve(data);
        }
    });
}

module.exports = {
    actionQueue,
    getAction,
};
