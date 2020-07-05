"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const native_1 = require("./native");
const { send, receive, join, leave } = native_1.methods;
class Server extends native_1.Socket {
    constructor(options) {
        super(12 /* Server */, options);
    }
}
exports.Server = Server;
Object.assign(Server.prototype, { send, receive });
class Client extends native_1.Socket {
    constructor(options) {
        super(13 /* Client */, options);
    }
}
exports.Client = Client;
Object.assign(Client.prototype, { send, receive });
class Radio extends native_1.Socket {
    constructor(options) {
        super(14 /* Radio */, options);
    }
}
exports.Radio = Radio;
Object.assign(Radio.prototype, { send });
class Dish extends native_1.Socket {
    constructor(options) {
        super(15 /* Dish */, options);
    }
    /* TODO: These methods might accept arrays in their C++ implementation for
       the sake of simplicity. */
    join(...values) {
        for (const value of values)
            join.call(this, value);
    }
    leave(...values) {
        for (const value of values)
            leave.call(this, value);
    }
}
exports.Dish = Dish;
Object.assign(Dish.prototype, { receive });
class Gather extends native_1.Socket {
    constructor(options) {
        super(16 /* Gather */, options);
    }
}
exports.Gather = Gather;
Object.assign(Gather.prototype, { receive });
class Scatter extends native_1.Socket {
    constructor(options) {
        super(17 /* Scatter */, options);
    }
}
exports.Scatter = Scatter;
Object.assign(Scatter.prototype, { send });
class Datagram extends native_1.Socket {
    constructor(options) {
        super(18 /* Datagram */, options);
    }
}
exports.Datagram = Datagram;
Object.assign(Datagram.prototype, { send, receive });
