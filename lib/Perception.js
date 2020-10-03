// const { EventBase, EventBusBase } = require("./EventBase");
// const Component = require("./Component");
const { EventBase, EventBusBase } = require("./EventBase");
const Component = require("./Component");

class PerceptionEvent extends EventBase {
    constructor(name, type) {
        super();

        if (typeof name !== "string") throw new TypeError("expected 'name' to be String while constructing PerceptionEvent");
        if (typeof type !== "string") throw new TypeError("expected 'type' to be String while constructing PerceptionEvent");
        this._name = name;
        this._type = type;
    }

    get sourceName() {
        return this._name || "initializing";
    }

    get sourceType() {
        return this._type || "initializing";
    }

    get allowedEventTypes() {
        return new Set(["register", "init"]);
    }

    get eventBus() {
        return Perception.getEventBus();
    }
}

const perceptionEventBus = new EventBusBase(PerceptionEvent);
/* TODO: "register" event handling should be part of EventBusBase */
perceptionEventBus.on("register", (e) => {
    Component.register(new Component(e));
});

class Perception {
    static getEventBus() {
        return perceptionEventBus;
    }

}

module.exports = { Perception, PerceptionEvent } ;