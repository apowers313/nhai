import {Perception, PerceptionEvent} from "./Perception";
import {Component} from "./Component";

/** An event containing the extracted features of a perception system */
export class FeatureExtractorEvent extends PerceptionEvent {
    sourceName!: string;
    sourceType!: "feature-extractor";
}

export type FeatureExtractorCb = (evt: PerceptionEvent) => FeatureExtractorEvent | null;

// export class FeatureExtractorEvent extends ComponentEvent {}

/**
 * A base class for extracting features from Perception events
 *
 * @extends Component
 */
export class FeatureExtractor extends Component<PerceptionEvent> {
    eventBus: typeof Perception.eventBus;
    #cb: FeatureExtractorCb;

    /**
     * Creates a new feature extractor for pulling features out of raw perception data.
     *
     * @param {string}   name - The name of the feature extractor.
     * @param {Function} cb   - The function to be called to process the input data.
     */
    constructor(name: string, cb: FeatureExtractorCb) {
        super(name, "feature-extractor");
        this.eventBus = Perception.eventBus;
        this.#cb = cb;
    }

    /**
     * Listens for `data` events from another Component
     *
     * @param   {string} sourceName The name of the component to listen to
     */
    attach(sourceName: string) {
        this
            .eventBus
            .filter([
                (evt: PerceptionEvent): boolean => evt.sourceName === sourceName && evt.type === "data",
            ],
            (evt: PerceptionEvent) => {
                const retEvt = this.#cb.call(this, evt);
                if (retEvt) {
                    this.sendEvent(retEvt);
                }
            });
    }
}
