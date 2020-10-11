const repl = require("repl");
const Config = require("./Config");
const {checkType} = require("./Utility");

const options = {
    prompt: `${Config.get("shell-prompt")} `,
    useGlobal: "true",
    completer: completer,
    breakEvalOnSigint: true,
};

function completer(line) {
    const completions = ".beer .wine .cocktail .hello .prompt .this".split(" ");
    const hits = completions.filter((c) => c.startsWith(line));
    // Show all completions if none found
    return [hits.length ? hits : completions, line];
}

const commandMap = new Map();

class Shell {
    /**
     * Creates and runs a new interactive shell
     */
    constructor() {
        this.shell = repl.start(options);

        // TODO: add all default commands
    }

    /**
     * Adds a commmand to the shell
     *
     * @param {strint}   name - The name of the command to add. Will show up with a leading dot (e.g. `.command`) in the shell.
     * @param {Function} fn   - A function to be invoked when the command is run.
     */
    addCommand(name, fn) {
        checkType("addCommand", "name", name, "string");
        checkType("addCommand", "fn", fn, "function");

        if (commandMap.has(name)) throw new TypeError(`addDefaultCommand: name already exists: ${name}`);

        commandMap.set(name, fn);
    }

    // removeCommand() {}

    /**
     * Changes the prompt for the command shell.
     *
     * @param {string} prompt - The string to set the prompt to. Will automatically append the prompt character and a space.
     */
    changePrompt(prompt) {
        checkType("changePrompt", "prompt", prompt, "string");

        this.shell.setPrompt(`${prompt}${Config.get("shell-prompt")} `);
    }

    /**
     * Adds a default commmand to the shell. Must be added before the shell is created and will automatically be included in the shell at construction time.
     *
     * @param {strint}   name - The name of the command to add. Will show up with a leading dot (e.g. `.command`) in the shell.
     * @param {Function} fn   - A function to be invoked when the command is run.
     */
    static addDefaultCommand(name, fn) {
        checkType("addDefaultCommand", "name", name, "string");
        checkType("addDefaultCommand", "fn", fn, "function");

        if (commandMap.has(name)) throw new TypeError(`addDefaultCommand: name already exists: ${name}`);

        commandMap.set(name, fn);
    }
}

module.exports = Shell;
