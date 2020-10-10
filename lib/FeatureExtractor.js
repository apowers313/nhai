const Component = require("./Component");
const {EventListener} = require("./EventBase");
const {checkType} = require("./Utility");
const {PercepitonEvent} = require("./Perception");

class FeatureExtractor extends Component {
    /**
     * Creates a new feature extractor for pulling features out of raw perception data.
     *
     * @param {string}   name - The name of the feature extractor.
     * @param {Function} cb   - The function to be called to process the input data.
     */
    constructor(name, cb) {
        super(name, "feature-extractor", PercepitonEvent);

        checkType("FeatureExtractor.constructor", "name", name, "string");
        checkType("FeatureExtractor.constructor", "cb", cb, "function");

        this.name = name;
        this.cb = cb;
    }

    /**
     * Listens for `data` events from another Component
     *
     * @param   {string} sourceName The name of the component to listen to
     */
    listen(sourceName) {
        checkType("listen", "sourceName", sourceName, "string");

        new EventListener(this.eventBus, {sourceName, type: "data"}, (e) => {
            // TODO: performance profiling of event handling can go here
            this.cb(e.data, e);
        });
    }
}

module.exports = FeatureExtractor;
