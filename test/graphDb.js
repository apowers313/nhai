const {assert} = require("chai");
const {GraphDb} = require("../index");
const {redisGraphMockData} = require("./helpers/redisGraphMock");

// NOTE: these tests will run on a real database if 'registerMock("redisgraph.js", ...)' is commented out in ./helpers/preload.js
// NOTE: these tests work, but may require 'dev:docker' to be running to pass since mocks may not exist
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip("GraphDb", function() {
    beforeEach(async function() {
        await GraphDb.init();
    });

    afterEach(async function() {
        await GraphDb.wipe();
        await GraphDb.shutdown();
    });

    it("is a function", function() {
        assert.isFunction(GraphDb);
    });

    describe("query", function() {
        it("runs query", async function() {
            redisGraphMockData({
                resultSet: {
                    hasNext: [false, false, false, true, false],
                    size: [1],
                },
                record: {
                    values: [[{id: 0, label: "person", properties: {name: "roi", age: 32}}]],
                },
            });

            let res;
            res = await GraphDb.query("CREATE (:person{name:'roi',age:32})");
            assert.isArray(res);
            assert.strictEqual(res.length, 0);

            res = await GraphDb.query("CREATE (:person{name:'amit',age:30})");
            assert.isArray(res);
            assert.strictEqual(res.length, 0);

            res = await GraphDb.query("MATCH (a:person), (b:person) WHERE (a.name = 'roi' AND b.name='amit') CREATE (a)-[:knows]->(b)");
            assert.isArray(res);
            assert.strictEqual(res.length, 0);

            res = await GraphDb.query("MATCH (a:person)-[:knows]->(:person) RETURN a");
            // res = [ [ Node { id: 0, label: 'person', properties: [Object] } ] ]
            assert.isArray(res);
            // one match returned
            assert.strictEqual(res.length, 1);
            // one node in the match
            assert.strictEqual(res[0].length, 1);

            // n = { id: 0, label: 'person', properties: {name: "roi", age: 32} }
            let n = res[0][0];
            assert.isNumber(n.id);
            assert.strictEqual(n.label, "person");
            assert.deepEqual(n.properties, {name: "roi", age: 32});
            return GraphDb.wipe();
        });
    });
});
