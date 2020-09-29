const { EventBusBase } = require("./EventBase");
const PerceptionEvent = require("./PerceptionEvent");

let perceptionEventBus = new EventBusBase(PerceptionEvent);

class Perception {
    static getEventBus() {
        return perceptionEventBus;
    }
}

module.exports = Perception;