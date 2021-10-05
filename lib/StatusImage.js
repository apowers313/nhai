const {EventListener} = require("./EventBase");
const {HtmlTemplate} = require("./HtmlTemplate");
const {checkType, checkInstance} = require("./Utility");

class StatusImage {
    constructor(templateStr, eventList) {
        checkType("StatusImage.constructor", "templateStr", templateStr, "string");
        checkInstance("StatusImage.constructor", "eventList", eventList, Array);

        this.eventCount = 0;
        this.template = new HtmlTemplate(templateStr);
        this.data = new Map();

        // listen for all events
        EventListener.listenAll((e) => {
            // collect events
            this.eventCb(e);
        });
    }

    eventCb(e) {
        checkType("StatusImage.eventCb", "e", e, "object");

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
