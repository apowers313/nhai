/* eslint-disable consistent-return */

const {Grid} = require("./Grid.js");
const vision = require("./nethackVision");
const setIntrinsic = require("./nethackIntrinsic");
const {actionQueue, getAction} = require("./nethackAction");
const nhai = require("../index");
const {warn} = nhai.Log;

// eslint-disable-next-line jsdoc/require-jsdoc
module.exports = async function nethackShimCallback(name, ... args) {
    switch (name) {
    case "shim_init_nhwindows":
        return await nhai.init();
    // case "shim_create_nhwindow":
    //     winCount++;
    //     // console.log("creating window", args, "returning", winCount);
    //     return winCount;
    case "shim_print_glyph":
        return await printGlyph(... args);
    case "shim_display_nhwindow":
        if (args[0] === "WIN_MAP"){
            // console.log("--- GRID START ---\n");
            // console.log(grid.toString());
            // console.log("--- GRID END ---\n");
            return vision.input(grid);
        }

        return;
    case "shim_clear_nhwindow":
        // if (args[0] === "WIN_MAP") grid.clear();
        return;
    // case "shim_yn_function":
    //     // terminal.log(`shim_yn_function: ${name} ${args}`);
    //     terminal.message(args[0]);
    //     return await getch();
    // case "shim_putstr":
    //     // terminal.log(`shim_putstr: ${name} ${args}`);
    //     return terminal.message(args[2]);
    // case "shim_putmsghistory":
    // case "shim_raw_print":
    //     return terminal.message(args[0]);
    // case "shim_message_menu":
    //     return 121; // 'y'
    // case "shim_nhgetch":
    case "shim_nh_poskey":
        return awaitAction();
    case "shim_status_update":
        if (args[0] === "BL_FLUSH" ||
            args[0] === "BL_RESET" ||
            args[0] === "BL_CHARACTERISTICS") {
            return;
        }

        // warn(`shim_status_update: args ${args}`);
        warn(`shim_status_update: stat ${args[0]}, value ${args[1]}, value type ${typeof args[1]}`);
        return setIntrinsic(args[0], args[1]);
    case "shim_getmsghistory":
        return "";
    // case "shim_start_menu":
    //     return menuStart();
    // case "shim_select_menu":
    //     terminal.log(`MENU: ${name} ${args}`);
    //     break;
    // case "shim_add_menu":
    //     terminal.log(`shim_add_menu: ${args}`);
    //     return menuAdd(... args);
    // case "shim_end_menu":
    //     return menuEnd(... args);
    // case "shim_curs":
    //     return moveCursor(... args);
    // case "shim_player_selection":
    // case "shim_destroy_nhwindow":
    //     // TODO, but not urgent
    //     return;
    // case "shim_cliparound":
    // case "shim_get_nh_event":
    // case "shim_status_init":
    //     // ignore
    //     return;
    default:
        console.log(`callback: ${name} ${args}`);
        return 0;
    }
};

let grid = new Grid(80, 20, {
    serializer: function(val) {
        if (val === 0) {
            return " ";
        }

        return String.fromCharCode(val);
    },
});

// eslint-disable-next-line no-unused-vars, require-await
async function printGlyph(win, x, y, glyph, bkglyph) {
    let ret = globalThis.nethackGlobal.helpers.mapglyphHelper(glyph, x, y, 0);
    // console.log("ret", ret);
    // console.log("->>> ch", String.fromCharCode(ret.ch));
    grid[x][y] = ret.ch;
}

async function awaitAction() {
    await getAction();
    console.log("getAction done.");
    let ch = actionQueue.shift();
    // ch = ch || "j".charCodeAt(0);
    console.log("awaitAction ch:", ch);
    return ch;
}
