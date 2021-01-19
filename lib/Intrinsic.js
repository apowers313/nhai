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
        opts.max = (opts.max !== undefined) ? opts.max : 100;
        opts.min = (opts.min !== undefined) ? opts.min : 0;
        opts.positive = !!opts.positive;
        opts.converter = opts.converter || Intrinsic.defaultConverter;
        checkType("Intrinsic.constructor", "opts.max", opts.max, "number");
        checkType("Intrinsic.constructor", "opts.min", opts.min, "number");
        checkType("Intrinsic.constructor", "opts.positive", opts.positive, "boolean");
        checkType("Intrinsic.constructor", "opts.converter", opts.converter, "function");

        if (opts.min >= opts.max) {
            throw new RangeError("Intrinsic.constructor: opts.min must be less than opts.max");
        }

        super(name, "intrinsic", SignificanceEvent);
        createHiddenProp(this, "_value", null);
        createHiddenProp(this, "_max", opts.max, true);
        createHiddenProp(this, "_min", opts.min, true);
        createHiddenProp(this, "_range", opts.max - opts.min, true);
        createHiddenProp(this, "_positive", opts.positive, true);
        createHiddenProp(this, "_converter", opts.converter, true);
        intrinsicList.set(name, this);
    }

    /** the value of the intrinsic */
    set value(val) {
        val = this._converter(val);

        checkType("set Intrinsic.value", "val", val, "number");

        if (val > this._max) {
            throw new RangeError(`Intrinsic#value: attempted to set value (${val}) greater than max (${this._max})`);
        }

        if (val < this._min) {
            throw new RangeError(`Intrinsic#value: attempted to set value (${val}) less than min (${this._min})`);
        }

        if (this._value !== val) {
            let oldVal = this._value;
            let oldNormVal = this.normalizedValue;
            this._value = val;
            this.sendEvent("change", {
                oldVal,
                oldNormVal,
                newVal: this._value,
                newNormVal: this.normalizedValue,
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

    /** the number of values between `min` and `max` */
    get range() {
        return this._range;
    }

    /** the value normalized to be a number between zero and one */
    get normalizedValue() {
        return ((this._value - this._min) / this._range);
    }

    /** whether the intrisic is positive ('true') or negative ('false') */
    get positive() {
        return this._positive;
    }

    /**
     * The default method for converting values to numbers. Mostly a wrapper for `parseFloat`.
     *
     * @param {*} val - The value to be converted to a number
     *
     * @returns {number} The numeric form of `val`
     */
    static defaultConverter(val) {
        if (typeof val === "string") {
            let tmp = parseFloat(val);
            if (Number.isNaN(tmp)) {
                throw new TypeError(`Intrinsic#defaultConverter couldn't parse string as float: '${val}'`);
            }

            val = tmp;
        }

        return val;
    }
}

module.exports = {
    Intrinsic,
};
