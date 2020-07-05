"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getServerInfoContent(context, appState, media) {
    return ` 
    <div class="card" id="serverinfodiv">
        <h5 class="card-header">
            <a data-toggle="collapse" href="#collapse-serverinfo" aria-expanded="true" aria-controls="collapse-serverinfo" id="heading-serverinfo" class="d-block">
                <i class="fa fa-chevron-down pull-right"></i>
                <i class="fa fa-file"></i>&nbsp;Server Info
            </a>
        </h5>
        <div id="collapse-serverinfo" class="collapse show" aria-labelledby="heading-serverinfo">
            <div class="card-body">
                <div class="row">
                    <div class="column">
                        <strong>ID: </strong><span id="serverInfo-serverid"></span><br/>
                        <strong>Name: </strong><span id="serverInfo-servername"></span><br/>
                        <strong>Version: </strong><span id="serverInfo-serverversion"></span><br/>
                    </div>
                    <div class="column">
                        <strong>Capabilities: </strong><span id="serverInfo-servercapabilities"></span><br/>
                        <strong>Location: </strong><span id="serverInfo-serverlocation"></span><br/>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}
exports.getServerInfoContent = getServerInfoContent;
//# sourceMappingURL=serverInfoContent.js.map