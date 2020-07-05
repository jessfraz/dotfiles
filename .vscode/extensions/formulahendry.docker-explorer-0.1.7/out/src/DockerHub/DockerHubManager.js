"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const vscode = require("vscode");
const DockerHubNode_1 = require("../Model/DockerHubNode");
const Entry_1 = require("../Model/Entry");
const Constants_1 = require("./Constants");
class DockerHubManager {
    constructor() {
        this._userName = "";
        this._password = "";
        this._token = "";
        if (DockerHubManager._instance) {
            throw new Error("Error: Invalid new DockerHubUserManager");
        }
        DockerHubManager._instance = this;
    }
    static get Instance() {
        return DockerHubManager._instance;
    }
    get userName() {
        return this._userName;
    }
    login(user, pwd) {
        return new Promise((resolve, reject) => {
            axios_1.default.post(Constants_1.Constants.LOGIN_URL, {
                username: user,
                password: pwd,
            })
                .then((response) => {
                if (response.data && response.data.token) {
                    this._userName = user;
                    this._token = response.data.token;
                    resolve();
                }
                else {
                    reject("Error: Login fail.");
                }
            })
                .catch((err) => {
                reject(err.message);
            });
        });
    }
    logout() {
        this._userName = "";
        this._password = "";
        this._token = "";
    }
    listRepositories() {
        return new Promise((resolve, reject) => {
            if (!this._token || this._token.length === 0) {
                return resolve([]);
            }
            const options = {
                headers: {
                    "Authorization": `JWT ${this._token}`,
                    "Content-Type": "application/json",
                },
            };
            axios_1.default.post(`${Constants_1.Constants.REPOSITORY_URL}/${this._userName}?${Constants_1.Constants.PAGE_SIZE}`, {}, options)
                .then((response) => {
                if (response.status === 200) {
                    const data = response.data;
                    if (data && data.results) {
                        const repos = [];
                        for (const result of data.results) {
                            repos.push(result.name);
                        }
                        if (repos.length === 0) {
                            vscode.window.showInformationMessage("No repositories found.");
                        }
                        return resolve(repos.map((repo) => new DockerHubNode_1.DockerHubNode(new Entry_1.Entry(repo, "r"), this._userName)));
                    }
                    else {
                        return reject("Error: Cannot parse the repositories from response.");
                    }
                }
                else {
                    return reject(`Error: ${response.statusText}, Response code: ${response.status}.`);
                }
            })
                .catch((err) => {
                return reject(err.message);
            });
        });
    }
    getTagsForRepo(repo) {
        return new Promise((resolve, reject) => {
            const options = {
                headers: {
                    "Authorization": `JWT ${this._token}`,
                    "Content-Type": "application/json",
                },
            };
            axios_1.default.post(`${Constants_1.Constants.REPOSITORY_URL}/${repo.path}/tags?${Constants_1.Constants.PAGE_SIZE}`, {}, options)
                .then((response) => {
                if (response.status === 200) {
                    const data = response.data;
                    if (data && data.results) {
                        const tags = [];
                        for (const result of data.results) {
                            tags.push(result.name);
                        }
                        return resolve(tags.map((tag) => new DockerHubNode_1.DockerHubNode(new Entry_1.Entry(tag, "i"), repo.path)));
                    }
                    else {
                        return reject("Error: Cannot parse the tags from response.");
                    }
                }
                else {
                    return reject(`Error: ${response.statusText}, Response code: ${response.status}.`);
                }
            })
                .catch((err) => {
                return reject(err.message);
            });
        });
    }
}
DockerHubManager._instance = new DockerHubManager();
exports.DockerHubManager = DockerHubManager;
//# sourceMappingURL=DockerHubManager.js.map