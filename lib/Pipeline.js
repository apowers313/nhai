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

    async run(input) {
        return this.firstStage.run(input);
    }

    build(desc) {
        this.firstStage = Pipeline.build(desc);
    }

    toString() {}

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

    static create(name, desc) {
        checkType("Pipeline.create", "name", name, "string");
        let p = new Pipeline(name);
        p.build(desc);
        pipelineMap.set(name, p);
        return p;
    }

    static get(name) {
        return pipelineMap(name);
    }
}

module.exports = {
    Pipeline,
};
