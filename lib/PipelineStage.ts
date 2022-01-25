const {checkType, checkInstance} = require("./Utility");

const converterMap = new Map();
const stageMap = new Map();

/**
 * A single stage of a Pipeline. Stages are strung together to create the Pipeline.
 */
class PipelineStage {
    /**
     * Creates a new PipelineStage
     *
     * @param  {string} name The name of this stage
     * @param  {Object} opts Options for this stage
     * @returns {PipelineStage}      The newly created PipelineStage
     */
    constructor(name, opts = {}) {
        checkType("PipelineStage.constructor", "name", name, "string");
        /** @type {string} The name of this stage */
        this.name = name;

        // checkType("PipelineStage.constructor", "fn", fn, "function");
        this.fn = opts.fn || null;

        this.inputType = opts.inputType || null;
        this.outputType = opts.outputType || null;
        this.conv = null;
        /** @type {Array<PipelineStage>} Outputs connected to this stage */
        this.nextStage = null;
    }

    /**
     * Set the next stage after this one. Will automatically convert between data types using a converter if necessary.
     *
     * @param {PipelineStage}  stage The next stage
     * @param {boolean} force If true, sets the next stage even if one already exists.
     */
    setOutput(stage, force = false) {
        checkInstance("PipelineStage.addOutput", "stage", stage, PipelineStage);
        // TODO: check for loops?
        let conv = PipelineStage.findConverter(this.outputType, stage.inputType);
        if (!conv) {
            throw new Error(`PipelineStage.addOutput: ${this.name} outputs '${this.outputType}', cannot convert to '${stage.inputType}' for ${stage.name}`);
        }

        if (this.nextStage && !force) {
            throw new Error("PipelineStage.addOutput: output already specified");
        }

        this.conv = conv;
        this.nextStage = stage;
    }

    /**
     * Executes this stage of the pipeline with the specified input
     *
     * @param  {any} input The data to use to execute this stage of the Pipeline
     * @returns {Promise<any>}       A Promise that resolves to the result of this stage or rejects with an Error.
     */
    async run(input) {
        // run this stage
        let res = await this.fn(input);

        // no outputs, all done
        if (!this.nextStage) {
            return res;
        }

        // run all outputs in parallel
        // return Promise.all(this.outputs.map((o) => o.stage.run(o.conv(res))));
        return this.nextStage.run(this.conv(res));
    }

    // TODO: toString() {}

    /**
     * Register a new stage in the global registry
     *
     * @param  {string}  name  The name of this stage
     * @param  {Function}  fn   The function to execute when this stage is run
     * @param  {boolean} force If true, foreces registration even if a stage with the same name already exists
     */
    static register(name, fn, force = false) {
        checkType("PipelineStage.register", "name", name, "string");
        checkType("PipelineStage.register", "fn", fn, "function");
        let existing = stageMap.get(name);
        if (existing && !force) {
            throw new Error(`PipelineStage.register: '${name}' already registered`);
        }

        stageMap.set(name, fn);
    }

    /**
     * Creates a new stage with the corresponding name and the specified options
     *
     * @param  {string} name The name of the stage to create. Name is resolved to a stage using hte global registry (see `register`)
     * @param  {object} opts The options for creating this stage
     * @returns {PipelineStage}      The newly created PipelineStage
     */
    static create(name, opts) {
        checkType("PipelineStage.create", "name", name, "string");
        let c = stageMap.get(name);
        if (!c) {
            throw new Error(`PipelineStage.create: '${name}' not found`);
        }

        return new c(name, opts);
    }

    /**
     * Register a function for converting between types. Used to automatically convert data types between Pipeline stages
     *
     * @param  {string}   inputType  The name of the input type
     * @param  {string}   outputType The name of the output type
     * @param  {Function} fn         A function that takes data of type `inputType`, converts it to `outputType`, and returns the converted value
     * @param  {boolean}  force      If true, forces registration even if an existing converter for the `inputType`/`outputType` pair already exists
     */
    static registerConverter(inputType, outputType, fn, force = false) {
        let inputMap = converterMap.get(inputType);
        if (!inputMap) {
            inputMap = new Map();
            converterMap.set(inputType, inputMap);
        }

        let convFn = inputMap.get(outputType);
        if (typeof convFn === "function" && !force) {
            throw new Error(`PipelineStage.registerConverter: '${inputType} -> ${outputType}' already registered`);
        }

        inputMap.set(outputType, fn);
    }

    /**
     * Retreive a converter function that can convert from `inputType` to `outputType`
     *
     * @param  {string} inputType  Name of the input type
     * @param  {string} outputType Name of the output type
     * @returns {Function}            Returns a function that can perform the conversion, or undefined if one doesn't exist
     */
    static findConverter(inputType, outputType) {
        // no conversion necessary
        if (inputType === outputType) {
            return (v) => v;
        }

        let typeMap = converterMap.get(inputType);
        if (!(typeMap instanceof Map)) {
            // throw new Error(`PipelineStage.findConverter couldn't find input type: '${inputType}'`);
            return null;
        }

        let converter = typeMap.get(outputType);
        if (typeof converter !== "function") {
            // throw new Error(`PipelineStage.findConverter couldn't find output type: '${outputType}'`);
            return null;
        }

        return converter;
    }

    /**
     * Removes all converters that were registered with `registerConverter`. Mostly used for testing.
     */
    static clearConverters() {
        converterMap.clear();
    }

    /**
     * Removes all PipelineStages that were registered with `register`. Mostly used for testing.
     */
    static clearAll() {
        stageMap.clear();
    }
}

module.exports = {
    PipelineStage,
};
