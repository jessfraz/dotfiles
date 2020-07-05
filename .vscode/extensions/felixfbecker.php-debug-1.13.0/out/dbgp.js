"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const iconv = require("iconv-lite");
const xmldom_1 = require("xmldom");
/** The encoding all XDebug messages are encoded with */
exports.ENCODING = 'iso-8859-1';
/** The two states the connection switches between */
var ParsingState;
(function (ParsingState) {
    ParsingState[ParsingState["DataLength"] = 0] = "DataLength";
    ParsingState[ParsingState["Response"] = 1] = "Response";
})(ParsingState || (ParsingState = {}));
/** Wraps the NodeJS Socket and calls handleResponse() whenever a full response arrives */
class DbgpConnection extends events_1.EventEmitter {
    constructor(socket) {
        super();
        this._socket = socket;
        this._parsingState = ParsingState.DataLength;
        this._chunksDataLength = 0;
        this._chunks = [];
        socket.on('data', (data) => this._handleDataChunk(data));
        socket.on('error', (error) => this.emit('error', error));
        socket.on('close', () => this.emit('close'));
    }
    _handleDataChunk(data) {
        // Anatomy of packets: [data length] [NULL] [xml] [NULL]
        // are we waiting for the data length or for the response?
        if (this._parsingState === ParsingState.DataLength) {
            // does data contain a NULL byte?
            const nullByteIndex = data.indexOf(0);
            if (nullByteIndex !== -1) {
                // YES -> we received the data length and are ready to receive the response
                const lastPiece = data.slice(0, nullByteIndex);
                this._chunks.push(lastPiece);
                this._chunksDataLength += lastPiece.length;
                this._dataLength = parseInt(iconv.decode(Buffer.concat(this._chunks, this._chunksDataLength), exports.ENCODING));
                // reset buffered chunks
                this._chunks = [];
                this._chunksDataLength = 0;
                // switch to response parsing state
                this._parsingState = ParsingState.Response;
                // if data contains more info (except the NULL byte)
                if (data.length > nullByteIndex + 1) {
                    // handle the rest of the packet as part of the response
                    const rest = data.slice(nullByteIndex + 1);
                    this._handleDataChunk(rest);
                }
            }
            else {
                // NO -> this is only part of the data length. We wait for the next data event
                this._chunks.push(data);
                this._chunksDataLength += data.length;
            }
        }
        else if (this._parsingState === ParsingState.Response) {
            // does the new data together with the buffered data add up to the data length?
            if (this._chunksDataLength + data.length >= this._dataLength) {
                // YES -> we received the whole response
                // append the last piece of the response
                const lastResponsePiece = data.slice(0, this._dataLength - this._chunksDataLength);
                this._chunks.push(lastResponsePiece);
                this._chunksDataLength += data.length;
                const response = Buffer.concat(this._chunks, this._chunksDataLength);
                // call response handler
                const xml = iconv.decode(response, exports.ENCODING);
                const parser = new xmldom_1.DOMParser({
                    errorHandler: {
                        warning: warning => {
                            this.emit('warning', warning);
                        },
                        error: error => {
                            this.emit('error', error instanceof Error ? error : new Error(error));
                        },
                        fatalError: error => {
                            this.emit('error', error instanceof Error ? error : new Error(error));
                        },
                    },
                });
                const document = parser.parseFromString(xml, 'application/xml');
                this.emit('message', document);
                // reset buffer
                this._chunks = [];
                this._chunksDataLength = 0;
                // switch to data length parsing state
                this._parsingState = ParsingState.DataLength;
                // if data contains more info (except the NULL byte)
                if (data.length > lastResponsePiece.length + 1) {
                    // handle the rest of the packet (after the NULL byte) as data length
                    const rest = data.slice(lastResponsePiece.length + 1);
                    this._handleDataChunk(rest);
                }
            }
            else {
                // NO -> this is not the whole response yet. We buffer it and wait for the next data event.
                this._chunks.push(data);
                this._chunksDataLength += data.length;
            }
        }
    }
    write(command) {
        return new Promise((resolve, reject) => {
            if (this._socket.writable) {
                this._socket.write(command, () => {
                    resolve();
                });
            }
            else {
                reject(new Error('socket not writable'));
            }
        });
    }
    /** closes the underlying socket */
    close() {
        return new Promise((resolve, reject) => {
            this._socket.once('close', resolve);
            this._socket.end();
        });
    }
}
exports.DbgpConnection = DbgpConnection;
//# sourceMappingURL=dbgp.js.map