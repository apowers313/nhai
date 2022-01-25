/* eslint-disable jsdoc/require-jsdoc */

const eventList = [];

/**
 * Tracing execution flow, used for debugging and research
 */
class Trace {
    static getEventHistory() {
        return [... eventList];
    }

    static clearEventHistory() {
        eventList.length = 0;
    }

    static addEvent(e) {
        eventList.push(e);
    }
}

module.exports = {
    Trace,
};
