// const { EventBase, EventBusBase } = require("./EventBase");
// const Component = require("./Component");
const {EventBase, EventBusBase} = require("./EventBase");
const {Component} = require("./Component");
const {checkType, checkInstance, createHiddenProp} = require("./Utility");

/**
 * Events used for communicattion between perception {@link Component|Components}
 *
 * @extends {EventBase}
 */
class PerceptionEvent extends EventBase {
    /**
     * Creates a new event to be sent over the perception bus
     *
     * @param {string} sourceName - The name of the source of the event.
     * @param {string} sourceType - The type of the source.
     */
    constructor(sourceName, sourceType) {
        super();

        checkType("PerceptionEvent.constructor", "sourceName", sourceName, "string");
        checkType("PerceptionEvent.constructor", "sourceType", sourceType, "string");
        createHiddenProp(this, "_sourceName", sourceName, true);
        createHiddenProp(this, "_sourceType", sourceType, true);
    }

    /** The `String` describing the name of the event source */
    get sourceName() {
        return this._sourceName || "initializing";
    }

    /** A `String` describing the type of the source */
    get sourceType() {
        return this._sourceType || "initializing";
    }

    /** A `Set` describing the types of events that are allowed */
    get allowedEventTypes() {
        return new Set(["register", "init", "data"]);
    }

    /** The {@link EventBusBase} that will be used to send the event */
    get eventBus() {
        return Perception.eventBus;
    }
}

const perceptionEventBus = new EventBusBase(PerceptionEvent);

/**
 * A perception input (e.g. - vision, sound, feel)
 */
class Perception extends Component {
    /**
     * Creates a new Perception object
     *
     * @param {string}   name     - Name of the perception object. Should be human descriptive of the type of type of perception being performed.
     * @param {Function} dataType - A constructure for the type of data that will be emitted by this Perception object.
     */
    constructor(name, dataType) {
        super(name, "perception", PerceptionEvent);

        // if (typeof dataType !== "function") throw new TypeError("Perception constructor expected 'dataType' to be a class");
        checkType("Perception constructor", "dataType", dataType, "class");
        this.dataType = dataType;
    }

    /**
     * A perception input event. Data must be of the `dataType` specified in the constructor.
     *
     * @param {*} data - The data that has been perceived
     *
     * @returns {boolean} Returns `true` if the event had listeners, `false` otherwise
     */
    input(data) {
        checkInstance("Perception.input", "data", data, this.dataType);
        // if (!(data instanceof this.dataType)) throw new TypeError(`Perception.input expected dataType to be ${this.dataType.name}`);
        let e = new this.eventClass(this.name, this.type);
        return e.emit("data", data);
    }

    /** the perception event bus, for communicating between perception {@link Component|Components} */
    static get eventBus() {
        return perceptionEventBus;
    }
}

module.exports = {Perception, PerceptionEvent};
