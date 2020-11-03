const {Component} = require("./Component");
const {EventBase, EventBusBase, EventFilter, EventListener} = require("./EventBase");
const {checkType, createHiddenProp} = require("./Utility");

/**
 * An event for comunicating between significance components
 *
 * @extends EventBase
 */
class SignificanceEvent extends EventBase {
    /**
     * Creates a new event to be sent over the significance bus
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

    // eslint-disable-next-line jsdoc/require-jsdoc
    get sourceName() {
        return this._sourceName || "initializing";
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get sourceType() {
        return this._sourceType || "initializing";
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get allowedEventTypes() {
        return new Set(["register", "init", "change"]);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get eventBus() {
        return Significance.eventBus;
    }
}

const significanceEventBus = new EventBusBase(SignificanceEvent);
const weightingMap = new Map();

/**
 * A component for handling signficiance
 *
 * @extends Component
 */
class Significance extends Component {
    /**
     * Creates a new Significance object
     */
    constructor() {
        super("significance", "significance", SignificanceEvent);

        let filter = new EventFilter("allow", {eventType: "change", all: true});
        // let filter = new EventFilter("allow", {sourceType: "intrinsic", eventType: "change", all: true});
        new EventListener(Significance.eventBus, filter, this.calculateChange);
    }

    /**
     * Calculates the significance of an event
     *
     * @param   {EventBusBase} evt The intrinsic event
     */
    calculateChange(evt) {
        // console.log("calculateChange called!", evt);
    }

    /** the perception event bus, for communicating between perception {@link Component|Components} */
    static get eventBus() {
        return significanceEventBus;
    }

    /**
     * Set the weight of a specific intrinsic value
     *
     * @param {string} intrinsicName   The name of the intrinsic
     * @param {string} weightingFactor The weight factor
     */
    static setWeight(intrinsicName, weightingFactor) {
        checkType("setWeighting", "intrinsicName", intrinsicName, "string");
        checkType("setWeighting", "weightingFactor", weightingFactor, "number");

        weightingMap.set(intrinsicName, weightingFactor);
    }

    /**
     * Returns the weight for an intrinsic
     *
     * @param   {string} intrinsicName The intrinsic weight value to get
     */
    static getWeight(intrinsicName) {
        checkType("setWeighting", "intrinsicName", intrinsicName, "string");

        let weight = weightingMap.get(intrinsicName);

        return weight || 1.0;
    }
}

module.exports = {
    Significance,
    SignificanceEvent,
};
