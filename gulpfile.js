/* eslint-disable jsdoc/require-jsdoc */

const {watch, src, dest, series, parallel} = require("gulp");
const mocha = require("gulp-mocha");
const eslint = require("gulp-eslint");
const jsdoc = require("gulp-jsdoc3");
// const istanbul = require("gulp-istanbul"); // gulp-istanbul is broken; hasn't been updated in 3 years
// const exec = require("gulp-exec");
let {exec, spawn} = require("child_process");
const browserSync = require("browser-sync").create();

const sources = ["src/*.js", "lib/*.js"];
const tests = ["test/*.js"];
const support = ["gulpfile.js", "package.json", ".eslintrc.js", "docs.json"];
const js = [... sources, ... tests];
const css = ["./jsdoc.css"];
const markdown = ["**/*.md"];
const documentation = [... sources, ... markdown, ... css];
const all = [... sources, ... tests, ... support];
const jsDocConfig = require("./.jsdoc-conf.json");

/* ************
 * TESTING
 **************/
function test(testReporter = "spec") {
    return src(tests)
        .pipe(mocha({reporter: testReporter}))
        .on("error", function(err) {
            console.log(err.stack);
        });
}

function watchTest() {
    return watch(all, test.bind(null, "min"));
}

/* ************
 * LINT
 **************/
function lint() {
    return src(js)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function watchLint() {
    return watch(all, function() {
        return src(js)
            .pipe(eslint())
            .pipe(eslint.format());
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
        "mocha",
    ];
    let opts = {
        stdio: "inherit",
    };
    spawn(cmd, args, opts);
    done();
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

module.exports = {
    test,
    lint,
    coverage,
    docs,
    "default": watchTest,
    "dev:test": watchTest,
    "dev:lint": watchLint,
    "dev:coverage": watchCoverage,
    "dev:docs": watchDocs,
};
