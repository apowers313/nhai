const {Component} = require("./Component");
const {Pipeline} = require("./Pipeline");

class Context extends Component {
    constructor(name) {
        // TODO: setup events
        super(name);
        Pipeline.get("load");
        Pipeline.get("significance");
    }

    static init() {
        new Context();
    }

    static shutdown() {}
}

module.exports = {
    Context,
};
