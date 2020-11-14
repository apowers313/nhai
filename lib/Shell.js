/* istanbul ignore file */

const repl = require("repl");
const {Config} = require("./Config");
const {checkType} = require("./Utility");

const commandMap = new Map();

function completer(line) {
    let completions = [... commandMap.keys()].map((v) => `.${v}`);
    completions.push(".help");
    let hits = completions.filter((c) => c.startsWith(line));
    // Show all completions if none found
    return [hits.length ? hits : completions, line];
}

/**
 * A REPL shell for interacting with (e.g. debugging) internal components in real-time
 */
class Shell {
    /**
     * Creates and runs a new interactive shell
     */
    constructor() {
        let options = {
            prompt: `${Config.get("shell-prompt")} `,
            useGlobal: true,
            completer: completer,
            breakEvalOnSigint: true,
        };

        // create the shell
        let shell = repl.start(options);
        this.shell = shell;

        // exit whole program on SIGINT
        shell.on("exit", () => process.exit(0));

        // remove all commands except "help"
        Object.keys(shell.commands).forEach((name) => {
            if (name !== "help") {
                delete shell.commands[name];
            }
        });

        // add all default commands
        commandMap.forEach((cmd, name) => {
            this.addCommand(name, cmd.help, cmd.action);
        });
    }

    /**
     * Initializes the shell
     *
     * @returns {Shell} Returns a new shell
     */
    static async init() {
        if (Config.get("shell-enabled")) {
            return new Shell();
        }

        return null;
    }

    /**
     * Adds a commmand to the shell
     *
     * @param {string}   name   - The name of the command to add. Will show up with a leading dot (e.g. `.command`) in the shell.
     * @param {string}   help   - readable description of what the command does
     * @param {Function} action - A function to be invoked when the command is run.
     */
    addCommand(name, help, action) {
        checkType("addCommand", "name", name, "string");
        checkType("addDefaultCommand", "help", help, "string");
        checkType("addCommand", "action", action, "function");

        // if (commandMap.has(name)) {
        //     throw new TypeError(`addDefaultCommand: name already exists: ${name}`);
        // }

        let cmd = {
            help,
            action,
        };

        commandMap.set(name, cmd);
        this.shell.defineCommand(name, {
            help: cmd.help,
            action: (arg) => {
                let args = arg.split(" ").filter((v) => v !== "");
                let ret = cmd.action(... args);
                this.shell.displayPrompt();
                return ret;
            },
        });
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
     * @param {string}   name   - The name of the command to add. Will show up with a leading dot (e.g. `.command`) in the shell.
     * @param {string}   help   - readable description of what the command does
     * @param {Function} action - A function to be invoked when the command is run.
     */
    static addDefaultCommand(name, help, action) {
        checkType("addDefaultCommand", "name", name, "string");
        checkType("addDefaultCommand", "help", help, "string");
        checkType("addDefaultCommand", "action", action, "function");

        if (commandMap.has(name)) {
            throw new TypeError(`addDefaultCommand: name already exists: ${name}`);
        }

        let cmd = {
            help,
            action,
        };

        commandMap.set(name, cmd);
    }
}

module.exports = {Shell};

require("./ShellCommands");
