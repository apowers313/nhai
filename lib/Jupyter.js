const nop = (... args)=>{
    console.log("NOP:", ... args);
};
console.log("loading Jupyter...");

let addMagic = nop;
if (typeof global.$$ === "object" &&
    typeof global.$$.addMagic === "function") {
    // eslint-disable-next-line prefer-destructuring
    addMagic = global.$$.addMagic;
    console.log("addMagic set");
} else {
    console.log("addMagic NOT set");
    // console.log("$$ is:", global.$$);
}

let decorateMagic = nop;
if (typeof global.$$ === "object" &&
    typeof global.$$.addMagic === "function" &&
    typeof global.$$.addMagic.utils === "object" &&
    typeof global.$$.addMagic.utils.decorateMagic === "function") {
    // eslint-disable-next-line prefer-destructuring
    decorateMagic = global.$$.addMagic.utils.decorateMagic;
}

class Jupyter {
    static addMagic(... args) {
        addMagic(... args);
    }

    static decorateMagic(... args) {
        decorateMagic(... args);
    }
}

module.exports = {
    Jupyter,
};

require("./ShellCommands");

