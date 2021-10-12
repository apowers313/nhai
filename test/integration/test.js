const {assert} = require("chai");
const fs = require("fs");
const path = require("path");
const {spawn} = require("child_process");
const tmp = require("tmp");

const jupyterInputPath = path.resolve(__dirname, "integration-test.ipynb");
const expectedResults = readJson(jupyterInputPath);
let testResults;
console.log("CWD", process.cwd());

// validate the outputs of the integration test
describe("integration testing", function() {
    before(async function() {
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
        fs.rmSync(tmpName);
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

function cellTest(cellNum) {
    process.stdout.write(`Testing Cell ${cellNum}: `);
    let expectedCell = expectedResults.cells[cellNum];
    let testResultCell = testResults.cells[cellNum];

    if (expectedCell.cell_type !== "code") {
        console.log("Skipped (Not Code).");
        return;
    }

    if (expectedCell.metadata.tags.includes("exact")) {
        console.log("Exact Match.");
        assert.deepEqual(expectedCell.outputs, testResultCell.outputs);
    }

    if (expectedCell.metadata.tags.includes("noerror")) {
        console.log("No Error.");
        // TODO: look for error
    }
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
