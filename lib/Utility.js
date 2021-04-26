const random = require("random");
const path = require("path");
const fs = require("fs");
const seedrandom = require("seedrandom");
const {Config} = require("./Config");
const MAX_RANDOM = (2 ** 31) - 1;

/**
 * A group of commonly used utility functions
 */
class Utility {
    /**
     * Checks the type of a variable and throws if it is the wrong type
     *
     * @param {string} fnName    - Name of the calling function (for cosmetic purposes)
     * @param {string} valueName - Name of the function being checked (for cosmetic purposes)
     * @param {*}      value     - The variable to check
     * @param {string} type      - The expected type of the variable as reported by `typeof`
     *
     * @throws {TypeError} If `value` is not `typeof type`
     */
    static checkType(fnName, valueName, value, type) {
        let checkType = (type === "class") ? "function" : type;
        if (typeof value !== checkType) {
            throw new TypeError(`${fnName} expected '${valueName}' to be a ${type}, got: ${value}`);
        }
        // if (type === "class" && !classRegex.test(Function.prototype.toString.call(value))) throw new TypeError(`${fnName} expected '${valueName}' to be a class`);
    }

    /**
     * Checks the type of a variable and throws if it is the wrong type
     *
     * @param {string} fnName    - Name of the calling function (for cosmetic purposes)
     * @param {string} valueName - Name of the function being checked (for cosmetic purposes)
     * @param {*}      value     - The object to check
     * @param {string} cls       - The expected type of the variable as reported by `typeof`
     *
     * @throws {TypeError} If `value` is not an object or not an `instanceof cls`
     */
    static checkInstance(fnName, valueName, value, cls) {
        Utility.checkType(fnName, valueName, value, "object");
        if (!(value instanceof cls)) {
            throw new TypeError(`${fnName} expected '${valueName}' to be instanceof ${cls.name}, got: ${value.constructor.name}`);
        }
    }

    // static checkEnum(fnName, valueName, value, ... args) {
    //     let idx = args.indexOf(value);
    //     if (idx === -1) throw new TypeError(`${fnName} expected '${valueName}' to be a ${type}, got: ${value}`);
    // }

    /**
     * Seed the pseudo-random number generator (PRNG). Note that the sequence of random numbers will always be the same for the same seed.
     *
     * @param   {*} seed - Takes any type and uses it as a seed for thte random number generator. `undefined` or `null` will create a non-deterministic sequence of numbers.
     */
    static randomSeed(seed) {
        random.use(seedrandom(seed));
    }

    // note: alternate RNG algorithms:
    // https://www.npmjs.com/package/seedrandom

    /**
     * Returns a random integer <= min and >= max
     *
     * @param   {number} [min=0]         - Minimum number to return
     * @param   {number} [max=(2**31)-1] - Maximum number to return
     *
     * @returns {number} A random integer
     */
    static randomInt(min = 0, max = MAX_RANDOM) {
        Utility.checkType("randomInt", "min", min, "number");
        Utility.checkType("randomInt", "max", min, "number");
        return random.int(min, max);
    }

    /**
     * Returns a random integer <= min and >= max
     *
     * @param   {number} [min=0] - Minimum number to return
     * @param   {number} [max=1] - Maximum number to return
     *
     * @returns {number} A random float
     */
    static randomFloat(min = 0, max = 1) {
        Utility.checkType("randomInt", "min", min, "number");
        Utility.checkType("randomInt", "max", min, "number");
        return random.float(min, max);
    }

    /**
     * Creates a new property on an object that is hidden (non-enumerable) and optionally read-only. Syntactic sugar around `Object.defineProperty` to help with readability.
     *
     * @param {object}  obj        - The object to create the new property on
     * @param {string}  prop       - The name of the new property
     * @param {*}       val        - The value for the new property
     * @param {boolean} [ro=false] - only (can't be written to). `false` if not specified.
     */
    static createHiddenProp(obj, prop, val, ro = false) {
        Object.defineProperty(obj, prop, {
            value: val,
            writable: !ro,
        });
    }

    /**
     * Resolves a string to a filename and loads that file, or simply returns the string if it doesn't resolve to the file.
     *
     * @param  {string} str  A filename or string literal
     * @param  {Object} opts Options for the resolution. `opts.basename` specifies a folder of where to look for the files. `opts.ext` specifies a file extension (e.g. `.html`) to append in looking for the file.
     * @returns {string}     Returns the contents of the file if resolved to a file; otherwise, returns the original string
     */
    static resolveFileOrString(str, opts = {}) {
        Utility.checkType("Utility.resolveFileOrString", "str", str, "string");
        let {basedir} = opts;
        let {ext} = opts;

        // if it contains newlines, it's a template and not a filename
        if (str.split("\n").length > 1) {
            return str;
        }

        let filename = str;

        // append an extension to the path if it's not already there
        if (ext && path.extname(filename) !== ext) {
            filename += ext;
        }

        // if the modified path exists, return the contents
        // XXX: prefer loading from basedir first so that people don't accidentially or intentionally highjack the filename
        if (basedir && fs.existsSync(path.resolve(basedir, filename))) {
            filename = path.resolve(basedir, filename);
            // return contents of file, remove "\r" for Windows compatibility
            return fs.readFileSync(filename, "utf8").replace(/\r/g, "");
        }

        // if the relative file path exists, return the contents
        if (fs.existsSync(filename)) {
            // return contents of file, remove "\r" for Windows compatibility
            return fs.readFileSync(filename, "utf8").replace(/\r/g, "");
        }

        // maybe it's a one-line template string?
        return str;
    }
}

// initial seed
Utility.randomSeed(Config.get("random-seed"));

// const classRegex = /^class/;

module.exports = Utility;
