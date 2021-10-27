const {Node, Edge, GraphDb, Log, TransientObject} = require("..");
const {assert} = require("chai");
const {redisGraphMockData} = require("./helpers/redisGraphMock");

describe("Node", function() {
    before(async function() {
        await Log.init();
    });

    afterEach(function() {
        TransientObject.cache.clear();
    });

    it("is Function", function() {
        assert.isFunction(Node);
    });

    it("sets type", function() {
        let n = new Node();
        assert.deepEqual(n.types, ["node"]);
    });

    describe("constructor", function() {
        it("creates new if no ID specified", function() {
            let n = new Node();
            assert.isString(n.id);
            assert.strictEqual(n.id, n.data.nodeId);
        });

        it("creates existing if ID specified", function() {
            let nodeId = "09014b80-dff4-4f6e-a83a-0219bfb7c4ad";
            let n = new Node(nodeId);
            assert.strictEqual(n.id, nodeId);
            assert.deepEqual(n.toString(), "{}");
        });

        it("new is dirty");
        it("new is loaded");
        it("existing is not dirty");
        it("existing is not loaded");
    });

    describe("load", function() {
        beforeEach(async function() {
            await GraphDb.init();
        });

        afterEach(async function() {
            await GraphDb.wipe();
            await GraphDb.shutdown();
        });

        it("not required when no ID provided", async function() {
            let n = new Node();
            assert.isTrue(n.isLoaded);
            await n.load();
            assert.isTrue(n.isLoaded);
        });

        it("hits DB if ID provided", async function() {
            redisGraphMockData({
                resultSet: {
                    hasNext: [false, true, false],
                    size: [1],
                },
                record: {
                    values: [[{id: 0, label: "node", properties: []}]],
                },
            });

            // setup
            let nodeId = "09014b80-dff4-4f6e-a83a-0219bfb7c4ad";
            await GraphDb.query(`CREATE (   :node:foo:bar {nodeId:'${nodeId}'})`);
            let n = new Node(nodeId);
            assert.isFalse(n.isLoaded);

            // load
            await n.load();
            assert.isTrue(n.isLoaded);
        });

        it("loads edges", async function() {
            // setup
            let nodeId1 = "11111111-1111-1111-1111-111111111111";
            let nodeId2 = "22222222-2222-2222-2222-222222222222";
            let nodeId3 = "33333333-3333-3333-3333-333333333333";
            let nodeId4 = "44444444-4444-4444-4444-444444444444";
            let edgeId1 = "eeeeeeee-1111-1111-1111-eeeeeeeeeeee";
            let edgeId2 = "eeeeeeee-2222-2222-2222-eeeeeeeeeeee";
            let edgeId3 = "eeeeeeee-3333-3333-3333-eeeeeeeeeeee";
            let edgeId4 = "eeeeeeee-4444-4444-4444-eeeeeeeeeeee";
            await GraphDb.query(`CREATE (:node{nodeId:'${nodeId1}'})`);
            await GraphDb.query(`CREATE (:node{nodeId:'${nodeId2}'})`);
            await GraphDb.query(`CREATE (:node{nodeId:'${nodeId3}'})`);
            await GraphDb.query(`CREATE (:node{nodeId:'${nodeId4}'})`);
            // 1 -> 2
            await GraphDb.query(`MATCH (one:node), (two:node) WHERE (one.nodeId = '${nodeId1}' AND two.nodeId='${nodeId2}') CREATE (one)-[:link {edgeId:'${edgeId1}'}]->(two)`);
            // 1 <- 3
            await GraphDb.query(`MATCH (one:node), (three:node) WHERE (one.nodeId = '${nodeId1}' AND three.nodeId='${nodeId3}') CREATE (one)<-[:link {edgeId:'${edgeId2}'}]-(three)`);
            // 1 <-> 4
            await GraphDb.query(`MATCH (one:node), (four:node) WHERE (one.nodeId = '${nodeId1}' AND four.nodeId='${nodeId4}') CREATE (one)-[:link {edgeId:'${edgeId3}'}]->(four)`);
            await GraphDb.query(`MATCH (one:node), (four:node) WHERE (one.nodeId = '${nodeId1}' AND four.nodeId='${nodeId4}') CREATE (one)<-[:link {edgeId:'${edgeId4}'}]-(four)`);
            await GraphDb.query("MATCH (src)-[lnk]->(dst) RETURN src,lnk,dst");
            await GraphDb.query(`MATCH (src)-[lnk]-(dst) WHERE src.nodeId = '${nodeId1}' RETURN src,lnk,dst`);

            // test
            let n = new Node(nodeId1);
            assert.strictEqual(n.srcEdges.length, 0);
            assert.strictEqual(n.dstEdges.length, 0);
            assert.isFalse(n.isLoaded);
            await n.load();
            assert.isTrue(n.isLoaded);
            assert.strictEqual(n.srcEdges.length, 2);
            assert.strictEqual(n.dstEdges.length, 2);
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

        it("stores new node", async function() {
            let n = new Node();
            n.foo = "bar";

            // before
            let match = await GraphDb.query(`MATCH (n:node {nodeId:'${n.id}'}) RETURN n`);
            assert.isArray(match);
            assert.strictEqual(match.length, 0);

            // store
            let ret = await n.store();
            // assert.isArray(ret);
            // assert.strictEqual(ret.length, 1);
            // assert.isArray(ret[0]);
            // assert.strictEqual(ret[0].length, 1);
            // assert.isNumber(ret[0][0]);

            // after
            match = await GraphDb.query(`MATCH (n:node {nodeId:'${n.id}'}) RETURN n`);
            assert.isArray(match);
            assert.strictEqual(match.length, 1);
            let record = match[0];
            assert.isArray(record);
            assert.strictEqual(record.length, 1);
            assert.strictEqual(record[0].properties.nodeId, n.id);
            assert.strictEqual(record[0].properties.foo, "bar");
            assert.isNumber(n._dbId);
        });

        it("updates existing node");

        // it("stores nodes", function() {
        //     throw new Error("not implemented");
        // });
    });

    describe("get", function() {
        it("returns same node", function() {
            let n = new Node();
            let n2 = Node.get(n);
            assert.strictEqual(n, n2);
        });

        it("returns same as ID", function() {
            let n = new Node();
            let n2 = Node.get(n.id);
            assert.strictEqual(n, n2);
        });
    });

    describe("connectTo", function() {
        it("creates edge based on ID", function() {
            let n = new Node();
            let dst = new Node();
            let e = n.connectTo(dst.id);
            assert.instanceOf(e, Edge);
            assert.strictEqual(e.src, n);
            assert.strictEqual(e.dst, dst);
            assert.strictEqual(n.srcEdges[0], e);
        });

        it("creates edge based on Node", function() {
            let n = new Node();
            let dst = new Node();
            let e = n.connectTo(dst);
            assert.instanceOf(e, Edge);
            assert.strictEqual(e.src, n);
            assert.strictEqual(e.dst, dst);
            assert.strictEqual(n.srcEdges[0], e);
        });

        it("sets edge type", function() {
            let n = new Node();
            let src = new Node();
            let e = n.connectTo(src, "foo");
            assert.instanceOf(e, Edge);
            assert.deepEqual(e.types, ["foo"]);
        });

        it("throws if not node or id string", function() {
            let n = new Node();
            assert.throws(() => {
                n.connectTo(3);
            }, TypeError, "Node.get expected 'n' to be a string, got: 3");
        });
    });

    describe("connectFrom", function() {
        it("creates edge based on ID", function() {
            let n = new Node();
            let src = new Node();
            let e = n.connectFrom(src.id);
            assert.instanceOf(e, Edge);
            assert.strictEqual(e.dst, n);
            assert.strictEqual(e.src, src);
            assert.strictEqual(n.dstEdges[0], e);
        });

        it("creates edge based on Node", function() {
            let n = new Node();
            let src = new Node();
            let e = n.connectFrom(src);
            assert.instanceOf(e, Edge);
            assert.strictEqual(e.dst, n);
            assert.strictEqual(e.src, src);
            assert.strictEqual(n.dstEdges[0], e);
        });

        it("sets edge type", function() {
            let n = new Node();
            let src = new Node();
            let e = n.connectFrom(src, "foo");
            assert.instanceOf(e, Edge);
            assert.deepEqual(e.types, ["foo"]);
        });

        it("throws if not node or id string", function() {
            let n = new Node();
            assert.throws(() => {
                n.connectFrom(3);
            }, TypeError, "Node.get expected 'n' to be a string, got: 3");
        });
    });

    describe("create", function() {
        it("creates node");
    });

    describe("cache", function() {
        it("loads existing object");
    });
});
