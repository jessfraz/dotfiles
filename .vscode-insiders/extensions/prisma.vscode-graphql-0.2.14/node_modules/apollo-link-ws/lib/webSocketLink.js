"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var apollo_link_1 = require("apollo-link");
var subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
var WebSocketLink = (function (_super) {
    tslib_1.__extends(WebSocketLink, _super);
    function WebSocketLink(paramsOrClient) {
        var _this = _super.call(this) || this;
        if (paramsOrClient instanceof subscriptions_transport_ws_1.SubscriptionClient) {
            _this.subscriptionClient = paramsOrClient;
        }
        else {
            _this.subscriptionClient = new subscriptions_transport_ws_1.SubscriptionClient(paramsOrClient.uri, paramsOrClient.options, paramsOrClient.webSocketImpl);
        }
        return _this;
    }
    WebSocketLink.prototype.request = function (operation) {
        return this.subscriptionClient.request(operation);
    };
    return WebSocketLink;
}(apollo_link_1.ApolloLink));
exports.WebSocketLink = WebSocketLink;
//# sourceMappingURL=webSocketLink.js.map