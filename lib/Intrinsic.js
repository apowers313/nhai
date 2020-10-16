const {Component} = require("./Component");
const {Significance} = require("./Significance");
const {Utility} = require("./Utility");
const {createHiddenProp} = Utility;

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
        super(name, "intrinsic", Significance.eventBus);
        createHiddenProp(this, "_value", null, true);
    }

    /** the value of the intrinsic */
    set value(val) {
        if (this._value !== val) {
            this._value = val;
            this.sendEvent("change", this._value);
        }
    }
}

module.exports = {
    Intrinsic,
};
