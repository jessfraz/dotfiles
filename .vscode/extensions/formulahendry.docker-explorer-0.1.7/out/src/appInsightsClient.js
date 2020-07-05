"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
const appInsights = require("applicationinsights");
class AppInsightsClient {
    static sendEvent(eventName, properties) {
        if (this._enableTelemetry) {
            this._client.trackEvent(eventName, properties);
        }
    }
}
AppInsightsClient._client = appInsights.getClient("067ba7db-9013-4f94-9d48-9338459bf259");
AppInsightsClient._enableTelemetry = utility_1.Utility.getConfiguration().get("enableTelemetry");
exports.AppInsightsClient = AppInsightsClient;
//# sourceMappingURL=appInsightsClient.js.map