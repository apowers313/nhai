const {EventBase, EventBusBase, EventFilter, EventListener} = require("./EventBase.js");
const {checkType, randomInt, createHiddenProp} = require("./Utility");
const {Component} = require("./Component");

/**
 * An event for communicating actions
 *
 * @extends EventBase
 */
class ActionEvent extends EventBase {
    /**
     * Creates a new ActionEvent
     *
     * @param {string} sourceName - The name of the source for this event
     * @param {string} sourceType - The type of the source for this event
     */
    constructor(sourceName, sourceType) {
        super();
        checkType("ActionEvent.constructor", "name", sourceName, "string");
        checkType("ActionEvent.constructor", "type", sourceType, "string");
        createHiddenProp(this, "_sourceName", sourceName, true);
        createHiddenProp(this, "_sourceType", sourceType, true);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get sourceName() {
        return this._sourceName || "initializing";
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get sourceType() {
        return this._sourceType || "initializing";
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get allowedEventTypes() {
        return new Set(["register", "waiting", "action"]);
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get eventBus() {
        return actionEventBus;
    }
}

const actionEventBus = new EventBusBase(ActionEvent);

/**
 * Selects the action to perform
 *
 * @extends Component
 */
class ActionSelection extends Component {
    /**
     * Creates a new ActionSelection component
     */
    constructor() {
        super("action-selection", "action", ActionEvent);

        // handle a sychronoous event loop
        this._filter = new EventFilter("allow", {eventType: "waiting", all: true});
        new EventListener(actionEventBus, this._filter, (e) => {
            console.log("got event", e);
            this.performAction();
        });
    }

    /**
     * Select and perform an action from the Action.actionList
     */
    performAction() {
        let al = Action.getActionList();
        let potentialActions = Array.from(al.values());

        // TODO: just performing random actions for now
        let selected = randomInt(0, potentialActions.length - 1);
        let ret = potentialActions[selected]();

        this.sendEvent("action", ret);
    }
}

new ActionSelection();
let actionList = new Map();

/**
 * Add and remove potential actions that may be selected
 */
class Action {
    /**
     * Adds a new action that can be performed
     *
     * @param {string}   name - The name of the action
     * @param {Function} fn   - The function to be performed
     */
    static addAction(name, fn) {
        checkType("addAction", "name", name, "string");
        checkType("addAction", "fn", fn, "function");

        if (actionList.has(name)) {
            throw new Error(`addAction '${name}' already exists`);
        }

        actionList.set(name, fn);
    }

    /**
     * Returns a list of all registered actions
     *
     * @returns {Map} List of actions that have been registered through {@link Action.addAction}
     */
    static getActionList() {
        return actionList;
    }

    /**
     * Removes all registered actions. Mostly used for testing.
     */
    static clearActions() {
        actionList.clear();
    }

    /** the action event bus, for communicating between action {@link Component|Components} */
    static get eventBus() {
        return actionEventBus;
    }
}

module.exports = {
    Action,
    ActionEvent,
    ActionSelection,
};
