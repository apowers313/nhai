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
    const n = Number.parseInt(name);
    if (Number.isInteger(n)) {
        return n;
    }

    return name;
}

type SerializerFn = (val: number) => string;
type ConverterFn = (val: string | number) => number;
interface YValueOpts {
    serializer?: SerializerFn,
    converter?: ConverterFn,
}

class yValue {
    serializer: SerializerFn;
    converter: ConverterFn;
    #height: number;
    #baseOffset: number;
    #dataBuf: Uint8Array;

    constructor(dataBuf: Uint8Array, height: number, x: number, opts: YValueOpts = {}) {
        // createHiddenProp(this, "_height", height, true);
        // createHiddenProp(this, "_baseOffset", height * x, true);
        // createHiddenProp(this, "_dataBuf", dataBuf, true);
        this.#height = height;
        this.#baseOffset = height * x;
        this.#dataBuf = dataBuf;
        this.serializer = opts.serializer || defaultSerializer;
        this.converter = opts.converter || defaultConverter;

        return new Proxy(this, {
            get: this.getHandler.bind(this),
            set: this.setHandler.bind(this),
        });
    }

    // eslint-disable-next-line no-unused-vars
    getHandler(target, idx) {
        idx = getProp(idx);

        if (Number.isInteger(idx)) {
            checkBounds(this.#height, idx);
            const offset = this.#baseOffset + idx;
            return this.#dataBuf[offset];
        }

        throw new Error(`can't get property ${idx}`);
    }

    // eslint-disable-next-line no-unused-vars
    setHandler(target, idx, value) {
        idx = getProp(idx);

        if (Number.isInteger(idx)) {
            checkBounds(this.#height, idx);
            const offset = this.#baseOffset + idx;
            this.#dataBuf[offset] = this.converter(value);
            return true;
        }

        throw new Error(`can't set property ${idx}`);
    }
}

export type GridForEachCallback = (value: number, x: number, y: number, grid: Grid) => void;
export interface GridDiff {
    x: number,
    y: number,
    srcVal: number,
    dstVal: number;
}

interface GridOpts {
    buffer?: Uint8Array;
    serializer?: SerializerFn,
    converter?: ConverterFn,
}

/**
 * A two-dimensional array class
 */
export class Grid {
    serializer: SerializerFn;
    converter: ConverterFn;
    /** How wide the Grid is */
    readonly width: number;
    /** How tall the Grid is */
    readonly height: number;
    /** A {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array|Uint8Array} for the raw data underlying the Grid */
    readonly dataBuf: Uint8Array;
    #xArray: yValue[];

    /**
     * Creates a new two dimensional array
     *
     * @param {number}   width           - The width of the Grid
     * @param {height}   height          - The height of the Grid
     * @param {object}   opts            - Options
     * @param {Function} opts.serializer - A function that converts values from a number to a string for `toString`. Function accepts a single 'num' argument that is the Number to be converted and returns a string.
     * @param {Function} opts.converter  - A function that converts values to be stored in the Grid. Function accepts a single 'val' argument and returns an number.
     */
    constructor(width: number, height: number, opts: GridOpts = {}) {
        // createHiddenProp(this, "_width", width, true);
        // createHiddenProp(this, "_height", height, true);
        this.width = width;
        this.height = height;

        let db;
        if (opts.buffer && (opts.buffer instanceof Uint8Array)) {
            if (opts.buffer.byteLength !== (width * height)) {
                throw new Error("Grid constructor 'opts.buffer' was wrong size, didn't match width * height");
            }

            db = Uint8Array.from(opts.buffer);
        } else {
            db = new Uint8Array(width * height);
        }

        this.dataBuf = db;

        const xArray: yValue[] = [];
        for (let x = 0; x < width; x++) {
            xArray[x] = new yValue(this.dataBuf, height, x, opts);
        }

        this.#xArray = xArray;
        this.serializer = opts.serializer || defaultSerializer;
        this.converter = opts.converter || defaultConverter;

        return new Proxy(this, {
            get: this.#getHandler,
            set: this.#setHandler,
        });
    }

    // eslint-disable-next-line jsdoc/require-jsdoc
    #getHandler(target, idx) {
        idx = getProp(idx);

        if (Number.isInteger(idx)) {
            checkBounds(target.width, idx);
            return target.#xArray[idx];
        }

        return target[idx];
    }

    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-explicit-any
    #setHandler(target: any, idx: string): boolean {
        throw new Error(`can't set property ${idx}`);
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
        const ret = new Grid(this.width, this.height, {
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
        this.dataBuf.fill(0, 0, this.dataBuf.buffer.byteLength);
    }

    /**
     * Iterates all the cells of the Grid
     *
     * @param   {Function} cb Called for each cell of the Grid. Signature is `cb(value, x, y, grid)`.
     */
    forEach(cb: GridForEachCallback) {
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
    static from(val: string[]) {
        if (!Array.isArray(val)) {
            throw new TypeError(`Grid.from got unexpected type: ${val}`);
        }

        val.forEach((s) => {
            if (s.length !== val[0].length) {
                throw new TypeError("Grid.from: all lines must be the same length");
            }
        });

        const w = val[0].length;
        const h = val.length;
        const g = new Grid(w, h);

        g.forEach((v, x, y) => {
            g[x][y] = val[y][x];
        });

        return g;
    }

    /**
     * Compares two Grids and returns an Array of the differences. Grids must be the same height and width.
     *
     * @param src - The first grid to compare.
     * @param dst - The second grid to compare.
     *
     * @returns An Array of Objects describing the differences. Object for each change is `{x, y, srcVal, dstVal}`. Returns `null` if there are no differences.
     */
    static diff(src: Grid, dst: Grid): GridDiff[] | null {
        if (src.height !== dst.height || src.width !== dst.width) {
            throw new Error(`diff expected Grids to be same size: src(${src.width},${src.height}) vs dst(${dst.width},${dst.height})`);
        }

        const ret: GridDiff[] = [];
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

function defaultSerializer(val: number): string {
    if (val === undefined) {
        return "    ";
    }

    return val.toString().padStart(4);
}

function defaultConverter(val: number | string): number {
    if (typeof val === "number") {
        return val;
    }

    if (typeof val === "string" && val.length === 1) {
        return (val === " ") ? 0 : val.charCodeAt(0);
    }

    throw new Error(`unable to convert value ${val} to number`);
}
