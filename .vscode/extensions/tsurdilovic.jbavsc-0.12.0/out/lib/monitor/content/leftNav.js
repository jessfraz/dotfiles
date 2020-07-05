"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getLeftNav(context, appState, media) {
    return `<nav class="col-md-2 d-none d-md-block bg-light sidebar">
          <div class="sidebar-sticky">
            <ul class="nav flex-column">
              <li class="nav-item">
                <a class="nav-link" href="#serverinfodiv">
                  <span><i class="fa fa-info-circle"></i></span>
                  <strong>Server Info</strong>
                </a>
              </li>
              <br/>
              <li class="nav-item">
                <a class="nav-link" href="#servercontainersdiv">
                  <span><i class="fa fa-th"></i></span>
                 <strong>Containers Info</strong>
                </a>
              </li>
              <br/>
              <li class="nav-item">
                <a class="nav-link" href="#processdefsdiv">
                  <span><i class="fa fa-file"></i></span>
                 <strong>Process Definitions</strong>
                </a>
              </li>
              <br/>
              <li class="nav-item">
                <a class="nav-link" href="#processinstdiv">
                  <span><i class="fa fa-cog"></i></span>
                 <strong>Active Processes</strong>
                </a>
              </li>
            </ul>
          </div>
        </nav>`;
}
exports.getLeftNav = getLeftNav;
//# sourceMappingURL=leftNav.js.map