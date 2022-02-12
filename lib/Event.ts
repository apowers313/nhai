/**
 * An abstract class for deriving events to be sent between Components
 */
export abstract class Event {
    abstract type: string;
    abstract data: unknown;
}
