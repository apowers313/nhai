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
            return objCache.get(opts.id);
        }

        this.id = opts.id;
        this.opts = opts;
        this.isDirty = false;
        this.isLoaded = false;
        this.data = Object.create(null);
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
                    return target[prop] = value;
                }

                if (!target.isLoaded) {
                    throw new Error(`can't set value '${prop}' before loading TransientObject`);
                }

                this.isDirty = true;
                // console.log("setting data:", prop);
                // TODO deep properties
                return target.data[prop] = value;
            },
        });

        if (this.id) {
            objCache.set(this.id, obj);
        }

        return obj;
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
    toJson() {
        return this.toString();
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
