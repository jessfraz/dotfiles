"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getServerContainersContent(context, appState, media) {
    return ` 
    <div class="card" id="servercontainersdiv">
        <h5 class="card-header">
            <a data-toggle="collapse" href="#collapse-servercontainers" aria-expanded="true" aria-controls="collapse-serverinfo" id="heading-servercontainers" class="d-block">
                <i class="fa fa-chevron-down pull-right"></i>
                <i class="fa fa-th"></i>&nbsp;Containers Info
            </a>
        </h5>
        <div id="collapse-servercontainers" class="collapse show" aria-labelledby="heading-servercontainers">
            <div class="card-body">
                <span id="containerInfo-dummy"></span>
                <br/>
                <table class="table table-hover" id="containersinfotable">
                    <thead>
                        <tr>
                        <th scope="col">#</th>
                        <th scope="col">Id</th>
                        <th scope="col">Alias</th>
                        <th scope="col">Strategy</th>
                        <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script id="containersinfo-template" type="text/x-handlebars-template">
        {{#each this}}
            <tr>
                <th scope="row"><small>{{ inc @index }}</small></th>
                <td><small>{{ container-id }}</small></td>
                <td><small>{{ container-alias }}</small></td>
                <td><small>{{ config-items.[3].itemValue }}</small></td>
                <td><small>{{ status }}</small></td>
            </tr>
        {{/each}}
    </script>`;
}
exports.getServerContainersContent = getServerContainersContent;
//# sourceMappingURL=containersInfoContent.js.map