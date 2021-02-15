const {checkType} = require("./Utility");

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
        checkType("EventFilter.constructor", "type", type, "string");
        checkType("EventFilter.constructor", "criteria", criteria, "object");
        checkType("EventFilter.constructor", "priority", priority, "number");
        this._priority = priority;

        if (type === "allow") {
            this.allow = true;
        } else if (type === "deny") {
            this.deny = true;
        } else {
            throw new TypeError("EventFilter constructor expected 'type' to be 'allow' or 'deny'");
        }

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
        if (this.matchEvent(event) && this.deny) {
            return true;
        }

        return false;
    }

    /**
     * Indicates whether this event should be allowed or not
     *
     * @param {boolean} event - The event to evaluate against the criteria
     * @returns {boolean}       Returns `true` if the event matches the criteria and should be allowed, `false` otherwise
     */
    allowEvent(event) {
        if (this.matchEvent(event) && this.allow) {
            return true;
        }

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
        checkType("buildTestFn", "criteria", criteria, "object");
        let criteriaFnList = [];
        let retFn;

        for (let key of Object.keys(criteria)) {
            switch (key) {
            case "sourceType":
                checkType("buildTestFn", "criteria.sourceType", criteria.sourceType, "string");
                criteriaFnList.push(matchSourceType.bind(null, criteria.sourceType));
                break;
            case "sourceName":
                checkType("buildTestFn", "criteria.sourceName", criteria.sourceName, "string");
                criteriaFnList.push(matchSourceName.bind(null, criteria.sourceName));
                break;
            case "eventType":
                checkType("buildTestFn", "criteria.eventType", criteria.eventType, "string");
                criteriaFnList.push(matchEventType.bind(null, criteria.eventType));
                break;
            case "fn":
                throw new Error("not implemented");
            case "any":
                checkType("buildTestFn", "criteria.any", criteria.any, "boolean");
                if (criteria.any) {
                    retFn = matchCriteriaAny.bind(null, criteriaFnList);
                }

                break;
            case "all":
                checkType("buildTestFn", "criteria.all", criteria.all, "boolean");
                if (criteria.all) {
                    retFn = matchCriteriaAll.bind(null, criteriaFnList);
                }

                break;
            case "none":
                checkType("buildTestFn", "criteria.none", criteria.none, "boolean");
                if (criteria.none) {
                    retFn = matchCriteriaNone.bind(null, criteriaFnList);
                }

                break;
            default:
                throw new TypeError(`key '${key}' isn't a valid filter criteria`);
            }
        }

        if (criteriaFnList.length < 1) {
            throw new Error("expected 'criteria' to include at least one of 'sourceType', 'sourceName', 'eventType', 'fn', or 'busName'");
        }

        if (!retFn) {
            throw new Error("expected 'criteria' to include at least one of 'any', 'all', or 'none'");
        }

        return retFn;

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchSourceType(name, obj) {
            if (obj.sourceType === name) {
                return true;
            }

            return false;
        }

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchSourceName(name, obj) {
            if (obj.sourceName === name) {
                return true;
            }

            return false;
        }

        /* eslint-disable-next-line jsdoc/require-jsdoc */
        function matchEventType(type, obj) {
            if (obj.type === type) {
                return true;
            }

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

module.exports = {
    EventFilter,
};
