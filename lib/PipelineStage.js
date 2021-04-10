const {checkType, checkInstance} = require("./Utility");

const converterMap = new Map();
const stageMap = new Map();

class PipelineStage {
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

    static register(name, c, force = false) {
        checkType("PipelineStage.register", "name", name, "string");
        checkType("PipelineStage.register", "c", c, "function");
        let fn = stageMap.get(name);
        if (fn && !force) {
            throw new Error(`PipelineStage.register: '${name}' already registered`);
        }

        stageMap.set(name, c);
    }

    static create(name, opts) {
        checkType("PipelineStage.create", "name", name, "string");
        let c = stageMap.get(name);
        if (!c) {
            throw new Error(`PipelineStage.create: '${name}' not found`);
        }

        return new c(name, opts);
    }

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

    static clearConverters() {
        converterMap.clear();
    }

    static clearAll() {
        stageMap.clear();
    }
}

module.exports = {
    PipelineStage,
};
