///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/request/request.d.ts" />
import * as http from 'http'
import * as https from 'https'
import * as url from 'url'
import {EventEmitter } from 'events'
import * as request from 'request'

interface Options {
    method: string;
    url: string;
    username?: string;
    password?: string;
    headers?: {};

}



interface EventMap {
    [event: string]: (ev: Event) => any;

}


function initProgressEvent(type: string, target: any, loaded: number = 0, total: number = 0, lengthComputable: boolean = false): ProgressEvent {
    var ev = <ProgressEvent>initEvent(type, target);
    ev.loaded = loaded;
    ev.total = total;
    ev.lengthComputable = lengthComputable;
    ev.type = type;
    return ev;
}

function initEvent(type: string, target: any): Event {
    return <Event><any>{
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
    }
}


export class XMLHttpRequest implements XMLHttpRequestEventTarget {

    private _events = new EventEmitter();
    private _request: request.Request = null;
    private _response: http.IncomingMessage = null;
    private _options: Options = null;
    private _responseBuffer: Buffer = new Buffer(0);
    constructor() {

    }

    private _readyState: number = XMLHttpRequest.UNSET;

    public get readyState(): number {
        return this._readyState;
    }

    private _setReadyState(state: number, ev?: Event) {
        if (state !== this._readyState) {
            this._readyState = state;
            this._events.emit("readystatechange", initEvent("readyStatechange", this));
        }
    }



    public get response(): any {
        if(this.responseType === "text" || this.responseType === "")
        {
            return this.responseText;
        } else if(this._readyState !== XMLHttpRequest.DONE) {
            return null;
        } else if (this.responseType ==="arraybuffer") {
        
            var buffer = this._responseBuffer;
            var ab = new ArrayBuffer(buffer.length);
            var view = new Uint8Array(ab);
            for (var i = 0; i < buffer.length; ++i) {
                view[i] = buffer[i];
            }   
            return ab;
        } else if (this.responseType === "json"){
            try {
                console.log("TEST:", this._responseBuffer.length);
                var jsonString = this._responseBuffer.toString("utf8");
                return JSON.parse(jsonString);
            } catch(error){
                return null;
            }
        }
        
        return this._responseBuffer;
    }
    public get responseText(): string {
        
        if(!(this.responseType == "text" || this.responseType == ""))
        {    throw new Error(`Failed to read the 'responseText' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'text' (was '${this.responseType}').`);
        } else if(this._readyState !== XMLHttpRequest.LOADING || this._readyState !== XMLHttpRequest.DONE)
        {
            return "";
        } else {
            return this._responseBuffer.toString("utf8");  
        }
        
    }

    private _responseType: string ="";
    public get responseType(): string {
        return this._responseType;
    } 
    
    public set responseType(responseType:string){
        if(["","text","json","arraybuffer"].indexOf(responseType.toLowerCase())){
            this._responseType = responseType;
        }
    }
    
    public responseXML: any = null;
    
    public get status(): number {
        if(this._response)
            return this._response.statusCode || 0;
    }

    public get statusText(): string {
        if(this._response)
         return this._response.statusMessage;
    }

    public timeout: number = 0;
    public withCredentials: boolean = false;

    public abort() {

        if (this._request && (this.readyState == XMLHttpRequest.OPENED || this.readyState == XMLHttpRequest.HEADERS_RECEIVED || this.readyState == XMLHttpRequest.LOADING)) {
            this._request.abort();
        }

        this._readyState = XMLHttpRequest.UNSET;
    }

    public getAllResponseHeaders() {
        
            if(this._response && this._response.rawHeaders)
                return this._response.rawHeaders || "";
                
            return ""; 
    }
    public getResponseHeader(header: string) {
      
            if(this._response && this._response.headers)
                return this._response.headers[header] || null;
                
            return null;
    }


    public open(method: string, url: string, async?: boolean, user?: string, password?: string) {
        this._options = { method: method, url: url, username: user, password: password };
        this._setReadyState(XMLHttpRequest.OPENED);
    }

    public overrideMimeType(mime: string) {
        if (this.readyState == XMLHttpRequest.DONE || this.readyState == XMLHttpRequest.LOADING) {
            throw new Error("InvalidStateError");
        }
        this._options.headers["Content-Type"] = mime;
    }

    public send(data?: string | any) {
        if(this._readyState !== XMLHttpRequest.OPENED)
            throw new Error("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.")
            
        var options = this._options;
        var loaded = 0;
        var totalSize = 0;
        var lengthComputeable = false;
        this._responseBuffer = new Buffer(0);
        
        this._events.emit("loadstart", initProgressEvent("loadstart", this, loaded, totalSize, lengthComputeable));

        var req = this._request = request(this._options.url, { method: options.method, headers: options.headers, body: data /*, auth: { username: options.username, password: options.password } */}, (error, result) => {
           
        });
       
        var timer = 0;
        req.on("data", (data: Buffer) => {
            
            this._responseBuffer = Buffer.concat([this._responseBuffer, data]);
            
            if(this._readyState < XMLHttpRequest.HEADERS_RECEIVED)
            {
                return;
            }
            
            if (this._readyState !== XMLHttpRequest.LOADING) {
                this._setReadyState(XMLHttpRequest.LOADING, initEvent("readystatechange", this));
            }

            loaded += data.length;
            if (timer = 0) {
                timer = <number><any>setTimeout(() => {
                    this._events.emit("progress", initProgressEvent("progress", this, loaded, totalSize, lengthComputeable));
                    timer = 0;
                }, 50);
            }
        });

        req.on("error", () => {
            this._setReadyState(XMLHttpRequest.DONE, initEvent("readystatechange", this));
            clearTimeout(timer);
            this._events.emit("progress", initProgressEvent("progress", this, loaded, totalSize, lengthComputeable));
            this._events.emit("error", initProgressEvent("error", this, loaded, totalSize, lengthComputeable));
            this._events.emit("loadend", initProgressEvent("loadend", this, loaded, totalSize, lengthComputeable));
          
        });

        req.on("end", () => {

            clearTimeout(timer);
            this._events.emit("progress", initProgressEvent("progress", this, loaded, totalSize, lengthComputeable));

            this._setReadyState(XMLHttpRequest.DONE, initEvent("readystatechange", this));
            this._events.emit("load", initProgressEvent("load", this, loaded, totalSize, lengthComputeable));

        });

        req.on("response", (message: http.IncomingMessage) => {
            this._response = message;
            lengthComputeable = (totalSize = message.headers["content-length"] || 0) > 0;
            this._setReadyState(XMLHttpRequest.HEADERS_RECEIVED, initEvent("readystatechange", this));
        });

        req.on("complete", () => {
            this._events.emit("loadend", initProgressEvent("loadend", this, loaded, totalSize, lengthComputeable));
        });

        req.on("abort", () => {
            this._response =<http.IncomingMessage>( this._response || {statusCode: 0, statusMessage:"", headers:{}, rawHeaders: {}});
            
            this._response.statusCode = 0;
            this._response.statusMessage ="";
            this._response.headers = null;
            this._response.rawHeaders = null;
       
            
            this._setReadyState(XMLHttpRequest.DONE, initEvent("readystatechange", this));
            this._readyState = XMLHttpRequest.UNSET;
            clearTimeout(timer);
            this._events.emit("progress", initProgressEvent("progress", this, loaded, totalSize, lengthComputeable));

        
            this._events.emit("abort", initProgressEvent("abort", this, loaded, totalSize, lengthComputeable));
            this._events.emit("loadend", initProgressEvent("loadend", this, loaded, totalSize, lengthComputeable));
        });

    }

    public setRequestHeader(header: string, value: string) {
        if (this.readyState !== XMLHttpRequest.OPENED) {
            throw new Error("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.");
        }

        this._options.headers = (this._options.headers || {});
        if (this._options.headers[header] !== undefined) {
            this._options.headers[header] += ", " + value;
        } else {
            this._options.headers[header] = value;
        }
    }

    private _eventHandlers: EventMap = {};
    private _setEventHandler(type: string, listener: (ev: Event) => any) {
        if (this._eventHandlers["on" + type]) {
            this._events.removeListener(type, this._eventHandlers["on" + type]);
        }

        this._eventHandlers["on" + type] = listener;
        if (listener !== null && listener !== undefined)
            this._events.addListener(type, listener);
    }

    private _getEventHandler(type: string) {
        return this._eventHandlers[type];
    }

    public get onreadystatechange() {
        return this._getEventHandler("readystatechange");
    }

    public set onreadystatechange(listener: (ev: Event) => any) {
        this._setEventHandler("readystatechange", listener);
    }


    public get onabort() {
        return this._getEventHandler("abort");
    }

    public set onabort(listener: (ev: ProgressEvent) => any) {
        this._setEventHandler("abort", listener);
    }

    public get onerror() {
        return this._getEventHandler("error");
    }

    public set onerror(listener: (ev: ProgressEvent) => any) {
        this._setEventHandler("error", listener);
    }

    public get onload() {
        return this._getEventHandler("load");
    }

    public set onload(listener: (ev: ProgressEvent) => any) {
        this._setEventHandler("load", listener);
    }
    public get onloadend() {
        return this._getEventHandler("loadend");
    }

    public set onloadend(listener: (ev: ProgressEvent) => any) {
        this._setEventHandler("loadend", listener);
    }

    public get onloadstart() {
        return this._getEventHandler("loadstart");
    }

    public set onloadstart(listener: (ev: ProgressEvent) => any) {
        this._setEventHandler("loadstart", listener);
    }

    public get onprogress() {
        return this._getEventHandler("progress");
    }

    public set onprogress(listener: (ev: ProgressEvent) => any) {
        this._setEventHandler("progress", listener);
    }

    public get ontimeout() {
        return this._getEventHandler("timeout");
    }

    public set ontimeout(listener: (ev: ProgressEvent) => any) {
        this._setEventHandler("timeout", listener);
    }

    public addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean) {
        this._events.addListener(type, <any>listener);
    }

    public removeEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean) {
        this._events.removeListener(type, <any>listener);
    }

    public get upload(): XMLHttpRequestUpload {
        throw new Error("property not implementd");
    }


    static UNSET: number = 0;
    static OPENED: number = 1;
    static HEADERS_RECEIVED: number = 2;
    static LOADING: number = 3;
    static DONE: number = 4;
}
