const {TransientObject} = require("./TransientObject");
const {GraphDb} = require("./GraphDb");
const {checkType, checkInstance} = require("./Utility");

class Edge extends TransientObject {
    constructor(id, type) {
        let opts = {
            id,
            props: ["edgeId", "src", "dst", "isEdge"],
        };

        super(opts);

        if (this.isCached) {
            return this;
        }

        this.addType(type || "edge");

        // if this is a new node, set the ID
        if (this.id) {
            this.edgeId = id;
        }

        this.src = null;
        this.dst = null;
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

    addType(type) {
        this.types = [type];
    }

    async store() {
        return GraphDb.query(`MERGE (e${this.cypherTypes()} {edgeId: $eid}) SET e = ${this.toCypherMap()} RETURN id(e)`, {eid: this.id});
    }

    async delete() {}

    async free() {}

    static connect(src, dst, type) {
        const {Node} = require("./Node");
        checkInstance("Edge.connect", "src", src, Node);
        checkInstance("Edge.connect", "dst", dst, Node);

        let e = new Edge();
        e.src = src;
        e.dst = dst;
        src.srcEdges.push(e);
        dst.dstEdges.push(e);

        if (type) {
            e.addType(type);
        }

        return e;
    }
}

module.exports = {
    Edge,
};
