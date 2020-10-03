// TODO: use NodeEventTarget instead of EventEmitter; still experimental in nodejs v14.5
const EventEmitter = require("events");

/**
 * Abstract base class for all the types of events
 */
class EventBase {
    constructor() {
        if(!(this.allowedEventTypes instanceof Set)) throw new TypeError ("allowedEventTypes must be a Set");
        // TODO
        // if(!(this.allowedSourceTypes instanceof Set)) throw new TypeError ("allowedSourceTypes must be a Set");
        if(!(this.eventBus instanceof EventBusBase)) throw new TypeError ("eventBus must be an EventBusBase");
        if(typeof this.sourceType !== "string") throw new TypeError ("sourceType must be a String");
        if(typeof this.sourceName !== "string") throw new TypeError ("sourceName must be a String");
    }

    /**
     * Returns a string representing the name of source of this event
     * @return {Set} Set of strings of valid event types
     */
    get sourceName() {
        throw new Error ("sourceName not implemented");
    }

    /**
     * Returns a string that describe the source type of this event
     * @return {Set} Set of strings of valid event types
     */
    get sourceType() {
        throw new Error ("sourceType not implemented");
    }

    /**
     * Returns a Set of strings that describe the valid types of sources
     * @return {Set} Set of strings of valid event types
     */
    // get allowedSourceTypes() {
    //     throw new Error ("allowedSourceTypes not implemented");
    // }

    /**
     * Returns a Set of strings that describe the valid types of events
     * @return {Set} Set of strings of valid event types
     */
    get allowedEventTypes() {
        throw new Error ("allowedEventTypes not implemented");
    }

    /**
     * Returns a EventEmitter that will be used for the global event bus
     * @return {EventEmitter} The object that will be used as the global event bus for this kind of event
     */
    get eventBus() {
        throw new Error ("eventBus not implemented");
    }

    /**
     * Emits the event on the specified event bus
     * @param  {String} type The type of the event
     * @param  {Object} data The optional data associated with the event
     */
    emit(type, ... data) {
        if(!this.allowedEventTypes.has(type)) throw new TypeError(`event type '${type}' not one of the allowedEventTypes`);
        this.type = type;
        this.data = (data.length < 2) ? data[0] : data;

        return this.eventBus.emit(type, this, ... data);
    }
}

/**
 * Abstract base class for all the event busses
 */
class EventBusBase extends EventEmitter {
    /**
     * Creates a new event bus that can only send or receive a specific type of events
     * @param  {EventBase}    baseEvent A class that implements EventBase. The event bus will only allow this type of event.
     * @param  {Any}           args          Arguments passed through to the EventEmitter base class.
     * @return {EventBusBase}              The EventBusBase object
     */
    constructor(baseEvent, ... args) {
        super(... args);

        if(typeof baseEvent !== "function") throw new TypeError("expected baseEvent arg to be class implementing EventBase");
        if(baseEvent === EventBase) throw new TypeError("constructor requires a class derived from EventBase but attempted to pass EventBase itself");
        if(!(baseEvent.prototype instanceof EventBase)) throw new TypeError("expected EventBase arg while constructing EventBusBase");
        this._baseEvent = baseEvent;
    }

    // bus name

    addListener(type, fn) {
        // TODO: add check for type against baseEvent.allowedTypes
        return super.addListener(type, (event, ... data) => {
            this.checkEvent(event);
            return fn(event, ... data);
        });
    }

    on(... args) {
        return this.addListener(... args);
    }

    /* istanbul ignore next */
    prependListener() {
        throw new Error("not implemented");
        // return super.prependListener(type, (event, ... data) => {
        //     this.checkEvent(event);
        //     return fn.call(event, ... data);
        // });
    }

    /**
     * Checks if an event is of the correct type for this event bus
     * @param  {EventBase} event The object to check to see if it is the right type
     * @throws TypeError on event that is wrong type
     */
    checkEvent(event) {
        if(!(event instanceof this._baseEvent)) throw new TypeError(`expected emitted event to be an instance of '${this._baseEvent.prototype.constructor.name}'`);
    }

    get allowedEvents() {
        return this._baseEvent.prototype.allowedEventTypes;
    }
}

class EventFilter {
    constructor(type, criteria, priority = 100) {
        if(typeof priority !== "number") throw new TypeError ("EventFilter constructor expected 'priority' to be a Number");
        this._priority = priority;

        if(type === "allow") {
            this.allow = true;
        } else if (type === "deny") {
            this.deny = true;
        } else {
            throw new TypeError ("EventFilter constructor expected 'type' to be 'allow' or 'deny'");
        }

        this._criteria = criteria;
        this._criteriaFn = EventFilter.buildTestFn(criteria);
    }

    get allow() {
        return this._isAllow;
    }

    set allow(v) {
        this._isAllow = !!v;
        this._isDeny = !this._isAllow;
    }

    get deny() {
        return this._isDeny;
    }

    set deny(v) {
        this._isDeny = !!v;
        this._isAllow = !this._isDeny;
    }

    get priority() {
        return this._priority;
    }

    get criteria() {
        return this._criteria;
    }

    matchEvent(e) {
        return this._criteriaFn(e);
    }

    denyEvent(e) {
        if (this.matchEvent(e) && this.deny) return true;
        return false;
    }

    allowEvent(e) {
        if(this.matchEvent(e) && this.allow) return true;
        return false;
    }

    static buildTestFn(criteria) {
        if(typeof criteria !== "object") throw new TypeError ("expected 'criteria' to be an Object");
        let criteriaFnList = [];
        let retFn;

        for (let key of Object.keys(criteria)) {
            switch(key) {
            case "sourceType":
                if(typeof criteria.sourceType !== "string") throw new TypeError ("expected 'sourceType' to be a String");
                criteriaFnList.push(matchSourceType.bind(null, criteria.sourceType));
                break;
            case "sourceName":
                if(typeof criteria.sourceName !== "string") throw new TypeError ("expected 'sourceName' to be a String");
                criteriaFnList.push(matchSourceName.bind(null, criteria.sourceName));
                break;
            case "eventType":
                if(typeof criteria.eventType !== "string") throw new TypeError ("expected 'eventType' to be a String");
                criteriaFnList.push(matchEventType.bind(null, criteria.eventType));
                break;
            case "fn":
                throw new Error("not implemented");
            case "any":
                if (typeof criteria.any !== "boolean") throw new TypeError ("expected 'any' to be a Boolean");
                if (criteria.any) retFn = matchCriteriaAny.bind(null, criteriaFnList);
                break;
            case "all":
                if (typeof criteria.all !== "boolean") throw new TypeError ("expected 'all' to be a Boolean");
                if (criteria.all) retFn = matchCriteriaAll.bind(null, criteriaFnList);
                break;
            case "none":
                if (typeof criteria.none !== "boolean") throw new TypeError ("expected 'none' to be a Boolean");
                if (criteria.none) retFn = matchCriteriaNone.bind(null, criteriaFnList);
                break;
            default:
                throw new TypeError(`key '${key}' isn't a valid filter criteria`);
            }
        }

        if(criteriaFnList.length < 1) throw new Error("expected 'criteria' to include at least one of 'sourceType', 'sourceName', 'eventType', 'fn', or 'busName'");
        if(!retFn) throw new Error("expected 'criteria' to include at least one of 'any', 'all', or 'none'");
        return retFn;

        function matchSourceType(name, obj) {
            if (obj.sourceType === name) return true;
            return false;
        }

        function matchSourceName(name, obj) {
            if (obj.sourceName === name) return true;
            return false;
        }

        function matchEventType(type, obj) {
            if (obj.type === type) return true;
            return false;
        }

        function matchCriteriaAny(fnList, e) {
            // return true if any function returns true
            return fnList.map((fn) => fn(e)).some((i) => i);
        }

        function matchCriteriaAll(fnList, e) {
            // return true if any function returns true
            return fnList.map((fn) => fn(e)).every((i) => i);
        }

        function matchCriteriaNone(fnList, e) {
            // return true if any function returns true
            return fnList.map((fn) => fn(e)).every((i) => i === false);
        }
    }
}

class EventListener {
    constructor(bus, filterList, callback) {
        if(!(bus instanceof EventBusBase)) throw new TypeError("EventListener constructor expected 'bus' to be EventBusBase");
        if(typeof callback !== "function") throw new TypeError("EventListener constructor expected 'callback' to be Function");
        if(typeof filterList !== "object") throw new TypeError("EventListener constructor expected 'filterList' to be Object");

        if(!Array.isArray(filterList)) filterList = [filterList];

        this._callback = callback;
        this.filterList = [];
        this.attachedEvents = new Set();
        this.bus = bus;
        if (filterList[0] !== null) filterList.forEach((f) => this.addFilter(f));

        // TODO: add all listeners
        this.update();
    }

    addFilter(filter) {
        if(!(filter instanceof EventFilter)) throw new TypeError("addFilter expected 'filter' to be EventFilter");

        this.filterList.push(filter);
        this.filterList.sort((e1, e2) => {
            return e1.priority - e2.priority;
        });

        if(filter.allow && filter.criteria.eventType) this.attachedEvents.add(filter.criteria.eventType);
    }

    // TODO
    // removeFilter() {
    //     // TODO: construct list of events to listen to
    //     // this.filterList.filter((f) => f.allow && f.criteria.eventType).map((f) => f.criteria.eventType);
    //     // this.stop();
    //     // this.update();
    //     throw new Error("not implemented");
    // }

    update() {
        // no events specified, listen for all allowable events
        if(this.attachedEvents.size === 0) this.attachedEvents = new Set([... this.bus.allowedEvents.values()]);

        this.attachedEvents.forEach((eventType) => this.bus.addListener(eventType, this.applyFilter.bind(this)));
    }

    // TODO
    // stop() {
    //     throw new Error("not implemented");
    // }

    applyFilter(e) {
        let allow = false;
        for(let filter of this.filterList) {
            if(filter.denyEvent(e)) return;
            if(filter.allowEvent(e)) {
                allow = true;
                break;
            }
        }

        // default: deny
        if(!allow) return;

        this._callback(e);
    }
}


module.exports = {
    EventBase,
    EventBusBase,
    EventFilter,
    EventListener
};