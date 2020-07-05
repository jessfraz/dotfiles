/*jshint esversion: 6 */

const request = require("request");
const fs = require("fs");
const afterinstall = require("./afterinstall");
const admZip = require("adm-zip");
const systempath = require("path");
const chalk = require("chalk");

var self = (module.exports = {
	getAndGenerate: (appurl, dounzip, appdetails, path, dothrow) => {
		console.log(
			"\nGenerating your jBPM Business App ZIP using " + appurl + "...."
		);

		if (!path) {
			path = process.cwd() + systempath.sep;
		} else {
			path += systempath.sep;
		}

		self.urlExists(appurl, function (err, exists) {
			if (exists) {
				request({
							url: appurl,
							method: "POST",
							body: JSON.stringify(appdetails),
							headers: {
								"Content-Type": "application/json"
							},
							rejectUnauthorized: false
						},
						function (error, response, body) {
							if (error != null) {
								console.log("Error performing request:" + error);
							}
						}
					)
					.pipe(fs.createWriteStream(path + appdetails.name + ".zip"))
					.on("finish", function () {
						console.log("done");
						if (dounzip) {
							console.log(
								"\nUnzipping your jBPM Business App....."
							);
							self.doTheUnzip(
								path + appdetails.name + ".zip",
								path
							);
							console.log("done");
						}

						console.log(afterinstall.afterUsage());
						return true;
					});
			} else {
				console.log(chalk.red("Cannot generate application:"));
				console.log(
					chalk.red(
						"Unable to contact " +
						appurl +
						". Check if you are online!"
					)
				);
				if (typeof dothrow !== "undefined") {
					if (dothrow) {
						throw "Cannot generate application. Make sure you are online!";
					}
				}
				return false;
			}
		});
	},
	doTheUnzip: (zipfile, path) => {
		var zip = new admZip(zipfile);
		zip.extractAllTo(path, true);
	},
	urlExists: (url, cb) => {
		request({
				url: url,
				method: "POST",
				body: JSON.stringify({}),
				headers: {
					"Content-Type": "application/json"
				},
				rejectUnauthorized: false
			},
			function (err, res) {
				if (err) return cb(null, false);
				cb(null, /4\d\d/.test(res.statusCode) === false);
			}
		);
	}
});