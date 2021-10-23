const {TransientObject} = require("./TransientObject");
const {checkType, checkInstance} = require("./Utility");

class Edge extends TransientObject {
    constructor(id, type = "edge") {
        let opts = {
            id,
            props: ["edgeId", "type", "src", "dst", "isEdge"],
        };

        super(opts);

        // if this is a new node, set the ID
        if (this.id) {
            this.edgeId = id;
        }

        this.src = null;
        this.dst = null;
        this.type = type;
        this.isEdge = true;
    }

    // load()
    static fromData(id, type, data, srcNodeId, dstNodeId) {
        checkType("Edge.loadFromRecord", "id", id, "string");
        checkType("Edge.loadFromRecord", "type", type, "string");
        checkType("Edge.loadFromRecord", "data", data, "object");
        checkType("Edge.loadFromRecord", "srcNodeId", srcNodeId, "string");
        checkType("Edge.loadFromRecord", "dstNodeId", dstNodeId, "string");

        /* TODO: check to see if edge already exists */
        // console.log("fromData id", id);
        // console.log("fromData type", type);
        // console.log("fromData data", data);
        // console.log("fromData srcNodeId", srcNodeId);
        // console.log("fromData dstNodeId", dstNodeId);

        let e = new Edge(id, type);
        Object.assign(e.data, data);
        const {Node} = require("./Node");
        let srcNode = new Node(srcNodeId);
        let dstNode = new Node(dstNodeId);
        e.src = srcNode;
        e.dst = dstNode;
        srcNode.srcEdges.push(e);
        dstNode.dstEdges.push(e);
        e.isLoaded = true;
        e.isDirty = false;
        return e;
    }

    // store()
    // delete()
    // free()

    static connect(src, dst) {
        const {Node} = require("./Node");
        checkInstance("Edge.connect", "src", src, Node);
        checkInstance("Edge.connect", "dst", dst, Node);

        let e = new Edge();
        e.src = src;
        e.dst = dst;
        return e;
    }
}

module.exports = {
    Edge,
};
