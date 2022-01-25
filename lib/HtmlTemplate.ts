const path = require("path");
const Handlebars = require("handlebars");
const {checkType, checkInstance, resolveFileOrString} = require("./Utility");
const {Config} = require("./Config");
const templateGlobal = {};
const ext = ".hbs";

/**
 * HTML templates for visualizations in Jupyter
 */
class HtmlTemplate {
    /**
     * Create a HTML template from a file or string that can be rendered to HTML later using `toHtml`
     *
     * @param  {string} template The name of a file to load or a string representing a template
     * @param  {Object} opts     Options for the template
     * @returns {HtmlTemplate}    The newly created template
     */
    constructor(template, opts = {}) {
        let basedir = Config.get("html-template-dir");

        // load contents of file
        this.rawTemplate = resolveFileOrString(template, {basedir, ext});

        // compile the template
        this.hbTemplate = Handlebars.compile(this.rawTemplate);

        // save required data
        if (opts.requiredData) {
            checkInstance("HtmlTemplate.constructor", "opts.requiredData", opts.requiredData, Array);
            this.requiredData = opts.requiredData;
        }
    }

    /**
     * Convert data to HTML using the template
     *
     * @param  {Object} userData An object containing the data to be used in the template
     * @returns {string}          The HTML of the rendered template
     */
    toHtml(userData = {}) {
        checkType("HtmlTemplate.toHtml", "userData", userData, "object");

        // create data object
        let data = {... userData};
        data.templateGlobal = templateGlobal;

        // TODO: validate data

        // run previously compiled handlebars template
        return this.hbTemplate(data);
    }

    /**
     * Set a global data value that will be passed as part of the data object in all templates as `templateGlobal`.
     *
     * @param {string} key The property to set in `templateGlobal`
     * @param {any} val The value to assign to the key
     */
    static setGlobal(key, val) {
        checkType("HtmlTemplate.setGlobal", "key", key, "string");
        if (Object.keys(templateGlobal).includes(key)) {
            throw new TypeError(`HtmlTemplate.setGlobal: '${key}' already exists`);
        }

        templateGlobal[key] = val;
    }

    /**
     * Return previously set global values. Mostly used for testing.
     *
     * @returns {object} Object containing all set globals.
     */
    static getGlobals() {
        return templateGlobal;
    }

    /**
     * Remove all previously set global values. Mostly used for testing.
     */
    static resetGlobals() {
        for (let key of Object.keys(templateGlobal)) {
            delete templateGlobal[key];
        }
    }

    /**
     * Initialize the templating system
     *
     * @returns {Promise} A Promise that resolves with initialization is complete
     */
    static async init() {
        let basedir = Config.get("html-template-dir");

        // load helpers
        let helperObj = require(path.resolve(basedir, "helpers"));
        Object.keys(helperObj).forEach((name) => Handlebars.registerHelper(name, helperObj[name]));

        // load partials
        let partials = require(path.resolve(basedir, "partials"));
        Object.keys(partials).forEach((name) => Handlebars.registerPartial(name, resolveFileOrString(partials[name], {basedir, ext})));
    }

    /**
     * Shutdown the templating system
     *
     * @returns {Promise} A Promise that resolves when initialization is complete
     */
    static async shutdown() {
        // XXX: this will break if the config changes after init; maybe each template should have a different Handlebars instance
        let basedir = Config.get("html-template-dir");

        // unload helpers
        let helperObj = require(path.resolve(basedir, "helpers"));
        Object.keys(helperObj).forEach((name) => Handlebars.unregisterHelper(name));

        // unload partials
        let partials = require(path.resolve(basedir, "partials"));
        Object.keys(partials).forEach((name) => Handlebars.unregisterPartial(name));

        // remove globals
        HtmlTemplate.resetGlobals();
    }
}

module.exports = {
    HtmlTemplate,
};
