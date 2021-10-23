const {Config} = require("./Config");
const Log = require("./Log");
const RedisGraph = require("redisgraph.js").Graph;
console.log("RedisGraph", RedisGraph);
let graph = null;

let info;
let trace;

/**
 * Interface to raw Graph Database functionality for queries and node / edge manipulation
 */
class GraphDb {
    /**
     * Raw query to the database
     *
     * @param {string} queryStr A [Cipher]{@link https://www.opencypher.org/} query string
     * @param params
     * @returns {Object}          The query result. Currently the [RedisGraph ResultSet]{@link https://redisgraph.github.io/redisgraph.js/ResultSet.html} object
     */
    static async query(queryStr, params) {
        graphCheck("GraphDb.query");

        // convert redisgraph results to an array of matches
        let ret = [];
        trace("GraphDb.query:", queryStr);
        trace("GraphDb.query params:", params);
        let res = await graph.query(queryStr, params);
        while (res.hasNext()) {
            let record = res.next();
            ret.push(record.values());
        }

        trace("GraphDb.query result:", JSON.stringify(ret, null, 4));
        return ret;
    }

    /**
     * Initialize the connection to the Graph Database. Uses {@link Config} values to specify the connection host, port, and options.
     *
     * @returns {Promise} A Promise that resolves when initialization is complete.
     */
    static async init() {
        if (graph) {
            return graph;
        }

        ({trace, info} = new Log("graphdb"));
        let dbName = Config.get("graphdb-name");
        let serverName = Config.get("redisgraph-server");
        let serverPort = Config.get("redisgraph-port");
        let serverOptions = Config.get("redisgraph-options");
        let optsStr = serverOptions ? `with options: ${serverOptions}` : "without options";
        info(`Connecting to Database '${serverName}:${serverPort}/${dbName}' ${optsStr}`);
        graph = new RedisGraph(dbName, serverName, serverPort, serverOptions);

        return graph;
    }

    /**
     * Shutdown the connection to the Graph Database
     *
     * @returns {Promise} A Promise that resolves when shutdown is complete.
     */
    static async shutdown() {
        graphCheck("GraphDb.shutdown");
        let ret = graph.close();
        graph = null;
        return ret;
    }

    /**
     * Resets the Graph Database, destroying all data. Primarily used for testing.
     *
     * @returns {Promise} A Promise that resolves when all data has been deleted.
     */
    static async wipe() {
        graphCheck("GraphDb.wipe");
        try {
            await graph.deleteGraph();
        } catch (e) {
            // check to see if it was already wiped
            // maybe there's a better way of doing this? like a query to see if the graph exists?
            if (e.message === "ERR Invalid graph operation on empty key") {
                return;
            }

            throw e;
        }
    }

    /**
     * The underlying graph object. Used for testing and should not be used programmatically since this Object may change.
     *
     * @returns {Object} The graph database interface object. Please don't use this.
     */
    static get graph() {
        graphCheck("GraphDb.graph");
        return graph;
    }
}

// class GraphNode {
//     // TODO: getNeighbors
// }

// class GraphEdge {

// }

function graphCheck(fnName) {
    if (!graph) {
        throw new Error(`${fnName}: database not connected`);
    }
}

module.exports = {
    GraphDb,
    // GraphNode,
    // GraphEdge,
};
