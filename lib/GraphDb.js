const {Config} = require("./Config");
const RedisGraph = require("redisgraph.js").Graph;
console.log("RedisGraph", RedisGraph);
let graph = null;

/**
 * Interface to raw Graph Database functionality for queries and node / edge manipulation
 */
class GraphDb {
    /**
     * Raw query to the database
     *
     * @param  {string} queryStr A [Cipher]{@link https://www.opencypher.org/} query string
     * @returns {Object}          The query result. Currently the [RedisGraph ResultSet]{@link https://redisgraph.github.io/redisgraph.js/ResultSet.html} object
     */
    static async query(queryStr) {
        graphCheck("GraphDb.query");
        // XXX: this returns redisgraph's ResultSet object and creates a dependency on their API. Replace with an abstraction?
        return graph.query(queryStr);
    }

    // TODO: addNode
    // TODO: getNode
    // TODO: addEdge
    // TODO: getEdge
    // TODO: batch

    /**
     * Initialize the connection to the Graph Database. Uses {@link Config} values to specify the connection host, port, and options.
     *
     * @returns {Promise} A Promise that resolves when initialization is complete.
     */
    static async init() {
        let dbName = Config.get("graphdb-name");
        let serverName = Config.get("redisgraph-server");
        let serverPort = Config.get("redisgraph-port");
        let serverOptions = Config.get("redisgraph-options");
        let optsStr = serverOptions ? `with options: ${serverOptions}` : "without options";
        console.info(`Connecting to Database '${serverName}:${serverPort}/${dbName}' ${optsStr}`);
        graph = new RedisGraph(dbName, serverName, serverPort, serverOptions);
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
        graphCheck("GraphDb.reset");
        graph.deleteGraph();
        // return GraphDb.shutdown();
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
