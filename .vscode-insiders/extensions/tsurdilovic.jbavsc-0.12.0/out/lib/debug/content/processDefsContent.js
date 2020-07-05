"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getProcessDefsContent(context, appState, media) {
    return `
    <div class="card" id="processdefsdiv">
        <h5 class="card-header">
            <a data-toggle="collapse" href="#collapse-processdefs" aria-expanded="true" aria-controls="collapse-processdefsinfo" id="heading-processdefs" class="d-block">
                <i class="fa fa-chevron-down pull-right"></i>
                <i class="fa fa-file"></i>&nbsp;Process Definitions
            </a>
        </h5>
        <div id="collapse-processdefs" class="collapse show" aria-labelledby="heading-processdefs">
            <div class="card-body">
                <br/>
                <table class="table table-hover" id="processdefsinfotable">
                    <thead>
                        <tr>
                        <th scope="col">#</th>
                        <th scope="col">Id</th>
                        <th scope="col">GAV</th>
                        <th scope="col">Container</th>
                        <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="modal fade" id="pdefimgmodal" tabindex="-1" role="dialog" aria-labelledby="pdefimglabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="pdefimglabel">Process Definition Info</h5>
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
                                            <a class="nav-item nav-link active" id="pdef-img-tab" data-toggle="tab" href="#pdef-image" role="tab" aria-controls="pdef-image" aria-selected="true">Image</a>
                                            <a class="nav-item nav-link" id="pdef-vars-tab" data-toggle="tab" href="#pdef-vars" role="tab" aria-controls="pdef-vars" aria-selected="false">Variables</a>
                                        </div>
                                    </nav>
                                    <div class="tab-content" id="nav-tabContent">
                                        <div class="tab-pane fade show active" id="pdef-image" role="tabpanel" aria-labelledby="pdef-image-tab">
                                            <div class="iframe-container">
                                                <iframe id="pdefimgmodalframe" class="embed-responsive-item" src=""></iframe>
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="pdef-vars" role="tabpanel" aria-labelledby="pdef-vars-tab">
                                            <table class="table table-hover" id="processvarsinfotable">
                                                <thead>
                                                    <tr>
                                                    <th scope="col">#</th>
                                                    <th scope="col">Name</th>
                                                    <th scope="col">Type</th>
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

    <div class="modal fade" id="startprocessmodal" tabindex="-1" role="dialog" aria-labelledby="startprocesslabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="startprocesslabel">Start business process</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="iframe-container">
                        <iframe id="startprocessmodalframe" class="embed-responsive-item" src=""></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script id="processdefsinfo-template" type="text/x-handlebars-template">
        {{#each this}}
            <tr>
                <th scope="row"><small>{{ inc @index }}</small></th>
                <td><small>{{ process-id }}</small></td>
                <td><small>{{ package }}:{{ process-version }}:{{ process-name }}</small></td>
                <td><small>{{ container-id }}</small></td>
                <td><small>
                    <button type="button" id="pdef-view-{{ @index }}" class="btn btn-outline-primary btn-sm" data-pid="{{ process-id }}" data-cid="{{ container-id }}">Info</button>&nbsp;
                    <button type="button" id="pdef-start-{{ @index }}" class="btn btn-outline-success btn-sm" data-pid="{{ process-id }}" data-cid="{{ container-id }}">Start</button>
                </small></td>
            </tr>
        {{/each}}
    </script>
    
    <script id="processvarsinfo-template" type="text/x-handlebars-template">
        {{#each this}}
            <tr>
                <th scope="row">{{ inc @index }}</th>
                <td>{{ @key }}</td>
                <td>{{ this }}</td>
            </tr>
        {{/each}}
    </script>`;
}
exports.getProcessDefsContent = getProcessDefsContent;
//# sourceMappingURL=processDefsContent.js.map