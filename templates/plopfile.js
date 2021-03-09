function getDate() {
    let numericDateTime = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        // hour: "2-digit",
        // minute: "2-digit",
        // second: "2-digit",
        // hour12: false,
        // timeZoneName: "short",
    };
    let d = new Intl.DateTimeFormat("default", numericDateTime)
        .formatToParts()
        .reduce((acc, v) => Object({... acc, [v.type]: v.value}), {});

    console.log("date", d);
    return `${d.year}-${d.month}-${d.day}`;
}
let date = getDate();

// eslint-disable-next-line jsdoc/require-jsdoc
module.exports = function(plop) {
    plop.setGenerator("jupyter", {
        description: "sets up a Jupyter experiment for NHAI",
        prompts: [
            // experiment description
            // {
            //     type: "input",
            //     name: "date",
            //     message: "date of the experiment",
            //     default: "2020-03-06",
            //     when: true,
            // },
            {
                type: "input",
                name: "title",
                message: "a title for the experiment",
                validate: (title) => {
                    // if (title.length < 10) {
                    //     return "description too short";
                    // }

                    if (title.length > 80) {
                        return "description too long";
                    }

                    return true;
                },
            },
            {
                type: "input",
                name: "desc",
                message: "a long description of the experiment",
                default: "TODO",

            },
        ],
        actions: [
            // copy notebook file
            {
                type: "add",
                data: {date},
                path: "{{date}}_{{snakeCase title}}.ipynb",
                templateFile: "template-notebook.ipynb",
            },
            // TODO: start Jupyter
            function(answers) {
                console.log("ANSWERS:", answers);
                console.log("getDate", getDate());
            },
        ],
    });
};
