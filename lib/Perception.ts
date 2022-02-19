// const { EventBase, EventBusBase } = require("./EventBase");
// const Component = require("./Component");
import {Component, ComponentEvent} from "./Component";
import {EventBus} from "./EventBus";

export type PerceptionEventType = "register" | "init" | "data";

/**
 * Events used for communicattion between perception {@link Component|Components}
 *
 * @extends EventBase
 */
export abstract class PerceptionEvent extends ComponentEvent {
    abstract sourceName: string;
    abstract sourceType: string;
    type: PerceptionEventType;
    data: any;

    /**
     * Creates a new event to be sent over the perception bus
     *
     * @param type
     * @param data
     */
    constructor(type: PerceptionEventType, data: any) {
        super();

        this.type = type;
        this.data = data;
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

class PerceptionEventBus extends EventBus<PerceptionEvent>{}

const perceptionEventBus = new PerceptionEventBus("perception");

/**
 * A perception input (e.g. - vision, sound, feel)
 *
 * @extends Component
 */
export class Perception extends Component<PerceptionEvent> {
    eventBus: PerceptionEventBus;

    /**
     * Creates a new Perception object
     *
     * @param {string}   name     - Name of the perception object. Should be human descriptive of the type of type of perception being performed.
     */
    constructor(name) {
        super(name, "perception");

        this.eventBus = perceptionEventBus;
    }

    /**
     * A perception input event. Data must be of the `dataType` specified in the constructor.
     *
     * @param {*} data - The data that has been perceived
     * @param evt
     * @returns {boolean} Returns `true` if the event had listeners, `false` otherwise
     */
    input(evt: PerceptionEvent) {
        this.eventBus.send(evt);
    }

    /** the perception event bus, for communicating between perception {@link Component|Components} */
    static get eventBus(): PerceptionEventBus {
        return perceptionEventBus;
    }
}
