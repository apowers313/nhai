const {assert} = require("chai");
const fs = require("fs");
const path = require("path");
const {spawn} = require("child_process");
const tmp = require("tmp");

const jupyterInputPath = path.resolve(__dirname, "integration-test.ipynb");
const expectedResults = readJson(jupyterInputPath);
let testResults;

let testRun = false;
let setupFn;
if (testRun) {
    setupFn = async function() {};
    testResults = expectedResults;
} else {
    setupFn = async function() {
        this.slow(5 * 60 * 1000);
        this.timeout(5 * 60 * 1000);

        // build main nhai docker image
        await spawnAsync("docker build --build-arg JUPYTER_FILE=test/integration/integration-test.ipynb --tag integration-test-base .");
        // build integration testing nhai docker image
        await spawnAsync("docker build --tag integration-test-image test/integration");
        // remove old container to prevent name conflicts
        await spawnAsync("docker container rm integration-test-container");
        // run integration tests
        await spawnAsync("docker run --name integration-test-container integration-test-image supervisord -c /usr/local/etc/supervisord.conf");
        // copy over test results
        let tmpName = tmp.tmpNameSync();
        console.log("tmp name", tmpName);
        await spawnAsync(`docker cp integration-test-container:/home/apowers/integration-output.ipynb ${tmpName}`);
        testResults = readJson(tmpName);
        // fs.rmSync(tmpName);
    };
}

// build integration testing docker image
describe("integration testing", function() {
    before(setupFn);

    describe("expectedResults", function() {
        it("catches stderr", function() {
            assert.isTrue(isStderr(expectedResults.cells[2]));
            assert.isFalse(containsError(expectedResults.cells[2]));
        });

        it("catches error", function() {
            assert.isTrue(containsError(expectedResults.cells[3]));
            assert.isFalse(isStderr(expectedResults.cells[3]));
        });

        it("catches either error2", function() {
            let res = isStderr(expectedResults.cells[4]) || containsError(expectedResults.cells[4]);
            assert.isTrue(res);
        });
    });

    it("has same number of tests", function() {
        console.log("expectedResults.cells.length", expectedResults.cells.length);
        console.log("testResults.cells.length", testResults.cells.length);
        assert.strictEqual(expectedResults.cells.length, testResults.cells.length);
    });

    it("tests cells", async function() {
        expectedResults.cells.forEach((c, i) => cellTest(i));
    });
});

// validate the outputs of the integration test
function cellTest(cellNum) {
    process.stdout.write(`Testing Cell ${cellNum}: `);
    let expectedCell = expectedResults.cells[cellNum];
    let testResultCell = testResults.cells[cellNum];

    if (expectedCell.cell_type !== "code") {
        console.log("Skipped (Not Code).");
        return;
    }

    if (!expectedCell.metadata.tags || expectedCell.metadata.tags.length === 0) {
        throw new Error(`Cell ${cellNum} had no tag`);
    }

    if (expectedCell.metadata.tags.includes("exact")) {
        console.log("Exact Match.");
        assert.deepEqual(expectedCell.outputs, testResultCell.outputs);
    }

    if (expectedCell.metadata.tags.includes("noerror")) {
        console.log("No Error.");
        if (!(isStderr(testResultCell) || containsError(testResultCell))) {
            throw new Error("Expected cell not to contain error:", testResultCell.outputs);
        }
    }

    if (expectedCell.metadata.tags.includes("iserror")) {
        console.log("Is Error.");
        assert.isTrue(isStderr(testResultCell) || containsError(testResultCell));
    }
}

function isStderr(cell) {
    let err = false;

    for (let i = 0; i < cell.outputs.length; i++) {
        if (cell.outputs[i].name === "stderr") {
            err = true;
            break;
        }
    }

    return err;
}

function containsError(cell) {
    let errRegExp = /\berror\b/i;
    let err = false;

    for (let i = 0; i < cell.outputs.length; i++) {
        let cellOutput = cell.outputs[i];
        for (let j = 0; j < cellOutput.text.length; j++) {
            if (cellOutput.text[j].match(errRegExp)) {
                err = true;
                break;
            }
        }

        if (err) {
            break;
        }
    }

    return err;
}

function spawnAsync(str) {
    console.log("RUNNING:", str);
    let args = str.split(" ");
    let cmd = args.shift();

    if (typeof cmd !== "string") {
        throw new Error("expected 'cmd' to be string, got", cmd);
    }

    let opts = {
        stdio: "inherit",
    };

    return new Promise((resolve, reject) => {
        spawn(cmd, args, opts).on("close", (code) => {
            if (code === 0) {
                return resolve(code);
            }

            reject(code);
        });
    });
}

function readJson(file) {
    let contents = fs.readFileSync(file, {encoding: "utf8"});
    return JSON.parse(contents);
}
