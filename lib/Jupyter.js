const nop = (... args)=>{
    console.log("NOP:", ... args);
};

let addMagic = nop;
if (typeof global.$$ === "object" &&
    typeof global.$$.addMagic === "function") {
    // eslint-disable-next-line prefer-destructuring
    addMagic = global.$$.addMagic;
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
    /**
     * Adds a new magic command. Wrapper around magicpatch.
     *
     * @param {...any} args
     */
    static addMagic(... args) {
        addMagic(... args);
    }

    /**
     * Adds documentation and arg parsing for a magic function. Wrapper around magicpatch.
     *
     * @param {...any} args
     */
    static decorateMagic(... args) {
        decorateMagic(... args);
    }
}

module.exports = {
    Jupyter,
};

require("./ShellCommands");

