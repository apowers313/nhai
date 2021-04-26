const mockery = require("mockery");
mockery.enable({
    useCleanCache: false,
    // warnOnReplace: false,
    warnOnUnregistered: false,
});
mockery.registerMock("redisgraph.js", require("./redisGraphMock"));

require("./jupyterTest.js");
