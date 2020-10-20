const {checkType, checkInstance, createHiddenProp} = require("../index").Utility;

function checkBounds(max, val) {
    // TODO: check to make sure val is a number
    if (val >= max) {
        throw new RangeError(`Attempting to access value out of bounds: requested ${val}, max is ${max - 1}`);
    }

    if (val < 0) {
        throw new RangeError(`Attempting to access value out of bounds: requested ${val}`);
    }
}

function getProp(name) {
    if (name[0] === "_") {
        throw new Error(`attempting to access private property ${name}`);
    }

    let n = Number.parseInt(name);
    if (Number.isInteger(n)) {
        return n;
    }

    return name;
}

class yValue {
    constructor(dataBuf, height, x, opts = {}) {
        createHiddenProp(this, "_height", height, true);
        createHiddenProp(this, "_baseOffset", height * x, true);
        createHiddenProp(this, "_dataBuf", dataBuf, true);
        this.serializer = opts.serializer || defaultSerializer;
        this.converter = opts.converter || defaultConverter;

        return new Proxy(this, {
            get: this.getHandler.bind(this),
            set: this.setHandler.bind(this),
        });
    }

    // eslint-disable-next-line no-unused-vars
    getHandler(target, idx, receiver) {
        idx = getProp(idx);

        if (Number.isInteger(idx)) {
            checkBounds(this._height, idx);
            let offset = this._baseOffset + idx;
            return this._dataBuf[offset];
        }

        throw new Error(`can't get property ${idx}`);
    }

    // eslint-disable-next-line no-unused-vars
    setHandler(target, idx, value, receiver) {
        idx = getProp(idx);

        if (Number.isInteger(idx)) {
            checkBounds(this._height, idx);
            let offset = this._baseOffset + idx;
            this._dataBuf[offset] = this.converter(value);
            return true;
        }

        throw new Error(`can't set property ${idx}`);
    }
}

/**
 * A two-dimensional array class
 */
class Grid {
    /**
     * Creates a new two dimensional array
     *
     * @param {number}   width           - The width of the Grid
     * @param {height}   height          - The height of the Grid
     * @param {object}   opts            - Options
     * @param {Function} opts.serializer - A function that converts values from a number to a string for `toString`. Function accepts a single 'num' argument that is the Number to be converted and returns a string.
     * @param {Function} opts.converter  - A function that converts values to be stored in the Grid. Function accepts a single 'val' argument and returns an number.
     */
    constructor(width, height, opts = {}) {
        createHiddenProp(this, "_width", width, true);
        createHiddenProp(this, "_height", height, true);

        let db;
        if (opts.buffer && (opts.buffer instanceof Uint8Array)) {
            if (opts.buffer.byteLength !== (width * height)) {
                throw new Error("Grid constructor 'opts.buffer' was wrong size, didn't match width * height");
            }

            db = Uint8Array.from(opts.buffer);
        } else {
            db = new Uint8Array(width * height);
        }

        createHiddenProp(this, "_dataBuf", db, true);

        let xArray = [];
        for (let x = 0; x < width; x++) {
            xArray[x] = new yValue(this._dataBuf, height, x, opts);
        }

        createHiddenProp(this, "_xArray", xArray, true);
        this.serializer = opts.serializer || defaultSerializer;
        this.converter = opts.converter || defaultConverter;

        return new Proxy(this, {
            get: getHandler.bind(this),
            set: setHandler.bind(this),
        });
    }

    /** How wide the Grid is */
    get width() {
        return this._width;
    }

    /** How tall the Grid is */
    get height() {
        return this._height;
    }

    /** A {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array|Uint8Array} for the raw data underlying the Grid */
    get dataBuf() {
        return this._dataBuf;
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    get [Symbol.toStringTag]() {
        return "Grid";
    }

    /**
     * Convert the Grid to a human-readable string. If `converter` was specified as an option during construction, it is used to
     * convert each element.
     *
     * @returns {string} A human-readable string representing the Grid.
     */
    toString() {
        let output = "";

        for (let y = 0; y < this.height; y++) {
            // output += "\"";
            for (let x = 0; x < this.width; x++) {
                output += this.serializer(this[x][y]);
            }

            // output += "\"\\n +\n";
            output += "\n";
        }

        return output;
    }

    /**
     * Creates a copy of the Grid with the same values but different underlying data.
     *
     * @returns {Grid} A duplicate of the Grid
     */
    copy() {
        let ret = new Grid(this.width, this.height, {
            serializer: this.serializer,
            converter: this.converter,
            buffer: this.dataBuf,
        });

        return ret;
    }

    /**
     * Resets all data in the Grid to zero.
     */
    clear() {
        this.dataBuf.fill(0, 0, this.dataBuf.buffer.length);
    }

    /**
     * Iterates all the cells of the Grid
     *
     * @param   {Function} cb Called for each cell of the Grid. Signature is `cb(value, x, y, grid)`.
     */
    forEach(cb) {
        checkType("forEach", "cb", cb, "function");
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                cb(this[x][y], x, y, this);
            }
        }
    }

    /**
     * Creates a new Grid from an Array of strings.
     *
     * @param   {Array.<string>} val An array of equal length strings to set the initial value of the Grid.
     * The Grid height will be equal to the number of elements in the array, and the width will be equal to
     * the length of the strings.
     */
    static from(val) {
        if (Array.isArray(val)) {
            checkType("Grid.from", "val[0]", val[0], "string");
            // TODO: assuming array of strings
            // TODO: all lines are the same length
            let w = val[0].length;
            let h = val.length;
            let g = new Grid(w, h);

            g.forEach((v, x, y) => {
                g[x][y] = val[y][x];
            });

            return g;
        }

        // TODO: .from(ArrayBuffer,x,y)
        throw new TypeError(`Grid.from got unexpected type: ${val}`);
    }

    /**
     * Compares two Grids and returns an Array of the differences. Grids must be the same height and width.
     *
     * @param {Grid} src - The first grid to compare.
     * @param {Grid} dst - The second grid to compare.
     *
     * @returns {Array.<object>|null}     An Array of Objects describing the differences. Object for each change is `{x, y, srcVal, dstVal}`. Returns `null` if there are no differences.
     */
    static diff(src, dst) {
        checkInstance("diff", "src", src, Grid);
        checkInstance("diff", "dst", dst, Grid);
        if (src.height !== dst.height || src.width !== dst.width) {
            throw new Error(`diff expected Grids to be same size: src(${src.width},${src.height}) vs dst(${dst.width},${dst.height})`);
        }

        let ret = [];
        src.forEach((v, x, y) => {
            if (src[x][y] !== dst[x][y]) {
                ret.push({
                    x,
                    y,
                    srcVal: src[x][y],
                    dstVal: dst[x][y],
                });
            }
        });

        return ret.length ? ret : null;
    }
}

// eslint-disable-next-line no-unused-vars
function getHandler(target, idx, receiver) {
    idx = getProp(idx);

    if (Number.isInteger(idx)) {
        checkBounds(this._width, idx);
        return this._xArray[idx];
    }

    return this[idx];
}

// eslint-disable-next-line no-unused-vars
function setHandler(target, idx, value, receiver) {
    // console.log("Grid setHandler");
    // idx = getProp(idx);
    // if (Number.isInteger(idx)) throw new Error(`can't set 'x' value: ${idx}`);
    throw new Error(`can't set property ${idx}`);
}

function defaultSerializer(val) {
    if (val === undefined) {
        return "    ";
    }

    return val.toString().padStart(4);
}

function defaultConverter(val) {
    if (typeof val === "number") {
        return val;
    }

    if (typeof val === "string" && val.length === 1) {
        return (val === " ") ? 0 : val.charCodeAt(0);
    }

    throw new Error(`unable to convert value ${val} to number`);
}

module.exports = {Grid};
