"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getProcessErrorsContent(context, appState, media) {
    return `
    <div class="card" id="processerrorsdiv">
        <h5 class="card-header">
            <a data-toggle="collapse" href="#collapse-processerrors" aria-expanded="true" aria-controls="collapse-processerrorsinfo" id="heading-processerrors" class="d-block">
                <i class="fa fa-chevron-down pull-right"></i>
                <i class="fa fa-bug"></i>&nbsp;Process Errors
            </a>
        </h5>
        <div id="collapse-processerrors" class="collapse show" aria-labelledby="heading-processerrors">
            <div class="card-body">
                <br/>
                <table class="table table-hover" id="processerrorsinfotable">
                    <thead>
                        <tr>
                        <th scope="col">#</th>
                        <th scope="col">Instance ID</th>
                        <th scope="col">Process ID</th>
                        <th scope="col">In Activity</th>
                        <th scope="col">Error Message</th>
                        <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script id="processerrorsinfo-template" type="text/x-handlebars-template">
        {{#each this}}
            <tr>
                <th scope="row"><small>{{ inc @index }}</small></th>
                <td><small>{{ process-instance-id }}</small></td>
                <td><small>{{ process-id }}</small></td>
                <td><small>{{ activity-id }} - {{ activity-name }}</small></td>
                <td><small>{{ error-msg }}</small></td>
                <td><small>
                    <button type="button" id="perror-ack-{{ @index }}" class="btn btn-outline-primary btn-sm" data-cid="{{ container-id }}" data-errorid="{{ id }}">Ack</button>&nbsp;
                </small>
                </td>
            </tr>
        {{/each}}
    </script>
    `;
}
exports.getProcessErrorsContent = getProcessErrorsContent;
//# sourceMappingURL=processErrorsContent.js.map