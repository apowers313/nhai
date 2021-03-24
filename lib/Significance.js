const {Component} = require("./Component");
const {Synchronize} = require("./Synchronize");
const {EventBase, EventBusBase, EventListener} = require("./EventBase");
const {checkType, createHiddenProp} = require("./Utility");
const {EventFilter} = require("./EventFilter");

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

        checkType("SignificanceEvent.constructor", "sourceName", sourceName, "string");
        checkType("SignificanceEvent.constructor", "sourceType", sourceType, "string");
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
        return new Set(["register", "init", "change", "significance"]);
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
        createHiddenProp(this, "_changeList", new Set());

        let filter = new EventFilter("allow", {eventType: "change", all: true});
        new EventListener(Significance.eventBus, filter, this.getChange.bind(this));
    }

    /**
     * Collects change events
     *
     * @param   {EventBusBase} evt The intrinsic event
     */
    getChange(evt) {
        this._changeList.add(evt.data);
    }

    /**
     * Every tick, collect Intrinsic changes, roll them up, and emit them as a significance event
     */
    async onTick() {
        // collect changes
        let changes = [... this._changeList.values()].map((v) => {
            return {type: v.intrinsic.name, val: v.newNormVal};
        });

        // calculate weights
        changes.forEach((c) => c.weightedVal = Significance.getWeight(c.type) * c.val);

        // calculate significance
        let significance = changes.reduce((sig, c) => sig + c.weightedVal, 0);

        // remove old changes
        this._changeList.clear();

        // emit event
        return this.sendEvent("significance", {
            significance,
            changes,
        });
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

    /**
     * Clears the previously set weights. Mostly used for testing.
     */
    static clearWeights() {
        weightingMap.clear();
    }

    /**
     * Initializes the Significance singleton
     */
    static async init() {
        // TODO: need to clean this up during shutdown
        let s = new Significance();
        await Synchronize.register(s.onTick.bind(s));
        return s;
    }

    /**
     * Shuts down the Significance singleton
     */
    static async shutdown() {

    }
}

module.exports = {
    Significance,
    SignificanceEvent,
};
