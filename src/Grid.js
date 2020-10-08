function checkBounds(max, val) {
    // TODO: check to make sure val is a number
    if (val >= max) throw new RangeError(`Attempting to access value out of bounds: requested ${val}, max is ${max - 1}`);
    if (val < 0) throw new RangeError(`Attempting to access value out of bounds: requested ${val}`);
}

function getProp(name) {
    if (name[0] === "_") throw new Error(`attempting to access private property ${name}`);
    let n = Number.parseInt(name);
    if (Number.isInteger(n)) return n;
    return name;
}

class yValue {
    constructor(dataBuf, height, x, opts = {}) {
        this._height = height;
        this._baseOffset = height * x;
        this._dataBuf = dataBuf;
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
            return this._dataBuf[offset] = this.converter(value);
        }

        throw new Error(`can't set property ${idx}`);
    }
}

/**
 * A two-dimensional array class
 */
class Grid {
    /**
     * Creates a new Grid
     *
     * @param {number}   width           - The width of the Grid
     * @param {height}   height          - The height of the Grid
     * @param {object}   opts            - Options
     * @param {Function} opts.serializer - A function that converts values to be stored in the Grid. Function accepts a single 'val' argument and returns an number.
     * @param {Function} opts.converter  - A function that converts values from a number to a string for `toString`. Function accepts a single 'num' argument and returns a string.
     */
    constructor(width, height, opts = {}) {
        this._width = width;
        this._height = height;
        // TODO: check that opts.buffer.length === width * height
        if (opts.buffer && (opts.buffer instanceof Uint8Array)) {
            if (opts.buffer.byteLength !== (width * height)) throw new Error("Grid constructor 'opts.buffer' was wrong size, didn't match width * height");
            this._dataBuf = Uint8Array.from(opts.buffer);
        } else {
            this._dataBuf = new Uint8Array(width * height);
        }

        let xArray = [];
        for (let x = 0; x < width; x++) xArray[x] = new yValue(this._dataBuf, height, x, opts);

        this._xArray = xArray;
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

    /** A Uint8Array for the raw data underlying the Grid */
    get dataBuf() {
        return this._dataBuf;
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
            for (let x = 0; x < this.width; x++) output += this.serializer(this[x][y]);

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
    if (val === undefined) return "    ";
    return val.toString().padStart(4);
}

function defaultConverter(val) {
    if (typeof val === "number") return val;
    if (typeof val === "string" && val.length === 1) return val.charCodeAt(0);
    throw new Error(`unable to convert value ${val} to number`);
}

module.exports = Grid;
