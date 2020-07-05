"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getProcessInstanceContent(context, appState, media) {
    return `
    <div class="card" id="processinstdiv">
        <h5 class="card-header">
            <a data-toggle="collapse" href="#collapse-processinst" aria-expanded="true" aria-controls="collapse-processinstinfo" id="heading-processinst" class="d-block">
                <i class="fa fa-chevron-down pull-right"></i>
                <i class="fa fa-cog"></i>&nbsp;Active Processes
            </a>
        </h5>
        <div id="collapse-processinst" class="collapse show" aria-labelledby="heading-processinst">
            <div class="card-body">
                <br/>
                <table class="table table-hover" id="processinstinfotable">
                    <thead>
                        <tr>
                        <th scope="col">#</th>
                        <th scope="col">Id</th>
                        <th scope="col">Name</th>
                        <th scope="col">Version</th>
                        <th scope="col">Actions</th>
                        <th scope="col">Active Tasks</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>


    <div class="modal fade" id="pinstimgmodal" tabindex="-1" role="dialog" aria-labelledby="pinstimglabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="pinstimglabel">Process Instance Image</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="iframe-container">
                        <iframe id="pinstimgmodalframe" class="embed-responsive-item" src=""></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="workontaskmodal" tabindex="-1" role="dialog" aria-labelledby="workontasklabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="workontasklabel">Start business process</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="iframe-container">
                        <iframe id="workontaskmodalframe" class="embed-responsive-item" src=""></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script id="processinstinfo-template" type="text/x-handlebars-template">
        {{#each this}}
            <tr>
                <th scope="row"><small>{{ inc @index }}</small></th>
                <td><small>{{ process-instance-id }}</small></td>
                <td><small>{{ process-name }}</small></td>
                <td><small>{{ process-version }}</small></td>
                <td><small>
                    <button type="button" id="pinst-view-{{ @index }}" class="btn btn-outline-primary btn-sm" data-pid="{{ process-instance-id }}" data-cid="{{ container-id }}" data-processid="{{ process-id }}">View</button>
                </small>
                </td>
                <td><small>
                    {{#each active-user-tasks.task-summary}}
                        <button type="button" id="ptask-start-{{ @index }}" class="btn btn-outline-success btn-sm" data-tid="{{ task-id }}" data-cid="{{ task-container-id }}">{{ task-name }}</button>
                    {{/each}}
                </small></td>
            </tr>
        {{/each}}
    </script>`;
}
exports.getProcessInstanceContent = getProcessInstanceContent;
//# sourceMappingURL=processInstancesContent.js.map