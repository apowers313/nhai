const util = require("util");
const {v4: uuid} = require("uuid");
const objCache = new Map();

/**
 * An abstract class for objects that will be collected and potentially stored in non-volitile storage when they are no longer immediately needed.
 */
class TransientObject {
    /**
     * Constructor for TransientObject
     *
     * @param  {Object} opts Options for the new TransientObject
     * @param  {any} opts.id An optional globally unique identifier for the TransientObject.
     * @returns {TransientObject}      The newly created Transient object wrapped in a Proxy object. The Proxy redirects any get / set access to the `data` property of hte object.
     */
    constructor(opts = {}) {
        if (opts.id && objCache.has(opts.id)) {
            let o = objCache.get(opts.id);
            o.isCached = true;
            return o;
        }

        this.id = opts.id;
        if (!this.id) {
            this.isLoaded = true;
            this.isDirty = true;
            this.isNew = true;
            this.id = uuid();
        } else {
            this.isDirty = false;
            this.isLoaded = false;
            this.isNew = false;
        }

        this.isCached = false;
        this.data = Object.create(null);
        // TODO: schema
        let props = opts.props || [];
        props.forEach((p) => Object.defineProperty(this, p, {configurable: true, enumerable: true, writable: true}));

        let obj = new Proxy(this, {
            get: function(target, prop) {
                if (prop in target) {
                    // console.log("hasOwnProperty:", prop);
                    return target[prop];
                }

                // console.log("getting data:", prop);
                if (!target.isLoaded) {
                    throw new Error(`can't get value '${prop}' before loading TransientObject`);
                }

                return target.data[prop];
            },
            set: function(target, prop, value) {
                if (prop in target) {
                    // console.log("hasOwnProperty:", prop);
                    target[prop] = value;
                    return true;
                }

                if (!target.isLoaded) {
                    throw new Error(`can't set value '${prop}' before loading TransientObject`);
                }

                target.setValidator(prop, value);

                target.isDirty = true;
                // console.log("setting data:", prop);
                // TODO deep properties
                target.data[prop] = value;

                return true;
            },
        });

        objCache.set(this.id, obj);

        return obj;
    }

    setValidator() {
        // to be overloaded by child classes and throw on Error
    }

    /**
     * Abstract loader for the TransientObject. Classes that derive from this class will overload this function.
     */
    async load() {
        this.isLoaded = true;
    }

    /**
     * Abstract function for storing for the TransientObject. Classes that derive from this class will overload this function.
     */
    async store() {
        this.isDirty = false;
    }

    /**
     * Abstract function for deleting for the TransientObject. Classes that derive from this class will overload this function.
     */
    async delete() {
        if (this.isDirty) {
            await this.store();
        }

        if (this.id) {
            objCache.delete(this.id);
        }
    }

    /**
     * Converts the transient object to a string.
     *
     * @returns {string} A string representation of the TransientObject
     */
    toString() {
        return JSON.stringify(this.data);
    }

    /**
     * Synonym for toString()
     */
    toJSON() {
        return this.toString();
    }

    toCypherMap() {
        let str = "{ ";

        // doesn't iterate child objects because cypher doesn't allow maps to have child objects
        let keys = Object.keys(this.data);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = this.data[keys[i]];
            if (typeof value === "string") {
                value = `'${value}'`;
            }

            str += `${key}: ${value}`;

            if (i < (keys.length - 1)) {
                str += ", ";
            }
        }

        str += " }";

        return str;
    }

    static cache = objCache;

    /**
     * Method for deleting an object with the matching `id`
     *
     * @param  {any} id The ID to match
     * @returns {boolean}    Returns true on success, false on failure
     */
    static async deleteId(id) {
        let obj = objCache.get(id);
        if (!obj) {
            return false;
        }

        await obj.delete();

        return true;
    }
}

module.exports = {
    TransientObject,
};
