const {Grid} = require("../src/Grid.js");
const {assert} = require("chai");
const helperScreens = require("./helpers/screens");

describe("Grid", function() {
    it("is Function", function() {
        assert.isFunction(Grid);
    });

    it("creates a Grid object", function() {
        let g = new Grid(3, 5);
        assert.instanceOf(g, Grid);
    });

    it("can get dataBuf", function() {
        let g = new Grid(3, 5);
        assert.isTrue(ArrayBuffer.isView(g.dataBuf));
        assert.instanceOf(g.dataBuf.buffer, ArrayBuffer);
    });

    it("can get width and height", function() {
        let g = new Grid(3, 5);
        assert.strictEqual(g.width, 3);
        assert.strictEqual(g.height, 5);
    });

    it("can't set width", function() {
        let g = new Grid(3, 5);
        assert.strictEqual(g.width, 3);
        assert.throws(() => {
            g.width = 100;
        }, Error, "can't set property width");
        assert.strictEqual(g.width, 3);
    });

    it("can't set height", function() {
        let g = new Grid(3, 5);
        assert.strictEqual(g.height, 5);
        assert.throws(() => {
            g.height = 100;
        }, Error, "can't set property height");
        assert.strictEqual(g.height, 5);
    });

    it("can't get private property", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g._width;
        }, Error, "attempting to access private property _width");
    });

    it("can't set private property", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g._width = 100;
        }, Error, "can't set property _width");
    });

    it("can assign value to Grid[x][y]", function() {
        let g = new Grid(3, 5);
        assert.instanceOf(g, Grid);
        g[0][0] = 42;
        assert.strictEqual(g.dataBuf[0], 42);
        g[2][4] = 69;
        assert.strictEqual(g.dataBuf[14], 69);
        let i = 0;
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 5; y++) {
                g[x][y] = i++;
            }
        }

        for (i = 0; i < 15; i++) {
            assert.strictEqual(g.dataBuf[i], i);
        }
    });

    it("can get a value from Grid[x][y]", function() {
        let g = new Grid(3, 5);
        assert.instanceOf(g, Grid);
        g[0][0] = 42;
        assert.strictEqual(g.dataBuf[0], 42);
        g[2][4] = 69;
        assert.strictEqual(g.dataBuf[14], 69);
        assert.strictEqual(g[0][0], 42);
        assert.strictEqual(g[2][4], 69);
    });

    it("throws if setting 'x' value", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[0] = 1;
        }, Error, "can't set property 0");
    });

    it("throws on getting negative 'x'", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[-1];
        }, Error, "Attempting to access value out of bounds: requested -1");

        assert.throws(() => {
            g[-7][0] = 5;
        }, Error, "Attempting to access value out of bounds: requested -7");
    });

    it("throws on getting 'x' beyond max", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[3];
        }, Error, "Attempting to access value out of bounds: requested 3, max is 2");

        assert.throws(() => {
            g[100][0] = 5;
        }, Error, "Attempting to access value out of bounds: requested 100, max is 2");
    });

    it("throws on getting negative 'y'", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[0][-1];
        }, Error, "Attempting to access value out of bounds: requested -1");
    });

    it("throws on setting negative 'y'", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[0][-8] = 5;
        }, Error, "Attempting to access value out of bounds: requested -8");
    });

    it("throws on getting 'y' beyond max", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[0][5];
        }, Error, "Attempting to access value out of bounds: requested 5, max is 4");

        assert.throws(() => {
            g[0][100];
        }, Error, "Attempting to access value out of bounds: requested 100, max is 4");
    });

    it("throws on setting 'y' beyond max", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[0][5] = 12;
        }, Error, "Attempting to access value out of bounds: requested 5, max is 4");

        assert.throws(() => {
            g[0][100] = 12;
        }, Error, "Attempting to access value out of bounds: requested 100, max is 4");
    });

    it("throws if setting value on Grid that doesn't exist", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g.foo = 100;
        }, Error, "can't set property foo");
    });

    it("converts characters", function() {
        let g = new Grid(3, 5);

        g[0][0] = "a";
        assert.strictEqual(g[0][0], 97);
    });

    it("throws on strings", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[0][0] = "abc";
        }, Error, "unable to convert value abc to number");
    });

    it("throws on unknown types", function() {
        let g = new Grid(3, 5);

        assert.throws(() => {
            g[0][0] = new Map();
        }, Error, "unable to convert value [object Map] to number");
    });

    describe("toString", function() {
        it("formats Grid", function() {
            let g = new Grid(3, 5);
            g[0][0] = 1;
            g[1][0] = 1;
            g[2][0] = 2;
            g[2][1] = 3;
            g[2][2] = 5;
            g[2][3] = 8;
            g[2][4] = 13;

            // for (let i = 0; i < 15; i++) console.log(`g.dataBuf[${i}] === ${g.dataBuf[i]}`);
            // assert.strictEqual(g.dataBuf[i], i);

            let str = g.toString();
            assert.strictEqual(
                str,
                "   1   1   2\n" +
                "   0   0   3\n" +
                "   0   0   5\n" +
                "   0   0   8\n" +
                "   0   0  13\n",
            );
        });

        it("formats with serializer", function() {
            let g = new Grid(3, 5, {
                serializer: function(val) {
                    if (val === 0) {
                        return " ";
                    }

                    return String.fromCharCode(val);
                },
            });
            g[0][0] = "h";
            g[1][0] = "i";
            g[2][0] = "t";
            g[2][1] = "h";
            g[2][2] = "e";
            g[2][3] = "r";
            g[2][4] = "e";

            // for (let i = 0; i < 15; i++) console.log(`g.dataBuf[${i}] === ${g.dataBuf[i]}`);
            // assert.strictEqual(g.dataBuf[i], i);

            let str = g.toString();
            assert.strictEqual(
                str,
                "hit\n" +
                "  h\n" +
                "  e\n" +
                "  r\n" +
                "  e\n",
            );
        });

        it("serializer converts space to 0");
    });

    describe("copy", function() {
        it("makes a duplicate", function() {
            let g1 = new Grid(3, 5);
            g1[0][0] = 12;
            g1[2][4] = 7;
            assert.strictEqual(g1[0][0], 12);
            assert.strictEqual(g1[2][4], 7);

            let g2 = g1.copy();
            assert.instanceOf(g2, Grid);

            assert.notStrictEqual(g1, g2);
            assert.notStrictEqual(g1.dataBuf, g2.dataBuf);
            assert.notStrictEqual(g1.dataBuf.buffer, g2.dataBuf.buffer);
            assert.strictEqual(g1.dataBuf.buffer.byteLength, g2.dataBuf.buffer.byteLength);
            assert.strictEqual(g1.width, g2.width);
            assert.strictEqual(g1.height, g2.height);
            assert.strictEqual(g2[0][0], 12);
            assert.strictEqual(g2[2][4], 7);
        });

        it("copies serializer", function() {
            function foo() {}
            let g1 = new Grid(3, 5, {
                serializer: foo,
            });
            let g2 = g1.copy();
            assert.strictEqual(g2.serializer, foo);
        });

        it("copies converter", function() {
            function foo() {}
            let g1 = new Grid(3, 5, {
                converter: foo,
            });
            let g2 = g1.copy();
            assert.strictEqual(g2.converter, foo);
        });
    });

    describe("clear", function() {
        it("zeros Grid", function() {
            let g = new Grid(3, 5);
            g[0][0] = 12;
            g[2][4] = 7;
            assert.strictEqual(g[0][0], 12);
            assert.strictEqual(g[2][4], 7);

            g.clear();

            assert.strictEqual(g[0][0], 0);
            assert.strictEqual(g[2][4], 0);
        });
    });

    describe("from", function() {
        it("creates Grid", function() {
            let screen1 = helperScreens[1].split("\n");
            let g = Grid.from(screen1);
            assert.instanceOf(g, Grid);
            assert.strictEqual(g.width, 80);
            assert.strictEqual(g.height, 20);
            assert.strictEqual(g[0][0], 0);
            assert.strictEqual(g[30][9], 64);
        });
    });

    describe("forEach", function() {
        it("iterates Grid");
    });

    describe("diff", function() {
        it("compares two Grids", function() {
            let g1 = new Grid(5, 5);
            let g2 = new Grid(5, 5);
            g1[0][0] = 42;
            g2[4][4] = 32;
            let ret = Grid.diff(g1, g2);
            assert.isArray(ret);
            assert.strictEqual(ret.length, 2);
            assert.deepEqual(ret, [
                {x: 0, y: 0, srcVal: 42, dstVal: 0},
                {x: 4, y: 4, srcVal: 0, dstVal: 32},
            ]);
        });

        it("returns null if Grids are the same", function() {
            let g1 = new Grid(5, 5);
            let g2 = new Grid(5, 5);
            let ret = Grid.diff(g1, g2);
            assert.isNull(ret);
        });

        it("throws if Grids are different sizes", function() {
            let g1 = new Grid(5, 5);
            let g2 = new Grid(5, 4);
            assert.throws(() => {
                Grid.diff(g1, g2);
            }, Error, "diff expected Grids to be same size: src(5,5) vs dst(5,4)");
        });
    });
});
