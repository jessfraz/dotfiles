#!/usr/bin/env node

/*jshint esversion: 8 */

const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const minimist = require("minimist");
const usage = require("./lib/usage");
const appinstall = require("./lib/appinstall");
const infoprompt = require("./lib/infoprompt");
var pjson = require('./package.json');

const allCommands = ["gen"];

var site = "https://start.jbpm.org/gen";
var dounzip = false;
var quickinstall = false;

clear();
console.log(
    chalk.yellow(
        figlet.textSync("JBA CLI", {
            horizontalLayout: "full"
        })
    )
);
console.log(chalk.red('Version ' + pjson.version));

const args = minimist(process.argv.slice(2));

if (args._.length != 1) {
    console.log(usage.showUsage());
} else {
    const cmd = args._[0];
    if (args.site) {
        site = args.site;
    }
    if (args.unzip) {
        dounzip = true;
    }
    if (args.quick) {
        quickinstall = true;
    }
    if (allCommands.indexOf(cmd) < 0) {
        console.log(usage.showUsage());
    } else {
        getAndGenerate(args, quickinstall, site, dounzip);
    }
}

async function getAndGenerate(args, quickinstall, site, dounzip, path, dothrow) {
    const defaultAppDetails = {
        capabilities: "bpm",
        packagename: "com.company",
        name: "business-application",
        version: "",
        options: ["kjar", "model", "service"]
    };

    var appDetails = {};
    if (quickinstall) {
        appDetails = defaultAppDetails;
        // if quickstart check of individual params
        // and overwrite defaults
        if (args.capabilities) {
            appDetails.capabilities = args.capabilities;
        }
        if (args.packagename) {
            appDetails.packagename = args.packagename;
        }
        if (args.name) {
            appDetails.name = args.name;
        }
        if (args.version) {
            appDetails.version = args.version;
        }
        if (args.options) {
            appDetails.options = args.options.split(",");
        }
    } else {
        appDetails = await infoprompt.askAppCredentials();
    }

    var haveKJar = false;
    var haveDKJar = false;
    if (appDetails.options.some(e => e === "kjar")) {
        haveKJar = true;
    }
    if (appDetails.options.some(e => e === "dkjar")) {
        haveDKJar = true;
    }

    if (haveKJar && haveDKJar) {
        appDetails.options.shift();
    }

    return await appinstall.getAndGenerate(site, dounzip, appDetails, path, dothrow);
}

module.exports.getAndGenerate = getAndGenerate;
module.exports.urlExists = appinstall.urlExists;