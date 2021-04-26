const {assert} = require("chai");
const {GraphDb} = require("../index");
const {redisGraphMockData} = require("./helpers/redisGraphMock");

describe("GraphDb", function() {
    beforeEach(async function() {
        await GraphDb.init();
    });

    afterEach(async function() {
        await GraphDb.shutdown();
    });

    it("is a function", function() {
        assert.isFunction(GraphDb);
    });

    describe("query", function() {
        it("runs query", async function() {
            redisGraphMockData({
                resultSet: {
                    hasNext: [true, false],
                    size: [1],
                },
                record: {
                    get: ["roi"],
                },
            });
            await GraphDb.query("CREATE (:person{name:'roi',age:32})");
            await GraphDb.query("CREATE (:person{name:'amit',age:30})");
            await GraphDb.query("MATCH (a:person), (b:person) WHERE (a.name = 'roi' AND b.name='amit') CREATE (a)-[:knows]->(b)");
            let res = await GraphDb.query("MATCH (a:person)-[:knows]->(:person) RETURN a.name");
            assert.strictEqual(res.size(), 1);
            assert.isTrue(res.hasNext());
            let record = res.next();
            assert.strictEqual(record.get("a.name"), "roi");
            assert.isFalse(res.hasNext());
            return GraphDb.wipe();
        });

        // it.only("foo", async function() {
        //     await GraphDb.query("CREATE (:person{name:'roi',age:32})");
        //     await GraphDb.query("CREATE (:person{name:'amit',age:30})");
        //     await GraphDb.query("MATCH (a:person), (b:person) WHERE (a.name = 'roi' AND b.name='amit') CREATE (a)<-[:knows]-(b)");
        //     let res = await GraphDb.query("MATCH (:person)-[:knows]->(a:person) RETURN a");
        //     assert.isTrue(res.hasNext());
        //     let record = res.next();
        //     console.log(record.get("a"));
        //     return GraphDb.wipe();
        // });
    });
});
