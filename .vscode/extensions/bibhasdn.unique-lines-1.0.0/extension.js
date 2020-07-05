var vscode = require('vscode');

function activate(context) {
    var disposableKeepUnique = vscode.commands.registerCommand('unique-lines.keepUnique', function () {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var selection = editor.selection;
        var text = editor.document.getText(selection);
        var lines = text.split('\n')

        var unique_lines = [];
        lines.forEach(function(line) {
            if (unique_lines.indexOf(line) < 0) {
                unique_lines.push(line);
            }
        }, this);

        editor.edit(function (editBuilder) {
            editBuilder.replace(selection, unique_lines.join('\n'));
        });
    });

    var disposableShuffle = vscode.commands.registerCommand('unique-lines.shuffle', function () {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var selection = editor.selection;
        var text = editor.document.getText(selection);
        var lines = text.split('\n');

        if (lines[lines.length - 1] == "\n") {
            lines.splice(-1, 1);
        }

        var shuffled_lines = shuffleArray(lines)

        editor.edit(function (editBuilder) {
            editBuilder.replace(selection, shuffled_lines.join('\n'));
        });
    });

    context.subscriptions.push(disposableKeepUnique);
    context.subscriptions.push(disposableShuffle);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}