const {Grid} = require("./Grid");
const {FeatureExtractor, Utility} = require("../index");
const {checkInstance} = Utility;

/**
 * Identifies changes in vision
 */
class DeltaFeatureExtractor extends FeatureExtractor {
    /**
     * Creates a new feature extractor that identifies differences between sequential events containing Grids
     */
    constructor() {
        // XXX: well, this is awkward... can't use "this" in super() call
        super("delta", (... args) => {
            return this.createDelta(... args);
        });

        this.lastGrid = null;
    }

    /**
     * Creates a difference map between the current Grid and the previous one. Typically triggered by an event and not called directly.
     *
     * @param {Grid} newGrid - The current grid.
     *
     * @returns {Array.<object>|null} Returns the output of {@link Grid.diff}. Returns 'null' if this is the first event or if there was no difference between Grids.
     */
    createDelta(newGrid) {
        checkInstance("createDelta", "newGrid", newGrid, Grid);
        // console.log("deltaGrid", newGrid.toString());

        // check if this is the first input
        if (!this.lastGrid) {
            this.lastGrid = newGrid;
            return null;
        }

        let delta = Grid.diff(this.lastGrid, newGrid);
        this.lastGrid = newGrid;

        // no difference between this grid and previous one
        if (delta === null) {
            return delta;
        }

        // convert arguments to something more sensible for our purposes
        delta.forEach((d) => {
            d.oldVal = d.srcVal;
            d.newVal = d.dstVal;
            delete d.srcVal;
            delete d.dstVal;
        });
        return delta;
    }
}

module.exports = {DeltaFeatureExtractor};
