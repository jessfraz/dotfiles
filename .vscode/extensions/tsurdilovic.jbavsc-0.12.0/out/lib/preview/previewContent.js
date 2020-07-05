"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getPreviewContent(context, previewState, media) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Process Preview</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="${media.extcss}">
    <link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js"></script>
</head>
<body>

<div class="container-fluid" class="preview">
    <div class="row">
        <nav class="navbar navbar-light bg-light fixed-top flex-md-nowrap p-0">
            <div class="pull-left">
                <span class="align-middle">
                &nbsp;&nbsp;&nbsp;<img src="${media.extlogo}" width="40" height="40" class="d-inline-block align-middle" alt="">
            <strong>Process Preview - </strong> (${previewState.uri.path.replace(/^.*[\\\/]/, "")})
                </span>
            </div>
            <div class="pull-right">
                <button id="savesvg" type="button" class="btn btn-secondary btn-sm">Save Process SVG</button>&nbsp;&nbsp;&nbsp;
            </div>
        </nav>
    </div>
    <div class="row preview">
        <div id="cannotpreviewdiv" class="alert alert-danger" role="alert" style="display:none">
              Unable to preview process ${previewState.uri.path.replace(/^.*[\\\/]/, "")}      
        </div>
        <div id="canvas" style="width: 100%"></div>
    </div>
</div>
<script>
var vscode = acquireVsCodeApi();
$(document).ready(function() {

    var viewer = new BpmnJS({
        container: $('#canvas')
    });

    showPreview(viewer, previewSuccess, previewError, "${previewState.content}");
    
    $("#savesvg").button().click(function() {
        viewer.saveSVG(function(err, processsvg) {
            if(err) {
                vscode.postMessage({
                    command: "alert",
                    text: "Unable to get process svg: " + err
                });
            } else {
                vscode.postMessage({
                    command: 'savesvg',
                    svg: processsvg,
                    filename: '${previewState.processdirpath}${previewState.processid}' + '-svg.svg'
                });
            }
        });
    });

});   
</script>
<script src="https://unpkg.com/bpmn-js@3.1.0/dist/bpmn-viewer.development.js"></script>
<script src="${media.extpreviewjs}"></script>
    `;
}
exports.getPreviewContent = getPreviewContent;
//# sourceMappingURL=previewContent.js.map