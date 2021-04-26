const Handlebars = require("handlebars");

const helperList = {
    json: function(str) {
        return JSON.stringify(str);
    },
};

module.exports = helperList;
