const {TransientObject} = require("./TransientObject");
const {checkType, checkInstance} = require("./Utility");
const {GraphDb} = require("./GraphDb");

class Node extends TransientObject {
    constructor(id) {
        let opts = {
            id,
            props: ["srcEdges", "dstEdges", "_dbId", "isNode"],
        };

        super(opts);

        if (this.isCached) {
            return this;
        }

        this.addType("node");

        // if this is a new node, set the ID
        if (this.isLoaded) {
            this.nodeId = this.id;
        }

        this.srcEdges = [];
        this.dstEdges = [];
        this.isNode = true;
    }

    async load() {
        if (this.isLoaded) {
            return;
        }

        // query DB
        let res = await GraphDb.query(`MATCH (n${this.cypherTypes()} {nodeId: $nid}) OPTIONAL MATCH (n)-[lnk]-(neighbor) RETURN n,lnk,neighbor`, {nid: this.id});
        // console.log("load() result:", res);
        this.isLoaded = true;
        // res looks like:
        // [ [thisNode, link1, neighbor1], [thisNode, link2, neighbor2], ... ]
        // if there are no neighbors, it looks like:
        // [ [thisNode, null, null] ]
        let thisNode = res[0][0];
        let edgeList = res[0][1] ? res.map((r) => r[1]) : [];
        let neighborList = res[0][2] ? res.map((r) => r[2]) : [];

        if (!thisNode) {
            throw new Error(`Couldn't load() node: ${this.id}`);
        }

        // load node data
        this._dbId = thisNode.id;
        console.log("thisNode.types", thisNode.label);
        this.types = thisNode.label.split(":");
        Object.assign(this.data, thisNode.properties);

        // translate database IDs to UUIDs
        let nodeIdXlat = new Map();
        nodeIdXlat.set(thisNode.id, thisNode.properties.nodeId);
        neighborList.forEach((n) => nodeIdXlat.set(n.id, n.properties.nodeId));

        // get edges
        const {Edge} = require("./Edge");
        edgeList.forEach((eData) => Edge.fromData(
            eData.properties.edgeId,
            eData.relation,
            eData.properties,
            nodeIdXlat.get(eData.srcNode),
            nodeIdXlat.get(eData.destNode)));

        // housekeeping
        await super.load();
    }

    setValidator(prop, value) {
        if (typeof value === "object") {
            throw new Error(`Cannot set '${prop}' to '${value}': Cypher Maps cannot contain Objects`);
        }
    }

    async store() {
        // write to DB
        let storeNodeSaveId = async() => {
            let ret = await GraphDb.query(`MERGE (n${this.cypherTypes()} {nodeId: $nid}) SET n = ${this.toCypherMap()} RETURN id(n)`, {nid: this.id});
            this._dbId = ret[0][0];
        };

        let promiseList = [storeNodeSaveId()];
        promiseList = promiseList.concat(
            this.srcEdges.map((e) => e.store()),
        );
        promiseList = promiseList.concat(
            this.dstEdges.map((e) => e.store()),
        );

        return Promise.all(promiseList);
    }

    async delete() {}

    connectTo(dst, type) {
        const {Edge} = require("./Edge");
        dst = Node.get(dst);
        return Edge.connect(this, dst, type);
    }

    connectFrom(src, type) {
        const {Edge} = require("./Edge");
        src = Node.get(src);
        return Edge.connect(src, this, type);
    }

    static get(n) {
        if (typeof n !== "object") {
            checkType("Node.get", "n", n, "string");
            return new Node(n);
        }

        checkInstance("Node.get", "n", n, Node);
        return n;
    }
}

module.exports = {
    Node,
};
