const {Component} = require("./Component");
const {EventListener} = require("./EventBase");
const {EventFilter} = require("./EventFilter");
const {checkType} = require("./Utility");
const {PerceptionEvent} = require("./Perception");

/**
 * A base class for extracting features from Perception events
 *
 * @extends Component
 */
class FeatureExtractor extends Component {
    /**
     * Creates a new feature extractor for pulling features out of raw perception data.
     *
     * @param {string}   name - The name of the feature extractor.
     * @param {Function} cb   - The function to be called to process the input data.
     */
    constructor(name, cb) {
        checkType("FeatureExtractor.constructor", "name", name, "string");
        checkType("FeatureExtractor.constructor", "cb", cb, "function");

        super(name, "feature-extractor", PerceptionEvent);
        this.cb = cb;
    }

    /**
     * Listens for `data` events from another Component
     *
     * @param   {string} sourceName The name of the component to listen to
     */
    listen(sourceName) {
        checkType("listen", "sourceName", sourceName, "string");

        let filter = new EventFilter("allow", {sourceName, eventType: "data", all: true});
        this.listener = new EventListener(this.eventBus, filter, (inputEvent) => {
            // TODO: performance profiling of event handling can go here
            let res = this.cb.call(this, inputEvent.data, inputEvent);
            if (res !== undefined && res !== null) {
                // setImmediate(() => {
                this.sendEvent("data", res);
                // });
            }
        });
    }
}

module.exports = {FeatureExtractor};
