"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function addScripts(context, appState, media) {
    return `
    <script>
        const vscode = acquireVsCodeApi();

        $(document).ready(function() {
            // handlebars helpers
            Handlebars.registerHelper("inc", function(value, options) {
                return parseInt(value) + 1;
            });

            // nav links click
            $(".appnavlink").click(function(e) {
                e.preventDefault();
                var aid = $(this).attr("href");
                $('html,body').animate({scrollTop: $(aid).offset().top},'slow');
            });

            // refresh info when modals are hidden
            $("#startprocessmodal").on("hide.bs.modal", function () {
                getMonitoringData();
            });

            $("#workontaskmodal").on("hide.bs.modal", function () {
                getMonitoringData();
            });

            // first check if app is running
            checkAppIsRunning("${appState.url}rest/server", function(running) {
                if(running) {
                    $("#cannotconnectdiv").hide();
                    getMonitoringData();
                } else {
                    $("#cannotconnectdiv").show();
                }
            });
        });    

        function checkAppIsRunning(url, callback){
            $.ajax({
                type: "HEAD",
                url: url,
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                },
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type':'application/json',
                    'Authorization': 'Basic ' + btoa('${appState.username}:${appState.password}')
                },
                success: function() {
                    callback(true);
                },
                error: function() {
                    callback(false);
                }
            });
        }

        function appRestGetCall(url, callback){
            $.ajax({
                type: "GET",
                url: url,
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                },
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + btoa('${appState.username}:${appState.password}')
                },
                complete: function(data) {
                    callback(data);
                },
                error: function(error) {
                    callback(error);
                }
            });
        }

        function viewProcessDef(pid, cid) {
            var defsurl = "${appState.url}rest/server/containers/" + cid + "/images/processes/" + pid;
            
            // get process variables
            appRestGetCall("${appState.url}rest/server/containers/" + cid + "/processes/definitions/" + pid + "/variables", function(data) {
                if(data) {
                    var processvarsTemplateSource = document.getElementById("processvarsinfo-template").innerHTML;
                    var processvarsTemplate = Handlebars.compile(processvarsTemplateSource);   
                    $('#processvarsinfotable tbody').html(processvarsTemplate(data.responseJSON.variables));
                }
            });

            $("#pdefimgmodalframe").attr('src', defsurl);
            $('#pdefimgmodal').modal('show');
        }

        function viewProcessInst(pid, cid, processid) {
            var insturl = "${appState.url}rest/server/containers/" + cid + "/images/processes/instances/" + pid;
            $("#pinstimgmodalframe").attr('src', insturl);
            $('#pinstimgmodal').modal('show');
        }

        function startProcessDef(pid, cid) {
            var pformurl = "${appState.url}rest/server/containers/" + cid + "/forms/processes/" + pid + "/content?renderer=bootstrap";
             $("#startprocessmodalframe").attr('src', pformurl);
             $('#startprocessmodal').modal('show');
        }

        function workOnActiveTask(tid, cid) {
            var tformurl = "${appState.url}rest/server/containers/" + cid + "/forms/tasks/" + tid + "/content?renderer=bootstrap";
             $("#workontaskmodalframe").attr('src', tformurl);
             $('#workontaskmodal').modal('show');
        }

        // main function to retrieve data
        function getMonitoringData() {
            // get server info
            appRestGetCall("${appState.url}rest/server", function(data) {
                if(data) {
                    $('#serverInfo-serverid').text(data.responseJSON.result["kie-server-info"].id);
                    $('#serverInfo-servername').text(data.responseJSON.result["kie-server-info"].name);
                    $('#serverInfo-serverversion').text(data.responseJSON.result["kie-server-info"].version);

                    var capabilities = data.responseJSON.result["kie-server-info"].capabilities;
                    var capabilitiesdisp = "";
                    capabilities.map(capability => {
                        capabilitiesdisp += capability + " ";
                    });
                    $('#serverInfo-servercapabilities').text(capabilitiesdisp);
                    
                     $('#serverInfo-serverlocation').text(data.responseJSON.result["kie-server-info"].location);
                } else {
                    vscode.postMessage({
                        command: 'alert',
                        text: "Unable to retrieve server info"
                    });
                }
            });

            // get containers info
            appRestGetCall("${appState.url}rest/server/containers", function(data) {
                if(data) {
                    var containersdata = data.responseJSON.result["kie-containers"]["kie-container"];
                    var containersTemplateSource = document.getElementById("containersinfo-template").innerHTML;
                    var containersTemplate = Handlebars.compile(containersTemplateSource);   
                    $('#containersinfotable tbody').html(containersTemplate(containersdata));

                    var allDefs = [];
                    var allInst = [];
                    containersdata.map(container => {
                    
                        // get process defs for each container instance
                        appRestGetCall("${appState.url}rest/server/containers/" + container["container-id"] + "/processes", function(data) {
                            if(data) {
                                
                                data.responseJSON.processes.map(processdef => {
                                    allDefs.push(processdef);
                                });
                        
                                if(allDefs.length > 0) {   
                                    var processdefsTemplateSource = document.getElementById("processdefsinfo-template").innerHTML;
                                    var processdefsTemplate = Handlebars.compile(processdefsTemplateSource);   
                                    $('#processdefsinfotable tbody').html(processdefsTemplate(allDefs));

                                    // event handlers have to reattach after handlebars updates dom
                                    // process defs view
                                    $("button[id^='pdef-view']").click(function() {
                                        viewProcessDef($(this).data('pid'), $(this).data('cid'));
                                    });

                                    // process defs start
                                    $("button[id^='pdef-start']").click(function() {
                                        startProcessDef($(this).data('pid'), $(this).data('cid'));
                                    });
                                } else {
                                    vscode.postMessage({
                                        command: 'alert',
                                        text: "No Process Definitions available"
                                    });
                                }

                            }
                        });

                        // get process instances for each container instance
                        appRestGetCall("${appState.url}rest/server/containers/" + container["container-id"] + "/processes/instances", function(data) {
                            if(data) {
                                
                                data.responseJSON["process-instance"].map(processinst => {
                                    allInst.push(processinst);
                                });

                                if(allInst.length > 0) {
                                    var updatedInst = [];
                                    allInst.map(inst => {
                                        appRestGetCall("${appState.url}rest/server/containers/" + container["container-id"] + "/processes/instances/" + inst["process-instance-id"], function(data) {
                                            if(data) {
                                                updatedInst.push(data.responseJSON);

                                                var processinstTemplateSource = document.getElementById("processinstinfo-template").innerHTML;
                                                var processinstTemplate = Handlebars.compile(processinstTemplateSource);   
                                                $('#processinstinfotable tbody').html(processinstTemplate(updatedInst));

                                                // event handlers have to reattach after handlebars updates dom
                                                // process inst view
                                                $("button[id^='pinst-view']").click(function() {
                                                    viewProcessInst($(this).data('pid'), $(this).data('cid'), $(this).data('processid'));
                                                });

                                                // task instance start
                                                $("button[id^='ptask-start']").click(function() {
                                                    workOnActiveTask($(this).data('tid'), $(this).data('cid'));
                                                });
                                            }
                                        });

                                    });
                                } else {
                                    // still gotta update with empty data, in case there was before
                                    var processinstTemplateSource = document.getElementById("processinstinfo-template").innerHTML;
                                    var processinstTemplate = Handlebars.compile(processinstTemplateSource);   
                                    $('#processinstinfotable tbody').html(processinstTemplate([]));
                                }
                            }
                        });
                        
                    });
                } else {
                    vscode.postMessage({
                        command: 'alert',
                        text: "Unable to retrieve container info"
                    });
                }
            });
        }
    </script>`;
}
exports.addScripts = addScripts;
//# sourceMappingURL=scripts.js.map