function showPreview(viewer, success, error, xml) {
    viewer.importXML(xml, function (err) {
        if (err) {
            error(err);
        } else {
            var canvas = viewer.get('canvas');
            canvas.zoom('fit-viewport');
            success();
        }
    });
}

function previewError(err) {
    $("#cannotpreviewdiv").show();
    $("#savesvg").prop("disabled", true);
    vscode.postMessage({
        command: "alert",
        text: "Unable to preview process: " + err
    });
}

function previewSuccess() {
    $("#cannotpreviewdiv").hide();
    $("#savesvg").prop("disabled", false);
    vscode.postMessage({
        command: "info",
        text: "Sucess parsing process source."
    });
}