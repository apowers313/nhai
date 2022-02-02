import * as fs from "fs";
import * as path from "path";
import random from "random";
import seedrandom from "seedrandom";

export enum Constant {
    MAX_RANDOM = (2 ** 31) - 1,
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
export function randomSeed(seed?: any) {
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
export function randomInt(min = 0, max: number = Constant.MAX_RANDOM) {
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
export function randomFloat(min = 0, max = 1) {
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
export function createHiddenProp(obj, prop, val, ro = false) {
    Object.defineProperty(obj, prop, {
        value: val,
        writable: !ro,
    });
}

interface FileOrStringOpts {
    basedir?: string;
    ext?: string;
}

/**
 * Resolves a string to a filename and loads that file, or simply returns the string if it doesn't resolve to the file.
 *
 * @param  {string} str  A filename or string literal
 * @param  {Object} opts Options for the resolution. `opts.basename` specifies a folder of where to look for the files. `opts.ext` specifies a file extension (e.g. `.html`) to append in looking for the file.
 * @returns {string}     Returns the contents of the file if resolved to a file; otherwise, returns the original string
 */
export function resolveFileOrString(str: string, opts: FileOrStringOpts = {}) {
    const {basedir} = opts;
    const {ext} = opts;

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

/**
 * Async version of setTimeout. To be replaced by [timers/promises](https://nodejs.org/api/timers.html) someday.
 *
 * @param  {number} ms Number of milliseconds to delay. Passed to setTimeout.
 * @returns {Promise}    A Promise that resolves to `undefined` after the specified number of milliseconds has passed.
 */
export async function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
