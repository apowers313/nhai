import * as path from "path";
import {cytoscapeTemplateContents, testTemplateContents} from "./helpers/helpers";
import {Utility} from "../mod";
import {assert} from "chai";
const {randomSeed, randomFloat, randomInt, resolveFileOrString} = Utility;

const basedir = path.resolve(__dirname, "../assets/hbs");
const ext = ".hbs";

describe("Utility", function() {
    describe("random", function() {
        it("returns random float", function() {
            const f = randomFloat();
            assert.isNumber(f);
            assert.isFalse(f % 1 === 0);
        });

        it("returns random int", function() {
            const i = randomInt();
            assert.isNumber(i);
            assert.isTrue(i % 1 === 0);
        });

        it("returns same sequence for same seed", function() {
            randomSeed("hello.");
            assert.strictEqual(randomFloat(), 0.9282578795792454);
            assert.strictEqual(randomFloat(), 0.3752569768646784);
            assert.strictEqual(randomFloat(), 0.7316977468919549);
        });

        it("returns different sequence for different seed", function() {
            randomSeed("hello!");
            assert.notStrictEqual(randomFloat(), 0.9282578795792454);
            assert.notStrictEqual(randomFloat(), 0.3752569768646784);
            assert.notStrictEqual(randomFloat(), 0.7316977468919549);
        });

        it("accepts integer seed", function() {
            randomSeed(3);
            assert.strictEqual(randomFloat(), 0.7568531143538124);
            assert.strictEqual(randomFloat(), 0.6138858151827953);
            assert.strictEqual(randomFloat(), 0.9803335113014127);
        });

        it("accepts object seed", function() {
            randomSeed({foo: "bar"});
            assert.strictEqual(randomFloat(), 0.3799992233952366);
            assert.strictEqual(randomFloat(), 0.7128710993724056);
            assert.strictEqual(randomFloat(), 0.6180286446270832);
        });

        // XXX: for some reason this has different results on different CIs
        // it("accepts date seed", function() {
        //     randomSeed(new Date(0));
        //     assert.strictEqual(randomFloat(), 0.45849928108785903);
        //     assert.strictEqual(randomFloat(), 0.41759607379639296);
        //     assert.strictEqual(randomFloat(), 0.9148432874951367);
        //     randomSeed(new Date(0));
        //     console.log("Date(0)", new Date(0));
        //     console.log("randomoFloat", randomFloat());
        // });

        it("undefined seed is non-deterministic", function() {
            randomSeed();
            const r1 = randomFloat();
            const r2 = randomFloat();
            const r3 = randomFloat();
            randomSeed();
            assert.notStrictEqual(randomFloat(), r1);
            assert.notStrictEqual(randomFloat(), r2);
            assert.notStrictEqual(randomFloat(), r3);
        });

        it("null seed is non-deterministic", function() {
            randomSeed(null);
            const r1 = randomFloat();
            const r2 = randomFloat();
            const r3 = randomFloat();
            randomSeed(null);
            assert.notStrictEqual(randomFloat(), r1);
            assert.notStrictEqual(randomFloat(), r2);
            assert.notStrictEqual(randomFloat(), r3);
        });
    });

    describe("resolveFileOrString", function() {
        it("resolves absolute path", function() {
            const t = resolveFileOrString(path.resolve(__dirname, "./helpers/data.hbs"), {basedir, ext});
            assert.strictEqual(t, testTemplateContents);
        });

        it("resolves relative path", function() {
            const t = resolveFileOrString("./test/helpers/data.hbs", {basedir, ext});
            assert.strictEqual(t, testTemplateContents);
        });

        it("resolves asset dir path", function() {
            const t = resolveFileOrString("cytoscapeInit.hbs", {basedir, ext});
            assert.strictEqual(t, cytoscapeTemplateContents);
        });

        it("appends .hbs if not found", function() {
            const t = resolveFileOrString("cytoscapeInit", {basedir, ext});
            assert.strictEqual(t, cytoscapeTemplateContents);
        });

        it("returns string if multi-line", function() {
            const testTemplate = "{{foo}}\n{{bar}}";
            const t = resolveFileOrString(testTemplate, {basedir, ext});
            assert.strictEqual(t, testTemplate);
        });

        it("returns string if file not found", function() {
            const testTemplate = "{{foo}}{{bar}}";
            const t = resolveFileOrString(testTemplate, {basedir, ext});
            assert.strictEqual(t, testTemplate);
        });
    });
});
