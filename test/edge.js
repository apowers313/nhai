const {Edge, Node, Log, GraphDb, TransientObject} = require("..");
const {assert} = require("chai");

// NOTE: these tests work, but may require 'dev:docker' to be running to pass since mocks may not exist
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip("Edge", function() {
    before(async function() {
        await Log.init();
        Log.setStdoutLevel("error");
    });

    afterEach(function() {
        TransientObject.cache.clear();
    });

    it("is Function", function() {
        assert.isFunction(Edge);
    });

    describe("fromData", function() {
        it("creates edge", function() {
            let nodeId1 = "11111111-1111-1111-1111-111111111111";
            let nodeId2 = "22222222-2222-2222-2222-222222222222";
            let edgeId1 = "eeeeeeee-1111-1111-1111-eeeeeeeeeeee";
            let e = Edge.fromData(edgeId1, "foo", {beer: "yum"}, nodeId1, nodeId2);

            // id is correct
            assert.strictEqual(e.id, edgeId1);

            // type is correct
            assert.strictEqual(e.types.length, 1);
            assert.strictEqual(e.types[0], "foo");

            // data is correct
            assert.deepEqual(e.data, {beer: "yum"});

            // source node was created correctly
            let srcNode = e.src;
            assert.strictEqual(srcNode.id, nodeId1);
            assert.strictEqual(srcNode.srcEdges.length, 1);
            assert.strictEqual(srcNode.srcEdges[0], e);
            assert.strictEqual(srcNode.dstEdges.length, 0);

            // destination node was created correctly
            let dstNode = e.dst;
            assert.strictEqual(dstNode.id, nodeId2);
            assert.strictEqual(dstNode.dstEdges.length, 1);
            assert.strictEqual(dstNode.dstEdges[0], e);
            assert.strictEqual(dstNode.srcEdges.length, 0);
        });

        it("reuses nodes", function() {
            let nodeId1 = "11111111-1111-1111-1111-111111111111";
            let nodeId2 = "22222222-2222-2222-2222-222222222222";
            let nodeId3 = "33333333-3333-3333-3333-333333333333";
            let edgeId1 = "eeeeeeee-1111-1111-1111-eeeeeeeeeeee";
            let edgeId2 = "eeeeeeee-2222-2222-2222-eeeeeeeeeeee";
            let e1 = Edge.fromData(edgeId1, "foo", {beer: "yum"}, nodeId1, nodeId2);
            let e2 = Edge.fromData(edgeId2, "bar", {wine: "fun"}, nodeId1, nodeId3);

            // Edge 1 & 2 have the exact same source node object
            assert.strictEqual(e1.src, e2.src);

            /** * Edge 1 ***/
            // id is correct
            assert.strictEqual(e1.id, edgeId1);

            // type is correct
            assert.strictEqual(e1.types.length, 1);
            assert.strictEqual(e1.types[0], "foo");

            // data is correct
            assert.deepEqual(e1.data, {beer: "yum"});

            // source node was created correctly
            let srcNode = e1.src;
            assert.strictEqual(srcNode.id, nodeId1);
            console.log("srcNode.srcEdges", srcNode.srcEdges);
            assert.strictEqual(srcNode.srcEdges.length, 2);
            assert.strictEqual(srcNode.srcEdges[0], e1);
            assert.strictEqual(srcNode.dstEdges.length, 0);

            // destination node was created correctly
            let dstNode = e1.dst;
            assert.strictEqual(dstNode.id, nodeId2);
            assert.strictEqual(dstNode.dstEdges.length, 1);
            assert.strictEqual(dstNode.dstEdges[0], e1);
            assert.strictEqual(dstNode.srcEdges.length, 0);

            /** * Edge 2 ***/
            // id is correct
            assert.strictEqual(e2.id, edgeId2);

            // type is correct
            assert.strictEqual(e2.types.length, 1);
            assert.strictEqual(e2.types[0], "bar");

            // data is correct
            assert.deepEqual(e2.data, {wine: "fun"});

            // source node was created correctly
            srcNode = e2.src;
            assert.strictEqual(srcNode.id, nodeId1);
            assert.strictEqual(srcNode.srcEdges.length, 2);
            assert.strictEqual(srcNode.srcEdges[1], e2);
            assert.strictEqual(srcNode.dstEdges.length, 0);

            // destination node was created correctly
            dstNode = e2.dst;
            assert.strictEqual(dstNode.id, nodeId3);
            assert.strictEqual(dstNode.dstEdges.length, 1);
            assert.strictEqual(dstNode.dstEdges[0], e2);
            assert.strictEqual(dstNode.srcEdges.length, 0);
        });

        it("doesn't overwrite cached object");
    });

    describe("connect", function() {
        it("connects two nodes", function() {
            let src = new Node();
            let dst = new Node();
            let e = Edge.connect(src, dst);
            assert.isArray(e.types);
            assert.strictEqual(e.types.length, 1);
            assert.strictEqual(e.types[0], "edge");
            assert.strictEqual(e.src, src);
            assert.strictEqual(e.dst, dst);
            assert.strictEqual(src.srcEdges.length, 1);
            assert.strictEqual(src.srcEdges[0], e);
            assert.strictEqual(dst.dstEdges.length, 1);
            assert.strictEqual(dst.dstEdges[0], e);
        });
    });

    describe("store", function() {
        beforeEach(async function() {
            await GraphDb.init();
        });

        afterEach(async function() {
            await GraphDb.wipe();
            await GraphDb.shutdown();
        });

        it("writes edge to db", async function() {
            let e = new Edge();
            console.log("e.id", e.id);
            await e.store();
            // let match = await GraphDb.query(`MATCH (src)-[e:edge {edgeId: '${e.id}'}]-(dst) RETURN src,e,dst`);
            let match = await GraphDb.query("MATCH (src)-[e]-(dst) RETURN src,e,dst");
            console.log("match", match);
        });

        it("writes type to db");
        it("writes data to db");
    });
});
