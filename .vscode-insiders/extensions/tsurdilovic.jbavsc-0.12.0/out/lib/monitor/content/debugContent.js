"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serverInfoContent_1 = require("./serverInfoContent");
const containersInfoContent_1 = require("./containersInfoContent");
const processInstancesContent_1 = require("./processInstancesContent");
const processDefsContent_1 = require("./processDefsContent");
const leftNav_1 = require("./leftNav");
const scripts_1 = require("./scripts");
function getDebugContent(context, appState, media) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jBPM Business App Monitoring</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="${media.extcss}"> 
    <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.12/handlebars.min.js"></script>
</head>
<body>

<nav class="navbar navbar-light bg-light fixed-top flex-md-nowrap p-0">
      <span class="align-middle">
    &nbsp;&nbsp;&nbsp;<img src="${media.extlogo}" width="40" height="40" class="d-inline-block align-middle" alt="">
   <strong>jBPM Business App Monitor</strong> (${appState.url})
    </span>
    </nav>

<div class="container-fluid">
      <div class="row">
        ${leftNav_1.getLeftNav(context, appState, media)}

        <main role="main" class="col-md-9 ml-sm-auto col-lg-10 px-4">
            <div id="cannotconnectdiv" class="alert alert-danger" role="alert" style="display:none">
                Cannot contact ${appState.url}. Make sure your business app is started and has CORS enabled.
            </div>
            <br/>
            ${serverInfoContent_1.getServerInfoContent(context, appState, media)}
            <br/>
            ${containersInfoContent_1.getServerContainersContent(context, appState, media)}
            <br/>
            ${processDefsContent_1.getProcessDefsContent(context, appState, media)}
            <br/>
            ${processInstancesContent_1.getProcessInstanceContent(context, appState, media)}
            <br/>
        </main>
      </div>
</div>
${scripts_1.addScripts(context, appState, media)}
</body>
</html>`;
}
exports.getDebugContent = getDebugContent;
//# sourceMappingURL=debugContent.js.map