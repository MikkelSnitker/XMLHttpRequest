var events_1 = require('events');
var request = require('request');
function initProgressEvent(type, target, loaded, total, lengthComputable) {
    if (loaded === void 0) { loaded = 0; }
    if (total === void 0) { total = 0; }
    if (lengthComputable === void 0) { lengthComputable = false; }
    var ev = initEvent(type, target);
    ev.loaded = loaded;
    ev.total = total;
    ev.lengthComputable = lengthComputable;
    ev.type = type;
    return ev;
}
function initEvent(type, target) {
    return {
        bubbles: false,
        cancelBubble: false,
        cancelable: false,
        currentTarget: target,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: true,
        returnValue: true,
        srcElement: target,
        target: target,
        timeStamp: new Date().getTime(),
        type: type,
        initEvent: null,
        preventDefault: null,
        stopImmediatePropagation: null,
        stopPropagation: null
    };
}
var XMLHttpRequest = (function () {
    function XMLHttpRequest() {
        this._events = new events_1.EventEmitter();
        this._request = null;
        this._response = null;
        this._options = null;
        this._readyState = XMLHttpRequest.UNSET;
        this._responseType = "";
        this.responseXML = null;
        this.timeout = 0;
        this.withCredentials = false;
        this._eventHandlers = {};
    }
    Object.defineProperty(XMLHttpRequest.prototype, "readyState", {
        get: function () {
            return this._readyState;
        },
        enumerable: true,
        configurable: true
    });
    XMLHttpRequest.prototype._setReadyState = function (state, ev) {
        if (state !== this._readyState) {
            this._readyState = state;
            this._events.emit("readystatechange", initEvent("readyStatechange", this));
        }
    };
    Object.defineProperty(XMLHttpRequest.prototype, "response", {
        get: function () {
            if (this.responseType === "text" || this.responseType === "") {
                return this.responseText;
            }
            else if (this._readyState !== XMLHttpRequest.DONE) {
                return null;
            }
            else if (this.responseType.toLowerCase() === "arraybuffer") {
                var buffer = this._responseBody; // new Buffer(this._responseBody,"utf8");
                var ab = new ArrayBuffer(buffer.length);
                var view = new Uint8Array(ab);
                for (var i = 0; i < buffer.length; ++i) {
                    view[i] = buffer[i];
                }
                return ab;
            }
            else if (this.responseType === "json") {
                try {
                    var jsonString = this._responseBody;
                    return JSON.parse(jsonString);
                }
                catch (error) {
                    return null;
                }
            }
            return this._responseBody;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
        get: function () {
            if (!(this.responseType == "text" || this.responseType == "")) {
                throw new Error("Failed to read the 'responseText' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'text' (was '" + this.responseType + "').");
            }
            else if (!(this._readyState == XMLHttpRequest.LOADING || this._readyState == XMLHttpRequest.DONE)) {
                return "";
            }
            else {
                return this._responseBody;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(XMLHttpRequest.prototype, "responseType", {
        get: function () {
            return this._responseType;
        },
        set: function (responseType) {
            if (["", "text", "json", "arraybuffer"].indexOf(responseType.toLowerCase())) {
                this._responseType = responseType;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(XMLHttpRequest.prototype, "status", {
        get: function () {
            if (this._response)
                return this._response.statusCode || 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(XMLHttpRequest.prototype, "statusText", {
        get: function () {
            if (this._response)
                return this._response.statusMessage;
        },
        enumerable: true,
        configurable: true
    });
    XMLHttpRequest.prototype.abort = function () {
        if (this._request && (this.readyState == XMLHttpRequest.OPENED || this.readyState == XMLHttpRequest.HEADERS_RECEIVED || this.readyState == XMLHttpRequest.LOADING)) {
            this._request.abort();
        }
        this._readyState = XMLHttpRequest.UNSET;
    };
    XMLHttpRequest.prototype.getAllResponseHeaders = function () {
        if (this._response && this._response.rawHeaders)
            return this._response.rawHeaders || "";
        return "";
    };
    XMLHttpRequest.prototype.getResponseHeader = function (header) {
        if (this._response && this._response.headers)
            return this._response.headers[header] || null;
        return null;
    };
    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        this._options = { method: method, url: url, username: user, password: password };
        this._setReadyState(XMLHttpRequest.OPENED);
    };
    XMLHttpRequest.prototype.overrideMimeType = function (mime) {
        if (this.readyState == XMLHttpRequest.DONE || this.readyState == XMLHttpRequest.LOADING) {
            throw new Error("InvalidStateError");
        }
        this._options.headers["Content-Type"] = mime;
    };
    XMLHttpRequest.prototype.send = function (data) {
        var _this = this;
        if (this._readyState !== XMLHttpRequest.OPENED)
            throw new Error("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.");
        var options = this._options;
        var loaded = 0;
        var totalSize = 0;
        var lengthComputeable = false;
        this._responseBody = null;
        this._events.emit("loadstart", initProgressEvent("loadstart", this, loaded, totalSize, lengthComputeable));
        var req = this._request = request(this._options.url, { method: options.method, headers: options.headers, body: data, encoding: this._responseType.toLowerCase() == "arraybuffer" ? null : "UTF8" }, function (error, result, body) {
        });
        var timer = 0;
        req.pause();
        req.on("data", function (data) {
            if (_this._responseType.toLowerCase() == "arraybuffer") {
                if (_this._responseBody == null) {
                    _this._responseBody = data;
                }
                else {
                    _this._responseBody = Buffer.concat([_this._responseBody, data]);
                }
            }
            else {
                if (_this._responseBody == null)
                    _this._responseBody = "";
                _this._responseBody += data.toString("utf8");
            }
            if (_this._readyState < XMLHttpRequest.HEADERS_RECEIVED) {
                return;
            }
            if (_this._readyState !== XMLHttpRequest.LOADING) {
                _this._setReadyState(XMLHttpRequest.LOADING, initEvent("readystatechange", _this));
            }
            loaded += data.length;
            if (timer = 0) {
                timer = setTimeout(function () {
                    _this._events.emit("progress", initProgressEvent("progress", _this, loaded, totalSize, lengthComputeable));
                    timer = 0;
                }, 50);
            }
        });
        req.on("error", function () {
            _this._setReadyState(XMLHttpRequest.DONE, initEvent("readystatechange", _this));
            clearTimeout(timer);
            _this._events.emit("progress", initProgressEvent("progress", _this, loaded, totalSize, lengthComputeable));
            _this._events.emit("error", initProgressEvent("error", _this, loaded, totalSize, lengthComputeable));
            _this._events.emit("loadend", initProgressEvent("loadend", _this, loaded, totalSize, lengthComputeable));
        });
        req.on("end", function () {
            clearTimeout(timer);
            _this._events.emit("progress", initProgressEvent("progress", _this, loaded, totalSize, lengthComputeable));
            _this._setReadyState(XMLHttpRequest.DONE, initEvent("readystatechange", _this));
            _this._events.emit("load", initProgressEvent("load", _this, loaded, totalSize, lengthComputeable));
        });
        req.on("response", function (message) {
            /* if(this._responseType == "arrayBuffer"){
              this._response.setEncoding('binary');
          } else {
                 this._response.setEncoding("utf8");
          }*/
            _this._response = message;
            lengthComputeable = (totalSize = message.headers["content-length"] || 0) > 0;
            _this._setReadyState(XMLHttpRequest.HEADERS_RECEIVED, initEvent("readystatechange", _this));
        });
        req.on("complete", function () {
            _this._events.emit("loadend", initProgressEvent("loadend", _this, loaded, totalSize, lengthComputeable));
        });
        req.on("abort", function () {
            _this._response = (_this._response || { statusCode: 0, statusMessage: "", headers: {}, rawHeaders: {} });
            _this._response.statusCode = 0;
            _this._response.statusMessage = "";
            _this._response.headers = null;
            _this._response.rawHeaders = null;
            _this._setReadyState(XMLHttpRequest.DONE, initEvent("readystatechange", _this));
            _this._readyState = XMLHttpRequest.UNSET;
            clearTimeout(timer);
            _this._events.emit("progress", initProgressEvent("progress", _this, loaded, totalSize, lengthComputeable));
            _this._events.emit("abort", initProgressEvent("abort", _this, loaded, totalSize, lengthComputeable));
            _this._events.emit("loadend", initProgressEvent("loadend", _this, loaded, totalSize, lengthComputeable));
        });
        req.resume();
    };
    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        if (this.readyState !== XMLHttpRequest.OPENED) {
            throw new Error("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.");
        }
        this._options.headers = (this._options.headers || {});
        if (this._options.headers[header] !== undefined) {
            this._options.headers[header] += ", " + value;
        }
        else {
            this._options.headers[header] = value;
        }
    };
    XMLHttpRequest.prototype._setEventHandler = function (type, listener) {
        if (this._eventHandlers["on" + type]) {
            this._events.removeListener(type, this._eventHandlers["on" + type]);
        }
        this._eventHandlers["on" + type] = listener;
        if (listener !== null && listener !== undefined)
            this._events.addListener(type, listener);
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
exports.XMLHttpRequest = XMLHttpRequest;
//# sourceMappingURL=XMLHttpRequest.js.map