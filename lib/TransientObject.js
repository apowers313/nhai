const objCache = new Map();

class TransientObject {
    constructor(opts = {}) {
        if (opts.id && objCache.has(opts.id)) {
            return objCache.get(opts.id);
        }

        this.id = opts.id;
        this.opts = opts;
        this.isDirty = false;
        this.isLoaded = false;
        this.data = Object.create(null);

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

    async load() {
        this.isLoaded = true;
    }

    async store() {
        this.isDirty = false;
    }

    async delete() {
        if (this.isDirty) {
            await this.store();
        }

        if (this.id) {
            objCache.delete(this.id);
        }
    }

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
