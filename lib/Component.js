const {EventBase} = require("./EventBase");

/**
 * A component that implements some functionality and communicates with other components. Used as a base class for various
 * parts of the system that will interact through events.
 */
class Component {
    /**
     * constructor
     *
     * @param  {string | EventBase} name The name of the module or an event derived from EventBase. If an event, `type` and `mod` arguments are not used.
     * @param  {string} type The type of the module
     * @param  {object} mod  The module data
     * @returns {Component}      The Object that was created
     * @todo * registered module must be of a specific type (Perception, FeatureExtractor, etc.)
     * @todo * type should be from a controlled vocabulary
     */
    constructor(name, type, mod) {
        if (name instanceof EventBase) {
            let e = name;
            this.name = e.sourceName;
            this.type = e.sourceType;
            this.module = e.data;
        } else {
            this.name = name;
            this.type = type;
            this.module = mod;
        }

        if (typeof this.name !== "string") throw new TypeError("expected 'name' to be String while constructing Component");
        if (typeof this.type !== "string") throw new TypeError("expected 'type' to be String while constructing Component");
        if (typeof this.module !== "object") throw new TypeError("expected 'module' to be Object while constructing Component");

        Component.register(this);
    }

    /**
     * Registers a component on the global component list
     *
     * @param   {Component} comp The component to be registered
     */
    static register(comp) {
        if (!(comp instanceof Component)) throw new TypeError("registerModule expected Component argument");
        if (componentMap.has(comp.name) && componentMap.get(comp.name) !== comp) throw new Error("can't register a module with a duplicate name and a different object");

        componentMap.set(comp.name, comp);
    }

    /**
     * A global list of all components that have been registered. Value is a `Map` of {@link Component|Components}.
     * Map keys are the component name.
     */
    static get list() {
        return componentMap;
    }

    /**
     * Clears the global list of registered Components. Mostly used for testing.
     */
    static clearList() {
        componentMap.clear();
    }
}

const componentMap = new Map();

module.exports = Component;
