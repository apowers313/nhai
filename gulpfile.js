/* eslint-disable jsdoc/require-jsdoc */

const {watch, src, dest, series, parallel} = require("gulp");
const mocha = require("gulp-mocha");
const eslint = require("gulp-eslint7");
const jsdoc = require("gulp-jsdoc3");
const nodemon = require("gulp-nodemon");
// const istanbul = require("gulp-istanbul"); // gulp-istanbul is broken; hasn't been updated in 3 years
let {spawn} = require("child_process");
const browserSync = require("browser-sync").create();

const mochaPreload = "test/helpers/preload.js";
const sources = ["src/**/*.js", "lib/**/*.js", "index.js", "main.js"];
const unitTests = ["test/*.js"];
const integrationTests = ["test/integration/test.js"];
const helpers = ["test/helpers/*.js"];
const support = ["gulpfile.js", "package.json", ".eslintrc.js", "docs.json"];
const js = [... sources, ... unitTests, ... helpers];
const css = ["./jsdoc.css"];
const markdown = ["**/*.md"];
const documentation = [... sources, ... markdown, ... css];
const all = [... js, ... support];
const jsDocConfig = require("./.jsdoc-conf.json");
const nodePlop = require("node-plop");

/* ************
 * TESTING
 **************/
function test(testReporter = "spec") {
    return src(unitTests)
        .pipe(mocha({
            file: mochaPreload,
            reporter: testReporter,
            exit: true,
        }));
}

function testQuiet() {
    return test.bind(null, "min")();
}

function watchTest() {
    return watch(all, test.bind(null, "min"));
}

/* ************
 * LINT
 **************/
function lintBasic() {
    return src(js)
        .pipe(eslint({quiet: true}))
        .pipe(eslint.format());
}

function lint() {
    return lintBasic()
        .pipe(eslint.failAfterError());
}

function watchLint() {
    return watch(all, function() {
        return lintBasic();
    });
}

/* ************
 * COVERAGE
 **************/
function runIstanbul(done) {
    let cmd = "nyc";
    let args = [
        "--reporter=text",
        "--reporter=html",
        "--reporter=lcov",
        "mocha",
        "--file",
        mochaPreload,
    ];
    let opts = {
        stdio: "inherit",
    };
    spawn(cmd, args, opts).on("close", done);
}

const coverage = runIstanbul;

function coverageRefresh() {
    return watch(js, runIstanbul);
}

function coverageBrowserSync() {
    browserSync.init({
        server: {
            baseDir: "./coverage",
        },
    });

    watch("coverage/*").on("change", browserSync.reload);
    watch("coverage/*").on("add", browserSync.reload);
}

const watchCoverage = parallel(coverageBrowserSync, coverageRefresh);

/* ************
 * DOCS
 **************/
function docsBuild(done) {
    src(documentation, {read: false})
        .pipe(jsdoc(jsDocConfig, done));
}

const docs = series(docsBuild, copyCss);

function copyCss() {
    return src("jsdoc.css")
        .pipe(dest("./docs"));
}

function docsBrowserSync() {
    browserSync.init({
        server: {
            baseDir: "./docs",
        },
    });

    watch("docs/*").on("change", browserSync.reload);
    watch("docs/*").on("add", browserSync.reload);
}

function docsRefresh() {
    watch(css, copyCss);
    watch(documentation, docsBuild);
}

const watchDocs = parallel(docsBrowserSync, docsRefresh);

/* ************
 * MAIN
 **************/
function watchMain(done) {
    let stream = nodemon({script: "main.js",
        watch: js,
        done: done,
    });

    stream
        .on("restart", function() {
            console.log("Restarting...");
        })
        .on("crash", function() {
            console.error("Application crashed!\n");
            stream.emit("restart", 10); // restart the server in 10 seconds
        });
}

/* ************
 * RELEASE
 **************/
const ready = parallel(test, audit, lint, coverage, docs, integration);

function audit(done) {
    let cmd = "npm";
    let args = [
        "audit",
    ];
    let opts = {
        stdio: "inherit",
    };
    let aud = spawn(cmd, args, opts).on("close", done);
}

/* ************
 * EXPERIMENT
 **************/
async function experiment() {
    return doPlop("experiment");
}

async function experimentSave() {
    return doPlop("archive");
}

async function doPlop(cmd) {
    const plop = nodePlop("./assets/plop/plopfile.js");
    const exp = plop.getGenerator(cmd);
    console.log("exp", exp);
    let answers = await exp.runPrompts();
    let res = await exp.runActions(answers);
    console.log("res", res);
}

/* ************
 * INTEGRATION TESTING
 **************/
async function integration(testReporter = "spec") {
    return src(integrationTests)
        .pipe(mocha({
            reporter: testReporter,
            exit: true,
        }));
}

module.exports = {
    audit,
    test,
    "test:quiet": testQuiet,
    lint,
    coverage,
    docs,
    ready,
    "default": watchTest,
    "dev:test": watchTest,
    "dev:lint": watchLint,
    "dev:coverage": watchCoverage,
    "dev:docs": watchDocs,
    "dev:main": watchMain,
    experiment,
    "exp": experiment,
    "exp:run": experiment,
    "exp:save": experimentSave,
    integration,
};
