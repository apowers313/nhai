const {checkType} = require("./Utility");
const {PipelineStage} = require("./PipelineStage");

const pipelineMap = new Map();

/**
 * A structure for bulding and reconfiguring algorithms. This is meant to
 * accelerate experimentation by creating re-usable and reconfigurable chunks
 * of code. When an algorithm is finalized this can be optimized out by
 * replacing the Pipeline with a suitable function that performs the same algorithm.
 */
class Pipeline {
    /**
     * constructor
     *
     * @param  {string} name The name of the Pipeline
     * @returns {Pipeline}      The Pipeline that was created
     */
    constructor(name) {
        checkType("Pipeline.constructor", "name", name, "string");
        this.name = name;
        this.firstStage = null;
    }

    /**
     * Execute the pipeline
     *
     * @param  {any} input Input data value for the first stage of the pipeline
     * @returns {Promise<any>}       A Promise that resolves to the value of the pipeline, or rejects on error
     */
    async run(input) {
        return this.firstStage.run(input);
    }

    /**
     * Builds the pipeline from a description and assigns it to the first stage of this pipeline. Pipeline
     * building is done using the static `build` method.
     *
     * @param  {Array<string>} desc An array of pipeline stage names or objects describing each stage.
     */
    build(desc) {
        this.firstStage = Pipeline.build(desc);
    }

    // TODO: toString() {}

    /**
     * Builds a pipeline based on a description of the pipeline. The pipeline is an Array of pipeline stage objects.
     *
     * @param  {Array<string|Object>} desc The description of the pipeline. See the test file `pipeline.js` for examples
     * @returns {PipelineStage}     The first stage of the built pipeline.
     */
    static build(desc) {
        if (typeof desc === "string") {
            return PipelineStage.create(desc);
        }

        if (typeof desc === "object" && !Array.isArray(desc)) {
            let keys = Object.keys(desc);

            // must only be one key
            if (keys.length !== 1) {
                throw new TypeError(`Pipeline.build: expected description object to have exactly one key, got: ${keys}`);
            }

            let name = keys[0];

            // serial is a special key
            if (name === "serial") {
                return Pipeline.build(desc.serial);
            }

            return PipelineStage.create(name, desc[name]);
        }

        if (!Array.isArray(desc)) {
            throw new TypeError();
        }

        // convert all stage descriptions to PipelineStage objects
        let stages = desc.map((item) => {
            return Pipeline.build(item);
        });

        // link the stages together
        stages.reduce((thisStage, nextStage) => {
            thisStage.setOutput(nextStage);
            return nextStage;
        });

        // save the first stage
        this.firstStage = stages[0];

        return this.firstStage;
    }

    /**
     * Creates a new pipleine named `name` built to the description `desc`
     *
     * @param  {string} name The name of the pipeline, for future reference
     * @param  {Array<string|Object>} desc The pipeline description passed to `build`
     * @returns {Pipeline}      The newly created Pipeline
     */
    static create(name, desc) {
        checkType("Pipeline.create", "name", name, "string");
        let p = new Pipeline(name);
        p.build(desc);
        pipelineMap.set(name, p);
        return p;
    }

    /**
     * Retrieves a pipeline with the matching name
     *
     * @param  {string} name Name of the pipeline to return
     * @returns {Pipeline}      The matching Pipeline or undefined if no matching Pipeline is found
     */
    static get(name) {
        return pipelineMap(name);
    }
}

module.exports = {
    Pipeline,
};
