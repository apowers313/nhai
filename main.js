const nethackStart = require("@neth4ck/neth4ck");
const nethackShimCallback = require("./src/nethackCallback");
// async function nethackShimCallback(name, ... args) {
//     console.log(`callback: ${name} ${args}`);
// }

console.log("nethackShimCallback", nethackShimCallback);

nethackStart(nethackShimCallback);
