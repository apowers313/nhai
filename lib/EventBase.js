// TODO: use NodeEventTarget instead of EventEmitter; still experimental in nodejs v14.5
const EventEmitter = require("events");
const {Breakpoint} = require("./Breakpoint");
const {EventFilter} = require("./EventFilter");
const {checkType, checkInstance} = require("./Utility");

/**
 * Abstract base class for all the types of events
 */
class EventBase {
    /**
     * Abstract constructor. Detects errors in derived classes.
     */
    constructor() {
        checkInstance("EventBase.constructor", "allowedEventTypes", this.allowedEventTypes, Set);
        checkInstance("EventBase.constructor", "eventBus", this.eventBus, EventBusBase);
        checkType("EventBase.constructor", "sourceType", this.sourceType, "string");
        checkType("EventBase.constructor", "sourceName", this.sourceName, "string");
    }

    /**
     * Returns a string representing the name of source of this event
     *
     * @returns {Set} Set of strings of valid event types
     */
    get sourceName() {
        throw new Error("sourceName not implemented");
    }

    /**
     * Returns a string that describe the source type of this event
     *
     * @returns {Set} Set of strings of valid event types
     */
    get sourceType() {
        throw new Error("sourceType not implemented");
    }

    /**
     * Returns a Set of strings that describe the valid types of sources
     *
     * @returns {Set} Set of strings of valid event types
     */
    // get allowedSourceTypes() {
    //     throw new Error ("allowedSourceTypes not implemented");
    // }

    /**
     * Returns a Set of strings that describe the valid types of events
     *
     * @returns {Set} Set of strings of valid event types
     */
    get allowedEventTypes() {
        throw new Error("allowedEventTypes not implemented");
    }

    /**
     * Returns a EventEmitter that will be used for the global event bus
     *
     * @returns {EventEmitter} The object that will be used as the global event bus for this kind of event
     */
    get eventBus() {
        throw new Error("eventBus not implemented");
    }

    /**
     * Emits the event on the specified event bus
     *
     * @param   {string} type The type of the event
     * @param   {object} data The optional data associated with the event
     * @returns {Promise.<boolean>} Returns a Promise resolving to `true` if the event had listeners, `false` otherwise
     */
    async emit(type, ... data) {
        if (!this.allowedEventTypes.has(type)) {
            throw new TypeError(`event type '${type}' not one of the allowedEventTypes`);
        }

        this.type = type;
        this.data = (data.length < 2) ? data[0] : data;
        return this.eventBus.emit(type, this, ... data);
    }

    /**
     * Convert an event to a human-readable string
     *
     * @returns {string} A string describing this event
     */
    toString() {
        return `${this.sourceName}::${this.sourceType} => ${this.type}`;
    }
}

const eventBusMap = new Set();

/**
 * Abstract base class for all the event busses
 *
 * @extends EventEmitter
 * @property {Set} allowedEvenets - A `Set` of events that are allowed on this bus
 */
class EventBusBase extends EventEmitter {
    /**
     * Creates a new event bus that can only send or receive a specific type of events
     *
     * @param {EventBase} baseEvent - A class that implements EventBase. The event bus will only allow this type of event.
     * @param {*}         args      - Arguments passed through to the {@link https://nodejs.org/api/events.html#events_class_eventemitter|EventEmitter} base class.
     *
     * @returns {EventBusBase}             The EventBusBase object
     */
    constructor(baseEvent, ... args) {
        super(... args);

        checkType("EventBusBase.constructor", "baseEvent", baseEvent, "class");
        if (baseEvent === EventBase) {
            throw new TypeError("constructor requires a class derived from EventBase but attempted to pass EventBase itself");
        }

        checkInstance("EventBusBase.constructor", "baseEvent", baseEvent.prototype, EventBase);
        this._baseEvent = baseEvent;
        eventBusMap.add(this);
    }

    /**
     * Checks if an event is of the correct type for this event bus
     *
     * @param {EventBase} event - The object to check to see if it is the right type
     * @throws TypeError on event that is wrong type
     */
    checkEvent(event) {
        checkInstance("EventBusBase.checkEvent", "event", event, this._baseEvent);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get allowedEvents() {
        return this._baseEvent.prototype.allowedEventTypes;
    }

    /**
     * Synchronously calls each of the listeners registered for the event named eventName, in the order they were registered, passing the supplied arguments to each. See also: {link https://nodejs.org/api/events.html#events_emitter_emit_eventname_args|EventEmitter.emit}
     *
     * @param {string}    eventName - The name of the event
     * @param {EventBase} event     - An event that inherits from EventBase and is type of event described by `eventBase` in {@link EventBusBase.constructor}
     * @param {...*}      [args]    - Any arguments
     *
     * @returns {Promise.<boolean>}          Returns a Promise that resolves to  `true` if the event had listeners; `false` otherwise
     */
    async emit(eventName, event, ... args) {
        this.checkEvent(event);

        return Breakpoint.checkBreak(event, () => {
            return super.emit(eventName, event, ... args);
        });
    }

    /**
     * Returns a Map of the event busses that have been created
     *
     * @returns {Map} A Map of the event busses, where the Map key is the name of the bus and the Map entry is the corresponding EventBusBase object
     */
    static get eventBusList() {
        return eventBusMap;
    }
}

/**
 * Listens for events on the specified {@link EventBusBase}, applying the specified {@link EventFilter}s before calling the
 * specified `callback`.
 */
class EventListener {
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
    constructor(bus, filterList, callback) {
        checkInstance("EventListener.constructor", "bus", bus, EventBusBase);
        checkType("EventListener.constructor", "callback", callback, "function");
        checkType("EventListener.constructor", "filterList", filterList, "object");

        if (!Array.isArray(filterList)) {
            filterList = [filterList];
        }

        this._callback = callback;
        this.filterList = [];
        this.attachedEvents = new Set();
        this.bus = bus;
        if (filterList[0] !== null) {
            filterList.forEach((f) => this.addFilter(f));
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
    addFilter(filter) {
        checkInstance("addFilter", "filter", filter, EventFilter);

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
        if (this.attachedEvents.size === 0) {
            this.attachedEvents = new Set([... this.bus.allowedEvents.values()]);
        }

        this.attachedEvents.forEach((eventType) => this.bus.addListener(eventType, this.applyFilter.bind(this)));
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

        this._callback(event);
    }
}

module.exports = {
    EventBase,
    EventBusBase,
    EventListener,
};
