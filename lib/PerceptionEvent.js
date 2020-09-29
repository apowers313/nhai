const { Perception } = require("./Perception");
const { EventBase } = require("./EventBase");

class PerceptionEvent extends EventBase {
    get allowedTypes() {
        return new Set(["register", "init"]);
    }

    get eventBus() {
        return Perception.eventBus;
    }
}

module.exports = PerceptionEvent;