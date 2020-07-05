import { __extends } from 'tslib';
import { ApolloLink } from 'apollo-link';
import { SubscriptionClient } from 'subscriptions-transport-ws';

var WebSocketLink = (function (_super) {
    __extends(WebSocketLink, _super);
    function WebSocketLink(paramsOrClient) {
        var _this = _super.call(this) || this;
        if (paramsOrClient instanceof SubscriptionClient) {
            _this.subscriptionClient = paramsOrClient;
        }
        else {
            _this.subscriptionClient = new SubscriptionClient(paramsOrClient.uri, paramsOrClient.options, paramsOrClient.webSocketImpl);
        }
        return _this;
    }
    WebSocketLink.prototype.request = function (operation) {
        return this.subscriptionClient.request(operation);
    };
    return WebSocketLink;
}(ApolloLink));

export { WebSocketLink };
//# sourceMappingURL=bundle.esm.js.map
