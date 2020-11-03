const {Component} = require("./Component");
const {SignificanceEvent} = require("./Significance");
const {checkType, createHiddenProp} = require("./Utility");

const intrinsicList = new Map();

/**
 * A class to represent internal states that are relative to {@link Significance}
 *
 * @extends Component
 */
class Intrinsic extends Component {
    /**
     * Creates a new intrinsic value
     *
     * @param {string} name Name of the intrisic (e.g. hunger, pain, etc.)
     * @param opts
     */
    constructor(name, opts = {}) {
        checkType("Intrinsic.constructor", "name", name, "string");
        opts.max = opts.max || 100;
        opts.min = opts.min || 0;
        opts.positive = !!opts.positive;
        checkType("Intrinsic.constructor", "opts.max", opts.max, "number");
        checkType("Intrinsic.constructor", "opts.min", opts.min, "number");
        checkType("Intrinsic.constructor", "opts.positive", opts.positive, "boolean");

        super(name, "intrinsic", SignificanceEvent);
        createHiddenProp(this, "_value", null);
        createHiddenProp(this, "_max", opts.max, true);
        createHiddenProp(this, "_min", opts.min, true);
        createHiddenProp(this, "_positive", opts.positive, true);
        intrinsicList.set(name, this);
    }

    /** the value of the intrinsic */
    set value(val) {
        if (typeof val === "string") {
            let tmp = parseFloat(val);
            if (Number.isNaN(tmp)) {
                throw new TypeError(`Intrinsic.value couldn't parse string as float: '${val}'`);
            }

            val = tmp;
        }

        checkType("set Intrinsic.value", "val", val, "number");

        if (this._value !== val) {
            let oldValue = this._value;
            this._value = val;
            this.sendEvent("change", {
                oldVal: oldValue,
                newVal: this._value,
                intrinsic: this,
            });
        }
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get value() {
        return this._value;
    }

    /** minimim valume allowed for the intrinsic */
    get min() {
        return this._min;
    }

    /** maximum valume allowed for the intrinsic */
    get max() {
        return this._max;
    }

    /** whether the intrisic is positive ('true') or negative ('false') */
    get positive() {
        return this._positive;
    }

    // static getIntrinsic(name) {
    //     checkType("getIntrinsic", "name", name, "string");

    //     return intrinsicList.get(name);
    // }

    // static clearList() {
    //     intrinsicList.clear();
    // }
}

module.exports = {
    Intrinsic,
};
