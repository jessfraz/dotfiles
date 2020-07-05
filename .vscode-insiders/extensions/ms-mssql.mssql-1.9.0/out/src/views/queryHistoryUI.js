"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const Utils = require("../models/utils");
const question_1 = require("../prompts/question");
const LocalizedConstants = require("../constants/localizedConstants");
var QueryHistoryAction;
(function (QueryHistoryAction) {
    QueryHistoryAction[QueryHistoryAction["OpenQueryHistoryAction"] = 1] = "OpenQueryHistoryAction";
    QueryHistoryAction[QueryHistoryAction["RunQueryHistoryAction"] = 2] = "RunQueryHistoryAction";
})(QueryHistoryAction = exports.QueryHistoryAction || (exports.QueryHistoryAction = {}));
class QueryHistoryUI {
    constructor(_prompter, _vscodeWrapper) {
        this._prompter = _prompter;
        this._vscodeWrapper = _vscodeWrapper;
    }
    convertToQuickPickItem(node) {
        let historyNode = node;
        let quickPickItem = {
            label: Utils.limitStringSize(historyNode.queryString, true).trim(),
            detail: `${historyNode.connectionLabel}, ${historyNode.timeStamp.toLocaleString()}`,
            node: historyNode,
            action: undefined,
            picked: false
        };
        return quickPickItem;
    }
    showQueryHistoryActions(node) {
        let options = [{ label: LocalizedConstants.msgOpenQueryHistory },
            { label: LocalizedConstants.msgRunQueryHistory }];
        let question = {
            type: question_1.QuestionTypes.expand,
            name: 'question',
            message: LocalizedConstants.msgChooseQueryHistoryAction,
            choices: options
        };
        return this._prompter.promptSingle(question).then((answer) => {
            if (answer) {
                return answer.label;
            }
            return undefined;
        });
    }
    /**
     * Shows the Query History List on the command palette
     */
    showQueryHistoryCommandPalette(options) {
        let question = {
            type: question_1.QuestionTypes.expand,
            name: 'question',
            message: LocalizedConstants.msgChooseQueryHistory,
            choices: options
        };
        return this._prompter.promptSingle(question).then((answer) => {
            if (answer) {
                return this.showQueryHistoryActions(answer.node).then((actionAnswer) => {
                    if (actionAnswer === LocalizedConstants.msgOpenQueryHistory) {
                        answer.action = QueryHistoryAction.OpenQueryHistoryAction;
                    }
                    else if (actionAnswer === LocalizedConstants.msgRunQueryHistory) {
                        answer.action = QueryHistoryAction.RunQueryHistoryAction;
                    }
                    return answer;
                });
            }
            return undefined;
        });
    }
}
exports.QueryHistoryUI = QueryHistoryUI;

//# sourceMappingURL=queryHistoryUI.js.map
