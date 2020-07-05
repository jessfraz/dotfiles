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
                    <section id="tabs" class="project-tab">
                        <div class="container">
                            <div class="row">
                                <div class="col-md-12">
                                    <nav>
                                        <div class="nav nav-tabs nav-fill" id="nav-tab" role="tablist">
                                            <a class="nav-item nav-link active" id="pinst-img-tab" data-toggle="tab" href="#pinst-image" role="tab" aria-controls="pinst-image" aria-selected="true">Image</a>
                                            <a class="nav-item nav-link" id="pinst-vars-tab" data-toggle="tab" href="#pinst-vars" role="tab" aria-controls="pinst-vars" aria-selected="false">Variables</a>
                                        </div>
                                    </nav>
                                    <div class="tab-content" id="nav-tabContent">
                                        <div class="tab-pane fade show active" id="pinst-image" role="tabpanel" aria-labelledby="pinst-image-tab">
                                            <div class="iframe-container">
                                                <iframe id="pinstimgmodalframe" class="embed-responsive-item" src=""></iframe>
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="pinst-vars" role="tabpanel" aria-labelledby="pinst-vars-tab">
                                            <table class="table table-hover" id="processinstvarsinfotable">
                                                <thead>
                                                    <tr>
                                                    <th scope="col">#</th>
                                                    <th scope="col">Name</th>
                                                    <th scope="col">Value (click cell to edit)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="workontaskmodal" tabindex="-1" role="dialog" aria-labelledby="workontasklabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="workontasklabel">Complete active Task</h5>
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
                    <button type="button" id="pinst-view-{{ @index }}" class="btn btn-outline-primary btn-sm" data-pid="{{ process-instance-id }}" data-cid="{{ container-id }}" data-processid="{{ process-id }}">View</button>&nbsp;
                    <button type="button" id="pinst-abort-{{ @index }}" class="btn btn-outline-danger btn-sm bs-confirmation" data-toggle="confirmation" data-pid="{{ process-instance-id }}" data-cid="{{ container-id }}" data-processid="{{ process-id }}">Abort</button>
                </small>
                </td>
                <td><small>
                    {{#each active-user-tasks.task-summary}}
                        <button type="button" id="ptask-start-{{ @index }}" class="btn btn-outline-success btn-sm" data-tid="{{ task-id }}" data-cid="{{ task-container-id }}">{{ task-name }}</button>
                    {{/each}}
                </small></td>
            </tr>
        {{/each}}
    </script>
    
    <script id="processinstvarsinfo-template" type="text/x-handlebars-template">
        {{#each vars}}
            <tr>
                <th scope="row">{{ inc @index }}</th>
                <td>{{ @key }}</td>
                <td class="editPVar" data-vname="{{ @key }}" data-pid="{{ @root.pid }}" data-cid="{{ @root.cid }}">{{ this }}</td>
            </tr>
        {{/each}}
    </script>`;
}
exports.getProcessInstanceContent = getProcessInstanceContent;
//# sourceMappingURL=processInstancesContent.js.map