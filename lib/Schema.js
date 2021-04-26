let Ajv = require("ajv");
const {Config} = require("./Config");
const {checkType, resolveFileOrString} = require("./Utility");

let ajv = null;
// let validateFn = null;
let aliasMap = new Map();

/**
 * JSON schema validation
 */
class Schema {
    /**
     * Loads a new JSON schema for future reference. Since JSON schemes can cross-reference each other
     * through $id and $ref, all relevant schemas must be loaded so that references resolve before
     * attempting to validate data.
     *
     * @param  {string} name The human-readable name of the schema for future reference in the `validate` method.
     * @param  {string} str  The name of a file to load or a string representing a JSON schema
     */
    static loadSchema(name, str) {
        ajvCheck("Schema.loadSchema");
        checkType("Schema.loadSchema", "name", name, "string");
        checkType("Schema.loadSchema", "str", str, "string");

        let basedir = Config.get("schema-dir");
        let ext = ".json";

        let schemaStr = resolveFileOrString(str);
        let schemaJson;
        try {
            schemaJson = JSON.parse(schemaStr);
        } catch (e) {
            throw new Error(`Schema.loadSchema couldn't load schema: ${str}`);
        }
        ajv.addSchema(schemaJson, name, {basedir, ext});
    }

    /**
     * Validates data based on the name of the schema.
     *
     * @param  {string} name Then name (specified during `loadSchema`) or JSON Schema $id of the schema to use for validation.
     * @param  {any}    data The data to validate
     * @returns {boolean}     `true` if data is valid for the specified schema, `false` otherwise.
     */
    static validate(name, data) {
        ajvCheck("Schema.validate");
        if (Config.get("schema-disable-validation")) {
            return true;
        }

        // if (aliasMap.has(name)) {
        //     name = aliasMap.get(name);
        // }

        // return validateFn(data);
        let validateFn = ajv.getSchema(name);
        if (!validateFn) {
            throw new Error(`Schema.validate doesn't recognize the schema: ${name}`);
        }

        return validateFn(data);
    }

    /**
     * Initialize the schema system
     *
     * @returns {Promise} A Promise that resolves when initialization is complete.
     */
    static async init() {
        // TODO: load files from schemaDir
        //
        // Config.get("schema-disable-validation");
        ajv = new Ajv({
            // allErrors: false,
            allErrors: true,
            verbose: true,
            // TODO: create new logger
            // logger: {
            //     log: console.log.bind(console),
            //     warn: console.warn.bind(console),
            //     error: console.error.bind(console),
            // }
        });
    }

    /**
     * Shutdown the schema system
     *
     * @returns {Promise} A Promise that resolves when shutdown is complete.
     */
    static async shutdown() {
        ajv.removeSchema();
        ajv = null;
        aliasMap.clear();
    }
}

function ajvCheck(fnName) {
    if (!ajv) {
        throw new Error(`${fnName}: JSON validator (AJV) not initialized`);
    }
}

module.exports = {
    Schema,
};
