const vscode = require("vscode");
const exec = require('child_process').exec;

// 在插件被激活的时候，这个方法会被调用
function activate(context) {
    var disposable = vscode.commands.registerCommand('extension.ToChrome', startChrome);
    context.subscriptions.push(disposable);
}
function startChrome() {
    try {
        if (!open) {
            vscode.window.showErrorMessage('无法启动-没有找到打开函数（抱歉）。');
            return;
        }
        var activeEditor = vscode.window.activeTextEditor;
       
        if (activeEditor != null) {
            var filePath = activeEditor.document.fileName;
            var workspace = vscode.workspace.rootPath;
            var strw=/[\S]*\\([^\\]*)$/;
            var worke=workspace.replace(strw,'$1');
            var endPath =filePath.replace(workspace,'');
            spawnOpenChrome('http://'+worke+endPath);
            return;
        }
        var workspace = vscode.workspace.rootPath;
        if (!workspace) {
            return;
        }
        strw=/[\S]*\\([^\\]*)$/;
        workspace=workspace.replace(strw,'$1');
        spawnOpenChrome('http://'+workspace);
    }
    catch (e) {
        var errorMessage = '对不起, 打开chrome出错.';
        console.error(errorMessage + e);
        vscode.window.showErrorMessage(errorMessage + '详细内容见vscode日志。');
    }
}

function spawnOpenChrome(activateOnPath) {
    if (!activateOnPath || activateOnPath.length == 0) {
        return false;
    }
    open(activateOnPath, 'chrome');
    console.log('chrome started @ "' + activateOnPath + '"');
    return true;
}

function open(target, appName, callback) {
    var opener;
  
    if (typeof(appName) === 'function') {
      callback = appName;
      appName = null;
    }
  
    switch (process.platform) {
    case 'darwin':
      if (appName) {
        opener = 'open -a "' + escape(appName) + '"';
      } else {
        opener = 'open';
      }
      break;
    case 'win32':
        if (appName) {
        opener = 'start "" "' + escape(appName) + '"';
      } else {
        opener = 'start ""';
      }
      break;
    default:
      if (appName) {
        opener = escape(appName);
      } else {
        // use Portlands xdg-open everywhere else
        opener = path.join(__dirname, './xdg-open');
      }
      break;
    }
  
    if (process.env.SUDO_USER) {
      opener = 'sudo -u ' + process.env.SUDO_USER + ' ' + opener;
    }
    return exec(opener + ' "' + escape(target) + '"', callback);
}
  
function escape(s) {
    return s.replace(/"/g, '\\\"');
}
exports.activate = activate;
//当您的扩展被停用时调用此方法
function deactivate() {
}
exports.deactivate = deactivate;