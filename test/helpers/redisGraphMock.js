/* eslint-disable jsdoc/require-jsdoc */

// XXX: this mock is loaded in ./preload.js

let mockData;
const debug = false;
let log;
if (debug) {
    ({log} = console);
} else {
    log = () => {};
}

function redisGraphMockData(data = {}) {
    // setup mock data
    mockData = {
        graph: {
            // query: data.graph?.query ?? [],
        },
        resultSet: {
            // next: data.resultSet?.next ?? [],
            hasNext: data.resultSet?.hasNext ?? [],
            size: data.resultSet?.size ?? [],
        },
        record: {
            get: data.record?.get ?? [],
            values: data.record?.values ?? [],
        },
    };

    // setup spies
}

class RedisGraphMock {
    constructor() {
        log("RedisGraphMock: constructor");
    }

    async query(... args) {
        log("RedisGraphMock: query:", args);
        // let ret = mockData.graph?.query.shift();
        // log("RedisGraphMock: query result:", ret);
        // return ret;
        return new ResultSetMock();
    }

    deleteGraph() {
        log("RedisGraphMock: deleteGraph");
    }

    close() {
        log("RedisGraphMock: close");
    }
}

class ResultSetMock {
    constructor() {
        log("ResultSetMock: constructor");
    }

    hasNext() {
        log("ResultSetMock: hasNext");
        let ret = mockData.resultSet.hasNext.shift();
        log("ResultSetMock: hasNext result:", ret);
        return ret;
    }

    size() {
        log("ResultSetMock: size");
        let ret = mockData.resultSet.size.shift();
        log("ResultSetMock: size result:", ret);
        return ret;
    }

    next() {
        log("ResultSetMock: next");
        // mockData.resultSet.hasNext--;
        // return mockData.resultSet?.next.shift();
        return new RecordMock();
    }
}

class RecordMock {
    constructor() {
        log("RecordMock: constructor");
    }

    next() {
        log("RecordMock: next");
        return this;
    }

    get(... args) {
        log("RecordMock: get:", args);
        let ret = mockData.record?.get.shift();
        log("RecordMock: get result:", ret);
        return ret;
    }

    values(... args) {
        log("RecordMock: values:", args);
        let ret = mockData.record?.values.shift();
        log("RecordMock: values result:", ret);
        return ret;
    }
}

module.exports = {
    redisGraphMockData,
    // spies: {
    //     querySpy,
    //     hasNextSpy,
    //     nextSpy,
    //     getSpy,
    // },
    Graph: RedisGraphMock,
    ResultSet: ResultSetMock,
    Record: RecordMock,
};
