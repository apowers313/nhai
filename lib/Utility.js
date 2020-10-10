/**
 * A group of commonly used utility functions
 */
class Utility {
    /**
     * Checks the type of a variable and throws if it is the wrong type
     *
     * @param {string} fnName    - Name of the calling function (for cosmetic purposes)
     * @param {string} valueName - Name of the function being checked (for cosmetic purposes)
     * @param {*}      value     - The variable to check
     * @param {string} type      - The expected type of the variable as reported by `typeof`
     *
     * @throws {TypeError} If `value` is not `typeof type`
     */
    static checkType(fnName, valueName, value, type) {
        let checkType = (type === "class") ? "function" : type;
        if (typeof value !== checkType) throw new TypeError(`${fnName} expected '${valueName}' to be a ${type}, got: ${value}`);
        // if (type === "class" && !classRegex.test(Function.prototype.toString.call(value))) throw new TypeError(`${fnName} expected '${valueName}' to be a class`);
    }

    /**
     * Checks the type of a variable and throws if it is the wrong type
     *
     * @param {string} fnName    - Name of the calling function (for cosmetic purposes)
     * @param {string} valueName - Name of the function being checked (for cosmetic purposes)
     * @param {*}      value     - The object to check
     * @param {string} cls       - The expected type of the variable as reported by `typeof`
     *
     * @throws {TypeError} If `value` is not an object or not an `instanceof cls`
     */
    static checkInstance(fnName, valueName, value, cls) {
        Utility.checkType(fnName, valueName, value, "object");
        if (!(value instanceof cls)) throw new TypeError(`${fnName} expected '${valueName}' to be instanceof ${cls.name}, got: ${value.constructor.name}`);
    }

    // static checkEnum(fnName, valueName, value, ... args) {}
}

// const classRegex = /^class/;

module.exports = Utility;
