// TODO: use NodeEventTarget instead of EventEmitter; still experimental in nodejs v14.5
const EventEmitter = require("events");

/**
 * Abstract base class for all the types of events
 */
class EventBase {
    /**
     * Abstract constructor. Detects errors in derived classes.
     */
    constructor() {
        if (!(this.allowedEventTypes instanceof Set)) throw new TypeError("allowedEventTypes must be a Set");
        // TODO
        // if(!(this.allowedSourceTypes instanceof Set)) throw new TypeError ("allowedSourceTypes must be a Set");
        if (!(this.eventBus instanceof EventBusBase)) throw new TypeError("eventBus must be an EventBusBase");
        if (typeof this.sourceType !== "string") throw new TypeError("sourceType must be a String");
        if (typeof this.sourceName !== "string") throw new TypeError("sourceName must be a String");
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
     * @returns {boolean} Returns `true` if the event had listeners, `false` otherwise
     */
    emit(type, ... data) {
        if (!this.allowedEventTypes.has(type)) throw new TypeError(`event type '${type}' not one of the allowedEventTypes`);
        this.type = type;
        this.data = (data.length < 2) ? data[0] : data;

        return this.eventBus.emit(type, this, ... data);
    }
}

/**
 * Abstract base class for all the event busses
 *
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

        if (typeof baseEvent !== "function") throw new TypeError("expected baseEvent arg to be class implementing EventBase");
        if (baseEvent === EventBase) throw new TypeError("constructor requires a class derived from EventBase but attempted to pass EventBase itself");
        if (!(baseEvent.prototype instanceof EventBase)) throw new TypeError("expected EventBase arg while constructing EventBusBase");
        this._baseEvent = baseEvent;
    }

    /**
     * Alias for {@link EventBusBase#on}. See also: {@link https://nodejs.org/api/events.html#events_emitter_on_eventname_listener|EventEmitter.on}
     *
     * @param {string|symbol} eventName - The name of the event
     * @param {Function}      listener  - The callback function
     *
     * @returns {EventEmitter} Returns a reference to the EventEmitter, so that calls can be chained.
     */
    addListener(eventName, listener) {
        return this.on(eventName, listener);
    }

    /**
     * Wrapper for {@link https://nodejs.org/api/events.html#events_emitter_on_eventname_listener|EventEmitter.on} that
     * enforces event types sent over the bus.
     *
     * @param {string|symbol} eventName - The name of the event
     * @param {Function}      listener  - The callback function
     *
     * @returns {EventEmitter} Returns a reference to the EventEmitter, so that calls can be chained.
     */
    on(eventName, listener) {
        // TODO: add check for type against baseEvent.allowedTypes
        return super.addListener(eventName, (event, ... data) => {
            this.checkEvent(event);
            return listener(event, ... data);
        });
    }

    /* istanbul ignore next */
    // eslint-disable-next-line jsdoc/require-jsdoc
    prependListener() {
        throw new Error("not implemented");
        // return super.prependListener(type, (event, ... data) => {
        //     this.checkEvent(event);
        //     return fn.call(event, ... data);
        // });
    }

    /**
     * Checks if an event is of the correct type for this event bus
     *
     * @param {EventBase} event - The object to check to see if it is the right type
     * @throws TypeError on event that is wrong type
     */
    checkEvent(event) {
        if (!(event instanceof this._baseEvent)) throw new TypeError(`expected emitted event to be an instance of '${this._baseEvent.prototype.constructor.name}'`);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get allowedEvents() {
        return this._baseEvent.prototype.allowedEventTypes;
    }
}

/**
 * A filter that detects if an event should be allowed or denied based on some criteria.
 *
 * @property {boolean} allow    - `true` if this EventFilter is intended to allow an event
 * @property {boolean} deny     - `true` if this EventFilter is intended to deny an event
 * @property {number}  priority - The relative priority of this filter. Used when part of a {@link EventListener} `filterList`.
 * @property {object}  criteria - The original criteria object passed to the constructor
 */
class EventFilter {
    /**
     * Creates a new filter for an event. The filter is a simple detecter for a single set of criteria, but can be chained
     * together into a firewall-like set of policies as a {@link EventListener} `filterList`.
     *
     * @param {"allow"|"deny"} type                - Whether this filter is allowing or denying a specific event.
     * @param {object}         criteria            - An Object describing the filter rules
     * @param {string}         criteria.sourceType - Matches the `sourceType` of the {@link EventBase}
     * @param {string}         criteria.sourceName - Matches the `sourceName` of the {@link EventBase}
     * @param {string}         criteria.eventType  - Matches the `eventType` of the {@link EventBase}
     * @param {Function}       criteria.fn         - A custom function for making complex filtering decisions. Receives a
     *                                               single {@link EventBase} parameter and returns `true` for match and
     *                                               `false` for non-match.
     * @param {boolean}        criteria.any        - This filter is `true` if any criteria are true.
     * @param {boolean}        criteria.all        - This filter is `true` if all criteria are true.
     * @param {boolean}        criteria.none       - This filter is `true` if none of criteria are true.
     * @param {number}         [priority=100]      - The priority of this specific filter. Not useful for a single filter,
     *                                               but used as part of an {@link EventListener} `filterList`.
     */
    constructor(type, criteria, priority = 100) {
        if (typeof priority !== "number") throw new TypeError("EventFilter constructor expected 'priority' to be a Number");
        this._priority = priority;

        if (type === "allow") this.allow = true;
        else if (type === "deny") this.deny = true;
        else throw new TypeError("EventFilter constructor expected 'type' to be 'allow' or 'deny'");

        this._criteria = criteria;
        this._criteriaFn = EventFilter.buildTestFn(criteria);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    set allow(v) {
        this._isAllow = !!v;
        this._isDeny = !this._isAllow;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get allow() {
        return this._isAllow;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    set deny(v) {
        this._isDeny = !!v;
        this._isAllow = !this._isDeny;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get deny() {
        return this._isDeny;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get priority() {
        return this._priority;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get criteria() {
        return this._criteria;
    }

    /**
     * Indicates whether the event matches the criteria or not
     *
     * @param {EventBase} event - The event to evaluate against the criteria
     * @returns {boolean}   Returns `true` if the specified event matches the criteria specified in the
     * constructor, `false` otherwise
     */
    matchEvent(event) {
        return this._criteriaFn(event);
    }

    /**
     * Indicates whether this event should be denied or not
     *
     * @param {boolean} event - The event to evaluate against the criteria
     * @returns {boolean}       Returns `true` if the event matches the criteria and should be denied, `false` otherwise
     */
    denyEvent(event) {
        if (this.matchEvent(event) && this.deny) return true;
        return false;
    }

    /**
     * Indicates whether this event should be allowed or not
     *
     * @param {boolean} event - The event to evaluate against the criteria
     * @returns {boolean}       Returns `true` if the event matches the criteria and should be allowed, `false` otherwise
     */
    allowEvent(event) {
        if (this.matchEvent(event) && this.allow) return true;
        return false;
    }

    /**
     * Builds a test function for the specified criteria
     *
     * @param   {object} criteria The criteria object. See {@link EventFilter} constructor for details.
     * @returns {Function}        A function that recieves a single {@link EventBase} parameter and returns `true` if the
     * event matches the criteria, `false` otherwise
     */
    static buildTestFn(criteria) {
        if (typeof criteria !== "object") throw new TypeError("expected 'criteria' to be an Object");
        let criteriaFnList = [];
        let retFn;

        for (let key of Object.keys(criteria)) switch (key) {
        case "sourceType":
            if (typeof criteria.sourceType !== "string") throw new TypeError("expected 'sourceType' to be a String");
            criteriaFnList.push(matchSourceType.bind(null, criteria.sourceType));
            break;
        case "sourceName":
            if (typeof criteria.sourceName !== "string") throw new TypeError("expected 'sourceName' to be a String");
            criteriaFnList.push(matchSourceName.bind(null, criteria.sourceName));
            break;
        case "eventType":
            if (typeof criteria.eventType !== "string") throw new TypeError("expected 'eventType' to be a String");
            criteriaFnList.push(matchEventType.bind(null, criteria.eventType));
            break;
        case "fn":
            throw new Error("not implemented");
        case "any":
            if (typeof criteria.any !== "boolean") throw new TypeError("expected 'any' to be a Boolean");
            if (criteria.any) retFn = matchCriteriaAny.bind(null, criteriaFnList);
            break;
        case "all":
            if (typeof criteria.all !== "boolean") throw new TypeError("expected 'all' to be a Boolean");
            if (criteria.all) retFn = matchCriteriaAll.bind(null, criteriaFnList);
            break;
        case "none":
            if (typeof criteria.none !== "boolean") throw new TypeError("expected 'none' to be a Boolean");
            if (criteria.none) retFn = matchCriteriaNone.bind(null, criteriaFnList);
            break;
        default:
            throw new TypeError(`key '${key}' isn't a valid filter criteria`);
        }

        if (criteriaFnList.length < 1) throw new Error("expected 'criteria' to include at least one of 'sourceType', 'sourceName', 'eventType', 'fn', or 'busName'");
        if (!retFn) throw new Error("expected 'criteria' to include at least one of 'any', 'all', or 'none'");
        return retFn;

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchSourceType(name, obj) {
            if (obj.sourceType === name) return true;
            return false;
        }

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchSourceName(name, obj) {
            if (obj.sourceName === name) return true;
            return false;
        }

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchEventType(type, obj) {
            if (obj.type === type) return true;
            return false;
        }

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchCriteriaAny(fnList, e) {
            // return true if any function returns true
            return fnList.map((fn) => fn(e)).some((i) => i);
        }

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchCriteriaAll(fnList, e) {
            // return true if any function returns true
            return fnList.map((fn) => fn(e)).every((i) => i);
        }

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchCriteriaNone(fnList, e) {
            // return true if any function returns true
            return fnList.map((fn) => fn(e)).every((i) => i === false);
        }
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
        if (!(bus instanceof EventBusBase)) throw new TypeError("EventListener constructor expected 'bus' to be EventBusBase");
        if (typeof callback !== "function") throw new TypeError("EventListener constructor expected 'callback' to be Function");
        if (typeof filterList !== "object") throw new TypeError("EventListener constructor expected 'filterList' to be Object");

        if (!Array.isArray(filterList)) filterList = [filterList];

        this._callback = callback;
        this.filterList = [];
        this.attachedEvents = new Set();
        this.bus = bus;
        if (filterList[0] !== null) filterList.forEach((f) => this.addFilter(f));

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
        if (!(filter instanceof EventFilter)) throw new TypeError("addFilter expected 'filter' to be EventFilter");

        this.filterList.push(filter);
        this.filterList.sort((e1, e2) => {
            return e1.priority - e2.priority;
        });

        if (filter.allow && filter.criteria.eventType) this.attachedEvents.add(filter.criteria.eventType);
    }

    // TODO
    // removeFilter() {}

    /**
     * Calls {@link EventBusBase#addListener} on the bus for all the events that will be detected by the filters.
     */
    update() {
        // no events specified, listen for all allowable events
        if (this.attachedEvents.size === 0) this.attachedEvents = new Set([... this.bus.allowedEvents.values()]);

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
            if (filter.denyEvent(event)) return;
            if (filter.allowEvent(event)) {
                allow = true;
                break;
            }
        }

        // default: deny
        if (!allow) return;

        this._callback(event);
    }
}

module.exports = {
    EventBase,
    EventBusBase,
    EventFilter,
    EventListener,
};
