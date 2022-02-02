/* eslint-disable jsdoc/require-jsdoc */
import {dest, parallel, series, src, watch} from "gulp";
import {spawn} from "child_process";

const eslint = require("gulp-eslint7");
// const jsdoc = require("gulp-jsdoc3");
// const nodemon = require("gulp-nodemon");
// // const istanbul = require("gulp-istanbul"); // gulp-istanbul is broken; hasn't been updated in 3 years
const browserSync = require("browser-sync").create();
// const print = require("gulp-print").default;

// const mochaPreload = "test/helpers/preload.js";
// const sources = ["src/**/*.ts", "lib/**/*.ts", "mod.ts", "main.ts"];
// const unitTests = ["test/*.test.ts"];
// const integrationTests = ["test/integration/test.js"];
// const helpers = ["test/helpers/*.ts", "test/helpers/*.js"];
const support = ["gulpfile.ts", "package.json", ".eslintrc.json", "docs.json"];
// const ts = [... sources, ... unitTests, ... helpers];
const files = require("./tsconfig.json").include;
const sources = files.filter((s) => !/test\.ts$/.test(s));
// const unitTests = files.filter((s) => /test\.ts$/.test(s));
const ts = sources;
const markdown = ["**/*.md"];
const documentation = [... sources, ... markdown];
const all = [... ts, ... support];
// const nodePlop = require("node-plop");

/* ************
 * TESTING
 **************/
interface MochaOpts {
    file?: string,
    reporter?: string,
    exit?: boolean
}

function mocha(opts: MochaOpts, done: () => void) {
    const cmd = "mocha";
    const reporter = opts.reporter ?? "spec";
    const args = [
        "--reporter",
        reporter,
    ];
    spawn(cmd, args, {stdio: "inherit"}).on("close", done);
}

exports.test = function(done: () => void) {
    mocha({}, done);
};

exports["test:quiet"] = function(done: () => void) {
    mocha({
        reporter: "min",
    }, done);
};

exports["dev:test"] = function() {
    return watch(all, (done: () => void) => {
        mocha({
            reporter: "min",
        }, done);
    });
};

/* ************
 * LINT
 **************/
function esl() {
    return src(ts)
        .pipe(eslint({quiet: true}))
        .pipe(eslint.format());
}

exports.lint = function() {
    return esl()
        .pipe(eslint.failAfterError());
};

exports["dev:lint"] = function() {
    return watch(all, function() {
        return esl();
    });
};

/* ************
 * COVERAGE
 **************/
function istanbul(done: () => void) {
    const cmd = "nyc";
    const args = [
        "--reporter=text",
        "--reporter=html",
        "--reporter=lcov",
        "ts-mocha",
    ];
    spawn(cmd, args, {stdio: "inherit"}).on("close", done);
}

exports.coverage = function(done: () => void) {
    istanbul(done);
};

function watchCoverage() {
    return watch(ts, (done) => {
        istanbul(done);
    });
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

exports["dev:coverage"] = parallel(coverageBrowserSync, watchCoverage);

/* ************
 * DOCS
 **************/
function typedoc(done: () => void) {
    const cmd = "typedoc";
    const args = [];
    spawn(cmd, args, {stdio: "inherit"}).on("close", done);
}
exports.docs = typedoc;

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
    watch(documentation, typedoc);
}

exports["dev:docs"] = parallel(docsBrowserSync, docsRefresh);

// const watchDocs = parallel(docsBrowserSync, docsRefresh);

/* ************
 * MAIN
 **************/
// function watchMain(done) {
//     let stream = nodemon({script: "main.js",
//         watch: js,
//         done: done,
//     });

//     stream
//         .on("restart", function() {
//             console.log("Restarting...");
//         })
//         .on("crash", function() {
//             console.error("Application crashed!\n");
//             stream.emit("restart", 10); // restart the server in 10 seconds
//         });
// }

/* ************
 * PUSH
 **************/
// export const ready = parallel(audit, lint, test, coverage, docs, integration);

// function audit(done) {
//     let cmd = "npm";
//     let args = [
//         "audit",
//         "--only=prod",
//         "--audit-level=high",
//     ];
//     let opts = {
//         stdio: "inherit",
//     };
//     let aud = spawn(cmd, args, opts).on("close", done);
// }

/* ************
 * EXPERIMENT
 **************/
// async function experiment() {
//     return doPlop("experiment");
// }

// async function experimentSave() {
//     return doPlop("archive");
// }

// async function doPlop(cmd) {
//     const plop = nodePlop("./assets/plop/plopfile.js");
//     const exp = plop.getGenerator(cmd);
//     console.log("exp", exp);
//     let answers = await exp.runPrompts();
//     let res = await exp.runActions(answers);
//     console.log("res", res);
// }

/* ************
 * INTEGRATION TESTING
 **************/
// async function integration(testReporter = "spec") {
//     return src(integrationTests)
//         .pipe(mocha({
//             reporter: testReporter,
//             exit: true,
//         }));
// }

/* ************
 * DEV DOCKER
 **************/
// async function devDocker() {
//     return doPlop("dev-docker");
// }

// module.exports = {
//     audit,
//     coverage,
//     docs,
//     ready,
//     "default": watchTest,
//     "dev:test": watchTest,
//     "dev:coverage": watchCoverage,
//     "dev:docs": watchDocs,
//     "dev:main": watchMain,
//     "dev:docker": devDocker,
//     experiment,
//     "exp": experiment,
//     "exp:run": experiment,
//     "exp:save": experimentSave,
//     integration,
// };
