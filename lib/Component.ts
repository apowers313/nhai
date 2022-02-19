import {Event} from "./Event";
import {EventBus} from "./EventBus";

/**
 * Abstract class for events emitted from a Component
 */
export abstract class ComponentEvent extends Event {
    sourceName!: string;
    sourceType!: string;
}

/**
 * A component that implements some functionality and communicates with other components. Used as a base class for various
 * parts of the system that will interact through events.
 *
 * @property {string}    name       - The name of the component
 * @property {type}      string     - The type of the component
 */
export abstract class Component<EventType extends ComponentEvent> {
    name: string;
    type: string;
    abstract eventBus: EventBus<EventType>;

    /**
     * constructor
     *
     * @param {string}    name       - The name of the module.
     * @param {string}    type       - The type of the module
     *
     * @returns {Component}      The Object that was created
     */
    constructor(name: string, type: string) {
        this.name = name;
        this.type = type;

        Component.register(this);
    }

    /**
     * Emits an event using the specified eventClass
     *
     * @param evt The event to be sent on the corresponding EventBus
     */
    sendEvent(evt: EventType) {
        evt.sourceName = this.name;
        evt.sourceType = this.type;
        this.eventBus.send(evt);
    }

    /**
     * Registers a component on the global component list
     *
     * @param   {Component} comp The component to be registered
     */
    static register(comp: Component<any>) {
        if (componentMap.has(comp.name) && componentMap.get(comp.name) !== comp) {
            throw new Error("can't register a module with a duplicate name and a different object");
        }

        componentMap.set(comp.name, comp);
    }

    /**
     * Look up a Component using its name
     *
     * @param   {string} name The name of the Component passed in at registration time
     * @returns {Component}      The Component with the corresponding name or `undefined` if none was found
     */
    static get(name) {
        return componentMap.get(name);
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
