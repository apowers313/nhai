const {Component} = require("./Component");
const {SignificanceEvent} = require("./Significance");
const {checkType, createHiddenProp} = require("./Utility");

/**
 * A class to represent internal states that are relative to {@link Significance}
 */
class Intrinsic extends Component {
    /**
     * Creates a new intrinsic value
     *
     * @param   {string} name Name of the intrisic (e.g. hunger, pain, etc.)
     */
    constructor(name) {
        checkType("Intrinsic.constructor", "name", name, "string");

        super(name, "intrinsic", SignificanceEvent);
        createHiddenProp(this, "_value", null);
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
            this._value = val;
            this.sendEvent("change", this._value);
        }
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get value() {
        return this._value;
    }
}

module.exports = {
    Intrinsic,
};
