const {Component} = require("./Component");
const {EventBase, EventBusBase} = require("./EventBase");
const {checkType, createHiddenProp} = require("./Utility");
const {Pipeline} = require("./Pipeline");

/**
 * An event for comunicating between significance components
 *
 * @extends EventBase
 */
class ContextEvent extends EventBase {
    /**
     * Creates a new event to be sent over the context bus
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
        return Context.eventBus;
    }
}

const contextEventBus = new EventBusBase(ContextEvent);

/**
 * Operating context for CRL, primary function for knitting together perceptions
 * into concepts.
 */
class Context extends Component {
    /**
     * Create a new context. Normally a singleton created using `Context.init()`
     *
     * @returns {Context} The newly created Context
     */
    constructor() {
        // TODO: setup events
        super("context", "context", ContextEvent);
        Pipeline.get("load");
        Pipeline.get("significance");
    }

    /**
     * Initializes the Context and creates the Context singleton
     *
     * @returns {Promise} Promise that resolves when initialization is complete
     */
    static async init() {
        new Context();
    }

    /**
     * Shut down the Context singleton
     *
     * @returns {Promise} Promise that resolves when shutdown is complete
     */
    static async shutdown() {}

    /** the significance event bus, for communicating between perception {@link Component|Components} */
    static get eventBus() {
        return contextEventBus;
    }
}

module.exports = {
    Context,
};
