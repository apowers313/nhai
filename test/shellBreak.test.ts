const {assert} = require("chai");

const {testMagic, getMagic} = require("./helpers/jupyterTest.js");
const {Breakpoint} = require("..");

describe("%break", function() {
    afterEach(function() {
        Breakpoint.clearAll();
    });

    it("exists", function() {
        let breakObj = getMagic("%break");
        assert.isObject(breakObj);
    });

    it("%bk exists", function() {
        let breakObj = getMagic("%bk");
        assert.isObject(breakObj);
    });

    it("no args is shorthand for help");

    it("unknown command throws", async function() {
        await testMagic(
            // magic command
            "%break foo\n",
            // return value
            undefined,
            // stdout
            [],
            // stderr
            ["error: unknown command 'foo'"],
            // print output
            // true,
        );
    });

    describe("list", function() {
        it("lists breakpoints", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
            // magic command
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("no list without breakpoints", async function() {
            await testMagic(
            // magic command
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "No Breakpoints.",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });
    });

    describe("clear", function() {
        it("all", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
            // magic command
                "%break list\n" +
                "%break clear --all\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                    "No Breakpoints.",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("by name", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
            // magic command
                "%break list\n" +
                "%break clear bp1\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                    "No Breakpoints.",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("by number", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
            // magic command
                "%break list\n" +
                "%break clear 1\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                    "No Breakpoints.",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("two by names", async function() {
            new Breakpoint({
                sourceName: "mySourceName1",
                all: true,
            });

            new Breakpoint({
                sourceName: "mySourceName2",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break clear bp1 bp2\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName1\"",
                    "(2)    bp2: \"all::sourceName:mySourceName2\"",
                    "No Breakpoints.",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("errors on name not found", async function() {
            await testMagic(
                // magic command
                "%break clear bar\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Breakpoint(s) not found: bar"],
                // print output
                // true,
            );
        });

        it("clears all if both 'name' and 'all' are specified", async function() {
            new Breakpoint({
                sourceName: "mySourceName1",
                all: true,
            });

            new Breakpoint({
                sourceName: "mySourceName2",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break clear bp1 --all\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName1\"",
                    "(2)    bp2: \"all::sourceName:mySourceName2\"",
                    "No Breakpoints.",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("errors on number not found", async function() {
            await testMagic(
                // magic command
                "%break clear 42\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Breakpoint(s) not found: 42"],
                // print output
                // true,
            );
        });

        it("errors if neither name nor all are specified", async function() {
            await testMagic(
                // magic command
                "%break clear\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Must provide a list of breakpoint names or numbers to clear, or the --all flag to clear all breakpoints."],
                // print output
                // true,
            );
        });
    });

    describe("add", function() {
        it("all flavors", async function() {
            await testMagic(
            // magic command
                "%break add --once --name bob --count 42 --event-type foo --source-name bubba --source-type bar\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bob: \"all::sourceType:bar,sourceName:bubba,eventType:foo\" (0/42) [once]",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("all short flavors", async function() {
            await testMagic(
            // magic command
                "%break add -o -n bob -c 42 --et foo --sn bubba --st bar\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bob: \"all::sourceType:bar,sourceName:bubba,eventType:foo\" (0/42) [once]",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("every", async function() {
            await testMagic(
            // magic command
                "%break add --every\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"*\"",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("errors on no args", async function() {
            await testMagic(
            // magic command
                "%break add\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Must specify at least one of --event-type, --source-name, --source-type and / or --every"],
                // print output
                // true,
            );
        });

        it("every trumps other args", async function() {
            await testMagic(
            // magic command
                "%break add --every --event-type foo\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"*\"",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });
    });

    describe("disable", function() {
        it("by name", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break disable bp1\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\" [disabled]",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("by number", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break disable 1\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\" [disabled]",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("by two names", async function() {
            new Breakpoint({
                sourceName: "mySourceName1",
                all: true,
            });

            new Breakpoint({
                sourceName: "mySourceName2",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break disable bp1 bp2\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName1\"",
                    "(2)    bp2: \"all::sourceName:mySourceName2\"",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName1\" [disabled]",
                    "(2)    bp2: \"all::sourceName:mySourceName2\" [disabled]",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("errors on name not found", async function() {
            await testMagic(
                // magic command
                "%break disable bar\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Breakpoint(s) not found: bar"],
                // print output
                // true,
            );
        });

        it("errors on number not found", async function() {
            await testMagic(
                // magic command
                "%break disable 42\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Breakpoint(s) not found: 42"],
                // print output
                // true,
            );
        });
    });

    describe("enable", function() {
        it("by name", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break disable bp1\n" +
                "%break list\n" +
                "%break enable bp1\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\" [disabled]",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("by number", async function() {
            new Breakpoint({
                sourceName: "mySourceName",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break disable 1\n" +
                "%break list\n" +
                "%break enable 1\n" +
                "%break list\n",
                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\" [disabled]",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName\"",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("by two names", async function() {
            new Breakpoint({
                sourceName: "mySourceName1",
                all: true,
            });

            new Breakpoint({
                sourceName: "mySourceName2",
                all: true,
            });

            await testMagic(
                // magic command
                "%break list\n" +
                "%break disable bp1 bp2\n" +
                "%break list\n" +
                "%break disable bp1 bp2\n" +
                "%break list\n",

                // return value
                undefined,
                // stdout
                [
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName1\"",
                    "(2)    bp2: \"all::sourceName:mySourceName2\"",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName1\" [disabled]",
                    "(2)    bp2: \"all::sourceName:mySourceName2\" [disabled]",
                    "Breakpoints:",
                    "(1)    bp1: \"all::sourceName:mySourceName1\"",
                    "(2)    bp2: \"all::sourceName:mySourceName2\"",
                ],
                // stderr
                [],
                // print output
                // true,
            );
        });

        it("errors on name not found", async function() {
            await testMagic(
                // magic command
                "%break enable foo\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Breakpoint(s) not found: foo"],
                // print output
                // true,
            );
        });

        it("errors on number not found", async function() {
            await testMagic(
                // magic command
                "%break enable 30\n",
                // return value
                undefined,
                // stdout
                [],
                // stderr
                ["Breakpoint(s) not found: 30"],
                // print output
                // true,
            );
        });
    });
});
