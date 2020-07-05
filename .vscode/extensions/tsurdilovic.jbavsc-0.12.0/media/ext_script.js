function debugCheck(url) {
    checkAppIsRunning(url, function (running) {
        if (running) {
            $("#cannotconnectdiv").hide();
            getMonitoringData();
        } else {
            $("#cannotconnectdiv").show();
            clearMonitoringData();
        }
    });
}

function checkAppIsRunning(url, callback) {
    $.ajax({
        type: "HEAD",
        url: url,
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            Authorization: "Basic " + btoa(restUsername + ":" + restPassword)
        },
        success: function () {
            callback(true);
        },
        error: function () {
            callback(false);
        }
    });
}

function appRestGetCall(url, callback, atype) {
    if (!atype) {
        atype = "GET";
    }
    $.ajax({
        type: atype,
        url: url,
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        headers: {
            "Access-Control-Allow-Origin": "*",
            Accept: "application/json",
            Authorization: "Basic " + btoa(restUsername + ":" + restPassword)
        },
        complete: function (data) {
            callback(data);
        },
        error: function (error) {
            callback(error);
        }
    });
}

function viewProcessDef(pid, cid) {
    var defsurl =
        restUrl + "rest/server/containers/" + cid + "/images/processes/" + pid;

    // get process variables
    appRestGetCall(
        restUrl +
        "rest/server/containers/" +
        cid +
        "/processes/definitions/" +
        pid +
        "/variables",
        function (data) {
            if (data) {
                var processvarsTemplateSource = document.getElementById(
                    "processvarsinfo-template"
                ).innerHTML;
                var processvarsTemplate = Handlebars.compile(
                    processvarsTemplateSource
                );
                $("#processvarsinfotable tbody").html(
                    processvarsTemplate(data.responseJSON.variables)
                );
            }
        }
    );

    $("#pdefimgmodalframe").attr("src", defsurl);
    $("#pdefimgmodal").modal("show");
}

function viewProcessInst(pid, cid, processid) {
    var insturl =
        restUrl +
        "rest/server/containers/" +
        cid +
        "/images/processes/instances/" +
        pid;

    // get process instance variables
    appRestGetCall(
        restUrl +
        "rest/server/containers/" +
        cid +
        "/processes/instances/" +
        pid +
        "/variables",
        function (data) {
            if (data) {
                var customData = {};
                customData.pid = pid;
                customData.cid = cid;
                customData.vars = data.responseJSON;

                var processinstvarsTemplateSource = document.getElementById(
                    "processinstvarsinfo-template"
                ).innerHTML;
                var processinstvarsTemplate = Handlebars.compile(
                    processinstvarsTemplateSource
                );
                $("#processinstvarsinfotable tbody").html(
                    processinstvarsTemplate(customData)
                );
            }
        }
    );

    $("#pinstimgmodalframe").attr("src", insturl);
    $("#pinstimgmodal").modal("show");
}

function abortProcessInst(pid, cid, processid) {
    appRestGetCall(
        restUrl +
        "rest/server/containers/" +
        cid +
        "/processes/instances/" +
        pid,
        function (data) {
            getMonitoringData();
        },
        "DELETE"
    );
}

function startProcessDef(pid, cid) {
    var pformurl =
        restUrl +
        "rest/server/containers/" +
        cid +
        "/forms/processes/" +
        pid +
        "/content?renderer=bootstrap ";
    $("#startprocessmodalframe").attr("src", pformurl);
    $("#startprocessmodal").modal("show");
}

function workOnActiveTask(tid, cid) {
    var tformurl =
        restUrl +
        "rest/server/containers/" +
        cid +
        "/forms/tasks/" +
        tid +
        "/content?renderer=bootstrap";
    $("#workontaskmodalframe").attr("src", tformurl);
    $("#workontaskmodal").modal("show");
}

function ackProcessError(cid, eid) {
    appRestGetCall(
        restUrl +
        "rest/server/admin/containers/" +
        cid +
        "/processes/errors/" +
        eid,
        function (data) {
            getMonitoringData();
        },
        "PUT"
    );
}

function updateProcessVarValue(varname, pid, cid, newvalue) {
    $.ajax({
        type: "POST",
        url: restUrl +
            "rest/server/containers/" +
            cid +
            "/processes/instances/" +
            pid +
            "/variables/",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({
            [varname]: newvalue
        }),
        headers: {
            "Access-Control-Allow-Origin": "*",
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Basic " + btoa(restUsername + ":" + restPassword)
        },
        complete: function (data) {
            return true;
        },
        error: function (error) {
            return false;
        }
    });
}

// clears monitoring data
function clearMonitoringData() {
    // server info
    $("#serverInfo-serverid").text("");
    $("#serverInfo-servername").text("");
    $("#serverInfo-serverversion").text("");
    $("#serverInfo-servercapabilities").text("");
    $("#serverInfo-serverlocation").text("");

    // containers info
    var containersTemplateSource = document.getElementById(
        "containersinfo-template"
    ).innerHTML;
    var containersTemplate = Handlebars.compile(
        containersTemplateSource
    );
    $("#containersinfotable tbody").html(
        containersTemplate([])
    );

    // process defs
    var processdefsTemplateSource = document.getElementById(
        "processdefsinfo-template"
    ).innerHTML;
    var processdefsTemplate = Handlebars.compile(
        processdefsTemplateSource
    );
    $("#processdefsinfotable tbody").html(
        processdefsTemplate([])
    );

    // process instances
    var processinstTemplateSource = document.getElementById(
        "processinstinfo-template"
    ).innerHTML;
    var processinstTemplate = Handlebars.compile(
        processinstTemplateSource
    );
    $(
        "#processinstinfotable tbody"
    ).html(
        processinstTemplate(
            []
        )
    );

    // processing errors
    processerrorsTemplateSource = document.getElementById(
        "processerrorsinfo-template"
    ).innerHTML;
    processerrorsTemplate = Handlebars.compile(
        processerrorsTemplateSource
    );
    $("#processerrorsinfotable tbody").html(
        processerrorsTemplate({})
    );
}

// main function to retrieve data
function getMonitoringData() {
    // get server info
    appRestGetCall(restUrl + "rest/server", function (data) {
        if (data) {
            $("#serverInfo-serverid").text(
                data.responseJSON.result["kie-server-info"].id
            );
            $("#serverInfo-servername").text(
                data.responseJSON.result["kie-server-info"].name
            );
            $("#serverInfo-serverversion").text(
                data.responseJSON.result["kie-server-info"].version
            );

            var capabilities =
                data.responseJSON.result["kie-server-info"].capabilities;
            var capabilitiesdisp = "";
            capabilities.map(capability => {
                capabilitiesdisp += capability + " ";
            });
            $("#serverInfo-servercapabilities").text(capabilitiesdisp);

            $("#serverInfo-serverlocation").text(
                data.responseJSON.result["kie-server-info"].location
            );
        } else {
            vscode.postMessage({
                command: "alert",
                text: "Unable to retrieve server info"
            });
        }
    });

    // get containers info
    appRestGetCall(restUrl + "rest/server/containers", function (data) {
        if (data) {
            var containersdata =
                data.responseJSON.result["kie-containers"]["kie-container"];
            var containersTemplateSource = document.getElementById(
                "containersinfo-template"
            ).innerHTML;
            var containersTemplate = Handlebars.compile(
                containersTemplateSource
            );
            $("#containersinfotable tbody").html(
                containersTemplate(containersdata)
            );

            var allDefs = [];
            var allInst = [];
            containersdata.map(container => {
                // get process defs for each container instance
                appRestGetCall(
                    restUrl +
                    "rest/server/containers/" +
                    container["container-id"] +
                    "/processes ",
                    function (data) {
                        if (data) {
                            data.responseJSON.processes.map(processdef => {
                                allDefs.push(processdef);
                            });

                            if (allDefs.length > 0) {
                                var processdefsTemplateSource = document.getElementById(
                                    "processdefsinfo-template"
                                ).innerHTML;
                                var processdefsTemplate = Handlebars.compile(
                                    processdefsTemplateSource
                                );
                                $("#processdefsinfotable tbody").html(
                                    processdefsTemplate(allDefs)
                                );

                                // event handlers have to reattach after handlebars updates dom
                                // process defs view
                                $("button[id^='pdef-view']").click(function () {
                                    viewProcessDef(
                                        $(this).data("pid"),
                                        $(this).data("cid")
                                    );
                                });

                                // process defs start
                                $("button[id^='pdef-start']").click(function () {
                                    startProcessDef(
                                        $(this).data("pid"),
                                        $(this).data("cid")
                                    );
                                });
                            } else {
                                vscode.postMessage({
                                    command: "alert",
                                    text: "No Process Definitions available"
                                });
                            }
                        }
                    }
                );

                // get process instances for each container instance
                appRestGetCall(
                    restUrl +
                    "rest/server/containers/" +
                    container["container-id"] +
                    "/processes/instances",
                    function (data) {
                        if (data) {
                            data.responseJSON["process-instance"].map(
                                processinst => {
                                    allInst.push(processinst);
                                }
                            );

                            if (allInst.length > 0) {
                                var updatedInst = [];
                                allInst.map(inst => {
                                    appRestGetCall(
                                        restUrl +
                                        "rest/server/containers/" +
                                        container["container-id"] +
                                        "/processes/instances/" +
                                        inst["process-instance-id"],
                                        function (data) {
                                            if (data) {
                                                updatedInst.push(
                                                    data.responseJSON
                                                );

                                                var processinstTemplateSource = document.getElementById(
                                                    "processinstinfo-template"
                                                ).innerHTML;
                                                var processinstTemplate = Handlebars.compile(
                                                    processinstTemplateSource
                                                );
                                                $(
                                                    "#processinstinfotable tbody"
                                                ).html(
                                                    processinstTemplate(
                                                        updatedInst
                                                    )
                                                );

                                                // event handlers have to reattach after handlebars updates dom
                                                // process inst view
                                                $(
                                                    "button[id^='pinst-view']"
                                                ).click(function () {
                                                    viewProcessInst(
                                                        $(this).data("pid"),
                                                        $(this).data("cid"),
                                                        $(this).data(
                                                            "processid"
                                                        )
                                                    );
                                                });

                                                // abort inst
                                                $(
                                                    ".bs-confirmation"
                                                ).confirmation();
                                                $(
                                                    "button[id^='pinst-abort']"
                                                ).on(
                                                    "confirmed.bs.confirmation",
                                                    function () {
                                                        abortProcessInst(
                                                            $(this).data("pid"),
                                                            $(this).data("cid"),
                                                            $(this).data(
                                                                "processid"
                                                            )
                                                        );
                                                    }
                                                );

                                                // task instance start
                                                $(
                                                    "button[id^='ptask-start']"
                                                ).click(function () {
                                                    workOnActiveTask(
                                                        $(this).data("tid"),
                                                        $(this).data("cid")
                                                    );
                                                });
                                            }
                                        }
                                    );
                                });
                            } else {
                                // still gotta update with empty data, in case there was before
                                var processinstTemplateSource = document.getElementById(
                                    "processinstinfo-template"
                                ).innerHTML;
                                var processinstTemplate = Handlebars.compile(
                                    processinstTemplateSource
                                );
                                $("#processinstinfotable tbody").html(
                                    processinstTemplate([])
                                );
                            }
                        }
                    }
                );

                // get processing errors
                appRestGetCall(
                    restUrl +
                    "rest/server/admin/containers/" +
                    container["container-id"] +
                    "/processes/errors",
                    function (data) {
                        var processerrorsTemplateSource, processerrorsTemplate;
                        if (data) {
                            processerrorsTemplateSource = document.getElementById(
                                "processerrorsinfo-template"
                            ).innerHTML;
                            processerrorsTemplate = Handlebars.compile(
                                processerrorsTemplateSource
                            );
                            $("#processerrorsinfotable tbody").html(
                                processerrorsTemplate(
                                    data.responseJSON["error-instance"]
                                )
                            );

                            // event handlers have to reattach after handlebars updates dom
                            // process error ack
                            $("button[id^='perror-ack']").click(function () {
                                ackProcessError(
                                    $(this).data("cid"),
                                    $(this).data("errorid")
                                );
                            });
                        } else {
                            // still gotta update with empty data, in case there was before
                            processerrorsTemplateSource = document.getElementById(
                                "processerrorsinfo-template"
                            ).innerHTML;
                            processerrorsTemplate = Handlebars.compile(
                                processerrorsTemplateSource
                            );
                            $("#processerrorsinfotable tbody").html(
                                processerrorsTemplate([])
                            );
                        }
                    },
                    "GET"
                );
            });
        } else {
            vscode.postMessage({
                command: "alert",
                text: "Unable to retrieve container info"
            });
        }
    });
}