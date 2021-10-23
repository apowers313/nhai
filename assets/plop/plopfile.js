const path = require("path");
const fs = require("fs");
const {spawn} = require("child_process");
const projectDir = path.resolve(__dirname, "../..");
const expConfFile = path.resolve(projectDir, "experiment.json");
let expConf;
try {
    expConf = require(expConfFile);
} catch (e) {
    expConf = {active: false, answers: {}, date: {}};
}

// eslint-disable-next-line jsdoc/require-jsdoc
module.exports = function(plop) {
    plop.setGenerator("experiment", {
        description: "sets up an experiment for NHAI",
        prompts: [
            // continue experiment?
            {
                type: "confirm",
                name: "continue",
                message: `would you like to continue the experiment "${expConf.answers.title}" (${expConf.date.dashDate})?`,
                default: true,
                when: expConf.active,
            },
            {
                type: "confirm",
                name: "push",
                message: `would you like to archive the docker container "${expConf.dockerContainer}?"`,
                default: true,
                when: (a) => (expConf.active && !a.continue),
            },
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
                when: (a) => !a.continue,
            },
            {
                type: "input",
                name: "desc",
                message: "a long description of the experiment",
                default: "TODO",
                when: (a) => !a.continue,
            },
        ],
        actions: function(answers) {
            let actions = [];

            if (answers.continue) {
                return restoreExperiment(answers);
            }

            if (expConf.active) {
                actions = archiveExperiment(answers);
            }

            return actions.concat(createExperiment(answers));
        },
    });

    plop.setGenerator("archive", {
        descrption: "saves the current experiment in an external repository",
        prompts: [],
        actions: function() {
            return archiveExperiment({push: true}, false);
        },
    });

    plop.setGenerator("dev-docker", {
        descrption: "launches docker for development",
        prompts: [],
        actions: function() {
            let actions = [];

            buildDocker(actions, `nhai-dev-image-${date.compactDate}`);
            runDocker(actions, `nhai-dev-image-${date.compactDate}`, `nhai-dev-container-${date.compactDate}${date.timestamp}`);

            return actions;
        },
    });
};

function createExperiment(answers) {
    let actions = [];
    let title = answers.title.toLowerCase().replace(/ /g, "-");
    let newJupyterFile = `${date.dashDate}_${title}.ipynb`;

    // let newJupyterFile = path.resolve(projectDir, "experiments", `${date.dashDate}_${title}.ipynb`);
    // process.env.NHAI_JUPYTER_FILE = newJupyterFile;

    // create experiment.json
    actions.push(() => {
        console.log("creating experiment...");
        expConf.date = date;
        expConf.active = true;
        expConf.jupyterFile = newJupyterFile;
        expConf.answers = answers;
        expConf.dockerContainer = `nhai-container-${date.compactDate}-${title}`;
        expConf.dockerImage = `nhai-image-${date.compactDate}`;
        saveConf();
    });

    // convert plopfile to Jupyter file
    actions.push({
        type: "add",
        data: {date: `${date.dashDate}`},
        path: `../../${newJupyterFile}`,
        templateFile: "template-notebook.ipynb",
    });

    // build docker image
    buildDocker(actions, expConf.dockerImage, newJupyterFile, true);

    // run docker image
    runDocker(actions, expConf.dockerImage, expConf.dockerContainer);

    return actions;
}

function restoreExperiment(answers) {
    let actions = [];

    // docker container start
    actions.push(async() => {
        return spawnAsync(`docker container start -ai ${expConf.dockerContainer}`);
    });

    return actions;
}

function archiveExperiment(answers, deactivate = true) {
    let actions = [];

    // set experiment.json to inactive
    if (deactivate) {
        actions.push(() => {
            expConf.active = false;
            saveConf();
        });
    }

    // extract Jupyter file from docker
    actions.push(async() => {
        console.log("copying file...");
        let from = `${expConf.dockerContainer}:/home/apowers/${path.basename(expConf.jupyterFile)}`;
        let to = path.resolve(projectDir, "./experiments");
        return spawnAsync(`docker cp ${from} ${to}`);
    });

    if (answers.push) {
        // push Docker container to repo
        actions.push(async() => {
            console.log("storing docker...");
            return spawnAsync(`docker push ${expConf.dockerContainer}`);
        });
    }

    return actions;
}

function buildDocker(actions, imageName, jupyterFile = "test/integration/integration-test.ipynb", delJup = false) {
    actions.push(async() => {
        console.log("running build...");
        await spawnAsync(`docker build --build-arg JUPYTER_FILE=./${jupyterFile} --tag ${imageName} .`);
        if (delJup) {
            fs.rmSync(`./${jupyterFile}`);
        }
    });
}

function runDocker(actions, imageName, containerName) {
    actions.push(async() => {
        console.log("running image...");
        return spawnAsync(`docker run -p 6379:6379 -p 8080:8080 -p 8888:8888 -p 8088:8088 -p 8000:8000 -it --name ${containerName} ${imageName}`);
    });
}

function saveConf() {
    fs.writeFileSync(expConfFile, JSON.stringify(expConf, null, 4), {encoding: "utf8"});
}

function spawnAsync(str) {
    console.log("Running command:", str);
    let args = str.split(" ");
    let cmd = args.shift();

    if (typeof cmd !== "string") {
        throw new Error("expected 'cmd' to be string, got", cmd);
    }

    let opts = {
        stdio: "inherit",
    };

    return new Promise((resolve, reject) => {
        spawn(cmd, args, opts).on("close", (code) => {
            if (code === 0) {
                return resolve(code);
            }

            reject(code);
        });
    });
}

function getDate() {
    let numericDateTime = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
    };
    let d = new Intl.DateTimeFormat("default", numericDateTime)
        .formatToParts()
        .reduce((acc, v) => Object({... acc, [v.type]: v.value}), {});

    d.dashDate = `${d.year}-${d.month}-${d.day}`;
    d.compactDate = `${d.year}${d.month}${d.day}`;
    d.timestamp = `${d.hour}${d.minute}${d.second}`;

    return d;
}
let date = getDate();

