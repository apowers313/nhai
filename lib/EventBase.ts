// TODO: use NodeEventTarget instead of EventEmitter; still experimental in nodejs v14.5
import {EventFilter, FilterFn} from "./EventFilter";
import {Breakpoint} from "./Breakpoint";
import EventEmitter from "promise-events";

export type EventData = undefined | EventDataSingle | EventDataArray;
export type EventDataArray = EventDataSingle[];
export type EventDataSingle = unknown

/**
 * Abstract base class for all the types of events
 */
export abstract class EventBase {
    /** the name of source of this event */
    protected abstract sourceName: string;
    /** the source type of this event */
    protected abstract sourceType: string;
    // abstract readonly eventBus: EventBusBase;
    type: string;
    data: EventData;

    // eslint-disable-next-line jsdoc/require-jsdoc
    constructor(type: string, data: EventData) {
        this.type = type;
        this.data = data;
    }

    /**
     * Emits the event on the specified event bus
     *
     * @param   {string} type The type of the event
     * @param   {object} data The optional data associated with the event
     * @returns {Promise.<boolean>} Returns a Promise resolving to `true` if the event had listeners, `false` otherwise
     */
    // async emit(type: string, ... data: EventDataArray) {
    //     if (!this.allowedEventTypes.has(type)) {
    //         throw new TypeError(`event type '${type}' not one of the allowedEventTypes`);
    //     }

    //     this.type = type;
    //     this.data = (data.length < 2) ? data[0] : data;
    //     return this.eventBus.emit(type, this, ... data);
    // }

    /**
     * Convert an event to a human-readable string
     *
     * @returns {string} A string describing this event
     */
    toString() {
        return `${this.sourceName}::${this.sourceType} => ${this.type}`;
    }
}

const eventBusSet = new Set();

/**
 * Abstract base class for all the event busses
 *
 * @extends EventEmitter
 */
export class EventBusBase<T extends EventBase> extends EventEmitter {
    /**
     * Creates a new event bus that can only send or receive a specific type of events
     *
     * @returns The EventBusBase object
     */
    constructor() {
        super();
        eventBusSet.add(this);
    }

    /**
     * Checks if an event is of the correct type for this event bus
     *
     * @param {EventBase} event - The object to check to see if it is the right type
     * @throws TypeError on event that is wrong type
     */
    checkEvent(event) {
        if (!event.type) {
            console.warn("Emitting event without a type:", event);
        }
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    async emit(eventName: string, event: T): Promise<void> {
        throw new Error(`don't use emit: ${eventName} ${event}`);
    }

    /**
     * Synchronously calls each of the listeners registered for the event named eventName, in the order they were registered, passing the supplied arguments to each. See also: {link https://nodejs.org/api/events.html#events_emitter_emit_eventname_args|EventEmitter.emit}
     *
     * @param {string}    eventName - The name of the event
     * @param {EventBase} event     - An event that inherits from EventBase and is type of event described by `eventBase` in {@link EventBusBase.constructor}
     *
     * @returns {Promise.<boolean>}          Returns a Promise that resolves to  `true` if the event had listeners; `false` otherwise
     */
    async send(event: T): Promise<boolean> {
        this.checkEvent(event);
        console.log("emitting:", event);

        const ret = await Breakpoint.checkBreak(event, async() => {
            return super.emit(event.type, event);
        });

        EventListener.listenAllList.forEach((fn) => {
            fn(event);
        });

        return !!ret;
    }

    /**
     * Returns a Map of the event busses that have been created
     *
     * @returns A Set of the event busses, where the Set entry is the corresponding EventBusBase object
     */
    static get eventBusList() {
        return eventBusSet;
    }
}

export type ListenFn = (e: EventBase) => void;
const listenAllList: ListenFn[] = [];

/**
 * Listens for events on the specified {@link EventBusBase}, applying the specified {@link EventFilter}s before calling the
 * specified `callback`.
 */
export class EventListener {
    #callback: FilterFn;
    filterList: EventFilter[];
    attachedEvents: Set<string>;
    bus: typeof EventBusBase;
    /**
     * Creates an event listener for the specified `bus`, calling the `callback` function for any events that meet pass the `filterList`
     *
     * @param {EventBusBase}                   bus        - The event bus to listen on
     * @param {EventFilter|EventFilter[]|null} filterList - A list of events to filter on. If `null` all events on the
     *                                                    `bus` will call `callback` or filters may be added later using
     *                                                    the {@link EventListener#addFilter} method.
     * @param {Function}                       callback   - Will be called when an event meeting the `filterList` criteria
     *                                                    is received. Callback has a single argument of an {@link EventBase}
     *                                                    event.
     */
    constructor(bus: typeof EventBusBase, filterList: EventFilter | EventFilter[], callback) {
        let fl: EventFilter[];
        if (!Array.isArray(filterList)) {
            fl = [filterList];
        } else {
            fl = filterList;
        }

        this.#callback = callback;
        this.filterList = [];
        this.attachedEvents = new Set();
        this.bus = bus;
        if (fl[0] !== null) {
            fl.forEach((f) => this.addFilter(f));
        }

        // TODO: add all listeners
        this.update();
    }

    /**
     * Adds a filter to the EventListener. If the filter has a `priority` it will be added in priority order; otherwise,
     * it will be added to the end of the list.
     *
     * @param {EventFilter} filter The new filter to add.
     */
    addFilter(filter: EventFilter) {
        this.filterList.push(filter);
        this.filterList.sort((e1, e2) => {
            return e1.priority - e2.priority;
        });

        if (filter.allow && filter.criteria.eventType) {
            this.attachedEvents.add(filter.criteria.eventType);
        }
    }

    // TODO
    // removeFilter() {}

    /**
     * Calls {@link EventBusBase#addListener} on the bus for all the events that will be detected by the filters.
     */
    update() {
        // no events specified, listen for all allowable events
        // if (this.attachedEvents.size === 0) {
        //     this.attachedEvents = new Set([... this.bus.allowedEvents.values()]);
        // }

        // this.attachedEvents.forEach((eventType) => this.bus.addListener(eventType, this.applyFilter.bind(this)));
    }

    // TODO
    // stop() {}

    /**
     * Triggers the `callback` specified in the constructor if the `event` passes the `filterList`.
     * Typically called internally when the `bus` emits an event.
     *
     * @param   {EventBase} event An event derived from the {@link EventBase} class
     * @returns {undefined}       No return value
     */
    applyFilter(event) {
        let allow = false;
        for (const filter of this.filterList) {
            if (filter.denyEvent(event)) {
                return;
            }

            if (filter.allowEvent(event)) {
                allow = true;
                break;
            }
        }

        // default: deny
        if (!allow) {
            return;
        }

        this.#callback(event);
    }

    /**
     * Registers a callback function to be called on every event
     *
     * @param  {Function} fn The callback function to be called on every event. It will be passed the event that triggered it.
     */
    static listenAll(fn: ListenFn) {
        listenAllList.push(fn);
    }

    /**
     * Clears all callback functions registered with `listenAll`
     */
    static clearListenAll() {
        listenAllList.length = 0;
    }

    /**
     * The Array of callback functions registered with `listenAll`
     *
     * @returns {Array.<Function>} Returns an array of callback functions
     */
    static get listenAllList() {
        return listenAllList;
    }
}
