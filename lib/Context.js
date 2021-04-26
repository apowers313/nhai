const {Component} = require("./Component");
const {Pipeline} = require("./Pipeline");

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
        super("context");
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
}

module.exports = {
    Context,
};
