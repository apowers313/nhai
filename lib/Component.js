const { EventBase } = require("./EventBase");

/**
 * A module that implements some functionality and communicates with other modules
 */
class Component {
    /**
     * constructor
     * @param  {String|EventBase} name The name of the module or an event derived from EventBase. If an event, `type` and `mod` arguments are not used.
     * @param  {String} type The type of the module
     * @param  {Object} mod  The module data
     * @return {PerceptionModule}      The Object that was created
     * @todo * registered module must be of a specific type (Perception, FeatureExtractor, etc.)
     * @todo * type should be from a controlled vocabulary
     */
    constructor(name, type, mod) {
        if(name instanceof EventBase) {
            let e = name;
            this.name = e.sourceName;
            this.type = e.sourceType;
            this.module = e.data;
        } else {
            this.name = name;
            this.type = type;
            this.module = mod;
        }

        if(typeof this.name !== "string") throw new TypeError("expected 'name' to be String while constructing Component");
        if(typeof this.type !== "string") throw new TypeError("expected 'type' to be String while constructing Component");
        if(typeof this.module !== "object") throw new TypeError("expected 'module' to be Object while constructing Component");
    }

    static register(mod) {
        if(!(mod instanceof Component)) throw new TypeError ("registerModule expected Component argument");
        if(componentMap.has(mod.name) && componentMap.get(mod.name) !== mod) throw new Error ("can't register a module with a duplicate name and a different object");

        componentMap.set(mod.name, mod);
    }

    static get list() {
        return componentMap;
    }

    static clearList() {
        componentMap.clear();
    }
}

const componentMap = new Map();

module.exports = Component;