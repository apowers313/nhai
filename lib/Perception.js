// const { EventBase, EventBusBase } = require("./EventBase");
// const Component = require("./Component");
const {EventBase, EventBusBase} = require("./EventBase");
const Component = require("./Component");

/**
 * Events used for communicattion between perception {@link Component|Components}
 *
 * @augments {EventBase}
 */
class PerceptionEvent extends EventBase {
    /**
     * Creates a new event to be sent over the perception bus
     *
     * @param {string} sourceName - The name of the source of the event.
     * @param {string} type       - The type of the event.
     */
    constructor(sourceName, type) {
        super();

        if (typeof sourceName !== "string") throw new TypeError("expected 'name' to be String while constructing PerceptionEvent");
        if (typeof type !== "string") throw new TypeError("expected 'type' to be String while constructing PerceptionEvent");
        this._sourceName = sourceName;
        this._type = type;
    }

    /** The `String` describing the name of the event source */
    get sourceName() {
        return this._sourceName || "initializing";
    }

    /** A `String` describing the type of the source */
    get sourceType() {
        return this._type || "initializing";
    }

    /** A `Set` describing the types of events that are allowed */
    get allowedEventTypes() {
        return new Set(["register", "init"]);
    }

    /** The {@link EventBusBase} that will be used to send the event */
    get eventBus() {
        return Perception.eventBus;
    }
}

const perceptionEventBus = new EventBusBase(PerceptionEvent);
/* TODO: "register" event handling should be part of EventBusBase */
perceptionEventBus.on("register", (e) => {
    Component.register(new Component(e));
});

/**
 * A perception input (e.g. - vision, sound, feel)
 */
class Perception {
    /** the perception event bus, for communicating between perception {@link Component|Components} */
    static get eventBus() {
        return perceptionEventBus;
    }
}

module.exports = {Perception, PerceptionEvent};
