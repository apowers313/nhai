const {Intrinsic, Component, Utility} = require("../index");
const {checkInstance} = Utility;

const ignoreList = new Set(["BL_TITLE", "BL_ALIGN", "BL_GOLD", "BL_LEVELDESC"]);

new Intrinsic("str");
new Intrinsic("dex");
new Intrinsic("con");
new Intrinsic("int");
new Intrinsic("wis");
new Intrinsic("char");
new Intrinsic("cap", {
    min: 0,
    max: 5,
    positive: false,
    converter: capacityToValue,
});
new Intrinsic("energy");
new Intrinsic("energy-max");
new Intrinsic("xp");
new Intrinsic("ac");
new Intrinsic("hunger", {
    min: 0,
    max: 10,
    positive: false,
    converter: hungerToValue,
});
new Intrinsic("hp");
new Intrinsic("hp-max");
new Intrinsic("cond");

function hungerToValue(val) {
    switch (val.trim().toLowerCase()) {
    case "satiated": return 2;
    case "not hungry": return 0;
    case "": return 0;
    case "hungry": return 1;
    case "weak": return 2;
    case "fainting": return 5;
    case "fainted": return 5;
    case "starved": return 10;
    default: throw new Error(`Unknown hunger type: '${val}'`);
    }
}

function capacityToValue(val) {
    // Burdened, streSsed, straiNed, overTaxed, overLoaded
    switch (val.trim().toLowerCase()) {
    case "": return 0;
    case "burdened": return 1;
    case "stressed": return 2;
    case "strained": return 3;
    case "overtaxed": return 4;
    case "overloaded": return 5;

    default: throw new Error(`Unknown capacity type: '${val}'`);
    }
}

// function goldToValue(val) {
//     const goldRegex = /^\\G[A-F0-9]{8}:(?<goldval>[0-9]*)$/;
//     return Intrinsic.defaultConverter(val.match(goldRegex).groups.goldval);
// }

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
    case "BL_CONDITION": return "cond";
    default: throw new Error(`'${name}' is not a known intrinsic`);
    }
}

module.exports = setIntrinsic;

