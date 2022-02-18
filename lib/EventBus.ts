import {Observable, Observer, OperatorFunction, Subject, Subscription} from "rxjs";
import {Event} from "./Event";
import {filter} from "rxjs/operators";

export type ListenerSyncFn<T> = (value: T) => void;
export type ListenerAsyncFn<T> = (value: T) => Promise<void>;
export type FilterFn<T> = (evt: T) => boolean;

const eventBusMap: Map<string, EventBus<any>> = new Map();

/**
 * A message channel for sending Events between components
 */
export abstract class EventBus<EventType extends Event> {
    #subject: Subject<EventType>;
    #subscribers: Set<Subscription> = new Set();
    #name: string;

    /**
     * Creates a new EventBus
     *
     * @param name The name of the EventBus. Can be used to retreive the EventBus later.
     */
    constructor(name: string) {
        this.#subject = new Subject<EventType>();
        this.#name = name;
        eventBusMap.set(name, this);
    }

    /**
     * Sends an event on the EventBus which will be received by all listeners
     *
     * @param evt The Event to be sent
     */
    send(evt: EventType) {
        console.log("EventBus.send:", evt);
        this.#subject.next(evt);
    }

    listen(obs: Partial<Observer<EventType>>): void;
    listen(next: ListenerSyncFn<EventType>): void;
    /**
     * Listens for an event on the EventBus, receiving a callback when the Event is emitted
     *
     * @param arg An Observable that will receive the event, or a callback function that will receive the event.
     */
    // listen(arg: ListenerAsyncFn<EventType>): void;
    listen(arg: never): void {
        const sub: Subscription = this.#subject.subscribe(arg);
        this.#subscribers.add(sub);
    }

    /**
     * Returns the number of listeners that are attached to the bus
     *
     * @returns The number of listeners that are attached to the bus
     */
    get listenerCount(): number {
        return this.#subscribers.size;
    }

    /**
     * Returns an rxjs {@link https://rxjs.dev/guide/observable | Observable} for the EventBus
     *
     * @returns An Observable that will emit all the events from the EventBus
     */
    get observable(): Observable<EventType> {
        return this.#subject.pipe();
    }

    /**
     * Syntactic sugar around rxjs `pipe`
     *
     * @param ops An array of rxjs operators
     * @param cb The callback function for events that are received
     */
    pipe(ops: OperatorFunction<any, any>[], cb: ListenerSyncFn<EventType>) {
        this
            .#subject
            .pipe.apply(this.#subject, ops as any)
            .subscribe(cb as (value: unknown) => void);
    }

    /**
     * Filters out events and calls a callback for any that aren't filtered. Syntactic sugar around rxjs's `pipe`
     *
     * @param filterFns An array of filter functions that determine of the event should be received or not
     * @param cb A callback for any events that aren't filtered out
     */
    filter(filterFns: FilterFn<EventType>[], cb: ListenerSyncFn<EventType>) {
        const filters = filterFns.map((f) => filter(f));
        this
            .#subject
            .pipe.apply(this.#subject, filters as any)
            .subscribe(cb as (value: unknown) => void);
    }

    /**
     * Shuts down the bus, removing all subscribers
     */
    shutdown() {
        [... this.#subscribers.values()].forEach((sub) => {
            sub.unsubscribe();
        });

        this.#subscribers.clear();
        this.#subject = new Subject<EventType>();
    }

    /**
     * Returns a list of all event busses
     *
     * @returns A Set of all event busses
     */
    static list(): Set<EventBus<any>> {
        return new Set(eventBusMap.values());
    }

    /**
     * Clears the internal list of all event busses. Mostly used for testing.
     */
    static clear() {
        eventBusMap.clear();
    }
}
