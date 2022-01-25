const {EventListener} = require("./EventBase");
const {HtmlTemplate} = require("./HtmlTemplate");
const {checkType, checkInstance} = require("./Utility");

/**
 * creates an SVG image showing the point-in-time state of the system
 */
class StatusImage {
    /**
     * constructor for creating a new status image
     *
     * @param  {string} templateStr The string or path to a Handlebars template to be used for the SVG image
     * @param  {Array<string>} eventList   An array of strings of event names to listen for as part of the status update. They will e passed to the Handlebars tempalte as data.
     * @returns {StatusImage}             The newly created StatusImage object
     */
    constructor(templateStr, eventList) {
        checkType("StatusImage.constructor", "templateStr", templateStr, "string");
        checkInstance("StatusImage.constructor", "eventList", eventList, Array);

        this.eventCount = 0;
        this.template = new HtmlTemplate(templateStr);
        this.data = new Map();

        // listen for all events
        EventListener.listenAll((e) => {
            // collect events
            this._eventCb(e);
        });
    }

    /**
     * Called when an event is detected to aggregate status events. Mostly for internal use.
     *
     * @param  {EventBase} e An event that inherits from EventBase
     */
    _eventCb(e) {
        checkType("StatusImage._eventCb", "e", e, "object");

        this.eventCount++;

        // reduce events to array of eventName.data
        // let evtList = this.data.[e.type] = this.data.[e.type] || [];
        if (this.data.has(e.type)) {
            this.data.get(e.type).push(e.data);
        } else {
            this.data.set(e.type, [e.data]);
        }

        // on sync, clear data for fresh status next time
        if (e.sourceName === "synchronize" &&
            e.sourceType === "synchronize" &&
            e.type === "tick") {
            this.data.clear();
        }
    }

    /**
     * Renders the SVG from the template and the event data
     *
     * @returns {string} A string representing the SVG image of the current status
     */
    render() {
        // render template with data from events
        let data = Object.fromEntries(this.data);
        // console.log("render data", data);
        return this.template.toHtml(data);
    }
}

module.exports = {
    StatusImage,
};
