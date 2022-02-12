import {Observable, Subject} from "rxjs";
import {Event} from "./Event";

export type ListenerSyncFn<T> = (value: T) => void;
export type ListenerAsyncFn<T> = (value: T) => Promise<void>;

const eventBusMap: Map<string, EventBus<any>> = new Map();

/**
 * A message channel for sending Events between components
 */
export abstract class EventBus<EventType extends Event> {
    #subject: Subject<EventType>;
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
        this.#subject.next(evt);
    }

    /**
     * Listens for an event on the EventBus, receiving a callback when the Event is emitted
     *
     * @param arg An Observable that will receive the event, or a callback function that will receive the event.
     */
    listen(arg: Observable<EventType> | ListenerSyncFn<EventType> | ListenerAsyncFn<EventType>) {
        if (arg instanceof Observable) {
            arg.subscribe(this.#subject);
        } else {
            this.#subject.subscribe(arg);
        }
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
