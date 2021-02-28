const {Jupyter} = require("../Jupyter");
const {Config} = require("../Config");
const {print} = require("../Log");

Jupyter.addMagic("%version", shellVersion);
function shellVersion() {
    print("version:", Config.get("app-version"));
}
