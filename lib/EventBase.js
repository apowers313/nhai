// TODO: use NodeEventTarget instead of EventEmitter; still experimental in nodejs v14.5
const EventEmitter = require("events");

/**
 * Abstract base class for all the types of events
 */
class EventBase {
    constructor() {
        if(!(this.allowedTypes instanceof Set)) throw new TypeError ("allowedTypes must be a Set");
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
     * Returns a Set of strings that describe the valid types of events
     * @return {Set} Set of strings of valid event types
     */
    get allowedTypes() {
        throw new Error ("allowedTypes not implemented");
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
        if(!this.allowedTypes.has(type)) throw new TypeError(`event type '${type}' not one of the allowedTypes`);
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

    prependListener() {
        /* istanbul ignore next */
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
}


module.exports = {
    EventBase,
    EventBusBase
};