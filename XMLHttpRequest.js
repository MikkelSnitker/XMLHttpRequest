///<reference path="../typings/node/node.d.ts" />
var http = require('http');
var https = require('https');
var url = require('url');
var events_1 = require('events');
var Test;
(function (Test) {
    var XMLHttpRequest = (function () {
        function XMLHttpRequest() {
            this._events = new events_1.EventEmitter();
            this._client = null;
            this._readyState = XMLHttpRequest.UNSET;
            this.responseType = "";
            this.responseXML = null;
            this.timeout = 0;
            this.withCredentials = false;
            this._eventHandlers = {};
        }
        Object.defineProperty(XMLHttpRequest.prototype, "readyState", {
            get: function () {
                return this._readyState;
            },
            set: function (state) {
                this._readyState = state;
                this._events.emit("readystatechange");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "response", {
            get: function () {
                var response = (this._response && this._response.response);
                if (response === undefined)
                    return "";
                return response;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
            get: function () {
                var response = (this._response && this._response.response);
                if (response === undefined)
                    return "";
                return response.toString();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "status", {
            get: function () {
                var status = this._response && this._response.statusCode;
                if (status == undefined)
                    return 0;
                return status;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "statusText", {
            get: function () {
                var status = this._response && this._response.statusMessage;
                if (status == undefined)
                    return "";
                return status;
            },
            enumerable: true,
            configurable: true
        });
        XMLHttpRequest.prototype.abort = function () {
            if (this._client && this.readyState == XMLHttpRequest.OPENED || this.readyState == XMLHttpRequest.HEADERS_RECEIVED || this.readyState == XMLHttpRequest.LOADING) {
                this._client.abort();
            }
        };
        XMLHttpRequest.prototype.getAllResponseHeaders = function () {
            if (this.readyState == XMLHttpRequest.DONE) {
            }
            return this._response.responseHeaders;
        };
        XMLHttpRequest.prototype.getResponseHeader = function (header) {
            if (this.readyState == XMLHttpRequest.DONE) {
            }
            if (header == null || header == undefined)
                return undefined;
            return this._response.responseHeaders[header.toLowerCase()];
        };
        XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
            this._request = { method: method, url: url, username: user, password: password, authSent: false };
            this.readyState = XMLHttpRequest.OPENED;
        };
        XMLHttpRequest.prototype.overrideMimeType = function (mime) {
            if (this.readyState == XMLHttpRequest.DONE || this.readyState == XMLHttpRequest.LOADING) {
                throw new Error("InvalidStateError");
            }
            this._request.requestHeaders["Content-Type"] = mime;
        };
        XMLHttpRequest.prototype.send = function (data) {
            var _this = this;
            var makeRequest = function (_url) {
                var parsedUrl = url.parse(_url);
                var options = {
                    hostname: parsedUrl.hostname,
                    port: parseInt(parsedUrl.port),
                    path: parsedUrl.path,
                    method: _this._request.method,
                    headers: _this._request.requestHeaders
                };
                var request = null;
                if (/^https\:/i.test(parsedUrl.protocol)) {
                    request = https.request;
                }
                else {
                    request = http.request;
                }
                var req = _this._client = request(options, function (res) {
                    res.setEncoding('utf8');
                    var body = null;
                    res.on('data', function (chunk) {
                        if (_this.readyState !== XMLHttpRequest.HEADERS_RECEIVED) {
                            _this.readyState = XMLHttpRequest.HEADERS_RECEIVED;
                        }
                        if (body == null) {
                            body = chunk;
                        }
                        else {
                            body += chunk;
                        }
                    });
                    res.on('end', function () {
                        if ((res.statusCode === 301 || res.statusCode === 302) && /GET|HEAD/i.test(options.method) && res.headers['location']) {
                            makeRequest(res.headers['location']);
                            return;
                        }
                        else if (res.statusCode === 401 && !_this._request.authSent && (_this._request.username !== null || _this._request.password !== null)) {
                            var authenticate = res.headers["www-authenticate"];
                            var authType = authenticate && authenticate.split(" ")[0];
                            switch (authType.toLowerCase()) {
                                case "basic":
                                    _this._request.requestHeaders["Authorization"] = [authType, new Buffer(_this._request.username + ":" + _this._request.password).toString('base64')].join(" ");
                                    break;
                            }
                        }
                        _this._response = {
                            responseHeaders: res.headers,
                            response: body,
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage
                        };
                        _this.response = body;
                        _this.responseText = body;
                        _this.status = res.statusCode;
                        _this.statusText = res.statusMessage;
                        _this.readyState = XMLHttpRequest.DONE;
                    });
                    req.on('error', function (e) {
                        _this.readyState = XMLHttpRequest.DONE;
                    });
                });
                if (!/GET|HEAD/i.test(options.method)) {
                    req.write(data);
                }
                req.end();
            };
            makeRequest(this._request.url);
        };
        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
            if (this.readyState !== XMLHttpRequest.OPENED) {
                throw new Error("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.");
            }
            this._request.requestHeaders = (this._request.requestHeaders || {});
            if (this._request.requestHeaders[header] !== undefined) {
                this._request.requestHeaders[header] += ", " + value;
            }
            else {
                this._request.requestHeaders[header] = value;
            }
        };
        XMLHttpRequest.prototype._setEventHandler = function (type, listener) {
            if (this._eventHandlers["on" + type]) {
                this._events.removeListener(type, this._eventHandlers["on" + type]);
            }
            this._eventHandlers["on" + type] = listener;
            if (listener !== null && listener !== undefined)
                this._events.addListener("readystatechange", listener);
        };
        XMLHttpRequest.prototype._getEventHandler = function (type) {
            return this._eventHandlers[type];
        };
        Object.defineProperty(XMLHttpRequest.prototype, "onreadystatechange", {
            get: function () {
                return this._getEventHandler("readystatechange");
            },
            set: function (listener) {
                this._setEventHandler("readystatechange", listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "onabort", {
            get: function () {
                return this._getEventHandler("abort");
            },
            set: function (listener) {
                this._setEventHandler("abort", listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "onerror", {
            get: function () {
                return this._getEventHandler("error");
            },
            set: function (listener) {
                this._setEventHandler("error", listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "onload", {
            get: function () {
                return this._getEventHandler("load");
            },
            set: function (listener) {
                this._setEventHandler("load", listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "onloadend", {
            get: function () {
                return this._getEventHandler("loadend");
            },
            set: function (listener) {
                this._setEventHandler("loadend", listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "onloadstart", {
            get: function () {
                return this._getEventHandler("loadstart");
            },
            set: function (listener) {
                this._setEventHandler("loadstart", listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "onprogress", {
            get: function () {
                return this._getEventHandler("progress");
            },
            set: function (listener) {
                this._setEventHandler("progress", listener);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(XMLHttpRequest.prototype, "ontimeout", {
            get: function () {
                return this._getEventHandler("timeout");
            },
            set: function (listener) {
                this._setEventHandler("timeout", listener);
            },
            enumerable: true,
            configurable: true
        });
        XMLHttpRequest.prototype.addEventListener = function (type, listener, useCapture) {
            this._events.addListener(type, listener);
        };
        XMLHttpRequest.prototype.removeEventListener = function (type, listener, useCapture) {
            this._events.removeListener(type, listener);
        };
        Object.defineProperty(XMLHttpRequest.prototype, "upload", {
            get: function () {
                throw new Error("property not implementd");
            },
            enumerable: true,
            configurable: true
        });
        XMLHttpRequest.UNSET = 0;
        XMLHttpRequest.OPENED = 1;
        XMLHttpRequest.HEADERS_RECEIVED = 2;
        XMLHttpRequest.LOADING = 3;
        XMLHttpRequest.DONE = 4;
        return XMLHttpRequest;
    })();
    Test.XMLHttpRequest = XMLHttpRequest;
})(Test = exports.Test || (exports.Test = {}));
//# sourceMappingURL=XMLHttpRequest.js.map