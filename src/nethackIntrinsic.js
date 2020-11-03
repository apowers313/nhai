const {Intrinsic, Component, Utility} = require("../index");
const {checkInstance} = Utility;

const ignoreList = new Set(["BL_TITLE", "BL_ALIGN", "BL_GOLD", "BL_LEVELDESC"]);

new Intrinsic("str");
new Intrinsic("dex");
new Intrinsic("con");
new Intrinsic("int");
new Intrinsic("wis");
new Intrinsic("char");
new Intrinsic("cap");
new Intrinsic("energy");
new Intrinsic("energy-max");
new Intrinsic("xp");
new Intrinsic("ac");
new Intrinsic("hunger");
new Intrinsic("hp");
new Intrinsic("hp-max");

// eslint-disable-next-line jsdoc/require-jsdoc
function setIntrinsic(name, value) {
    if (ignoreList.has(name)) {
        return;
    }

    name = convertNethackName(name);

    let i = Component.get(name);
    checkInstance("setIntrinsic", "intrinsic", i, Component);
    i.value = value;
}

function convertNethackName(name) {
    switch (name) {
    case "BL_STR": return "str";
    case "BL_DX": return "dex";
    case "BL_CO": return "con";
    case "BL_IN": return "int";
    case "BL_WI": return "wis";
    case "BL_CH": return "char";
    case "BL_CAP": return "cap";
    case "BL_ENE": return "energy";
    case "BL_ENEMAX": return "energy-max";
    case "BL_XP": return "xp";
    case "BL_AC": return "ac";
    case "BL_HUNGER": return "hunger";
    case "BL_HP": return "hp";
    case "BL_HPMAX": return "hp-max";
    default: throw new Error(`'${name}' is not a known intrinsic`);
    }
}

module.exports = setIntrinsic;

