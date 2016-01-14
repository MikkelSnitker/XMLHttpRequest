///<reference path="../typings/node/node.d.ts" />

import * as http from 'http'
import * as https from 'https'
import * as url from 'url'
import {EventEmitter } from 'events'

interface Request {
    method: string;
    url: string;
    username?: string;
    password?: string;
    requestHeaders?: {};

    authSent: boolean;
}

interface Response {
    responseHeaders: {};
    response: any;
    statusCode:number;
    statusMessage:string;
}


interface EventMap {
    [event: string]: (ev: Event) => any;
    
}


export module Test {
    export class XMLHttpRequest implements XMLHttpRequestEventTarget {

        private _events = new EventEmitter();

        private _client: http.ClientRequest = null;
        private _request: Request;
        private _response: Response;
        constructor() {

        }
        private _readyState: number = XMLHttpRequest.UNSET;

        public get readyState(): number {
            return this._readyState;
        }

        public set readyState(state: number) {
            this._readyState = state;
            this._events.emit("readystatechange");
        }

        public get response():any{
            var response = (this._response && this._response.response);
            if(response === undefined)
                return "";
            
            return response;
            
        }
         public get responseText():any{
            var response = (this._response && this._response.response);
            if(response === undefined)
                return "";
            
            return response.toString();
        }
        
        public responseType: string = "";
        public responseXML: any = null;
        public get status(): number {
            var status = this._response && this._response.statusCode;
            if(status == undefined)
                return 0;
                
            return status;     
        }
        
         public get statusText(): string {
            var status = this._response && this._response.statusMessage;
            if(status == undefined)
                return "";
                
            return status;     
        }
        
        public timeout: number = 0;
        public withCredentials: boolean = false;

        public abort() {
            if (this._client && this.readyState == XMLHttpRequest.OPENED || this.readyState == XMLHttpRequest.HEADERS_RECEIVED || this.readyState == XMLHttpRequest.LOADING) {
                this._client.abort();
            }
        }

        public getAllResponseHeaders() {
            if (this.readyState == XMLHttpRequest.DONE) {

            }
            return this._response.responseHeaders;
        }
        public getResponseHeader(header: string) {
            if (this.readyState == XMLHttpRequest.DONE) {

            }
            
            if(header == null || header == undefined)
                return undefined;

            return this._response.responseHeaders[header.toLowerCase()];
        }


        public open(method: string, url: string, async?: boolean, user?: string, password?: string) {
            this._request = { method: method, url: url, username: user, password: password, authSent: false };
            this.readyState = XMLHttpRequest.OPENED;
        }

        public overrideMimeType(mime: string) {
            if (this.readyState == XMLHttpRequest.DONE || this.readyState == XMLHttpRequest.LOADING) {
                throw new Error("InvalidStateError");
            }
            this._request.requestHeaders["Content-Type"] = mime;
        }

        public send(data?: string | any) {
            var makeRequest = (_url) => {
                var parsedUrl = url.parse(_url);
                var options = {

                    hostname: parsedUrl.hostname,
                    port: parseInt(parsedUrl.port),
                    path: parsedUrl.path,
                    method: this._request.method,
                    headers: this._request.requestHeaders
                }
                var request: (options: http.RequestOptions, callback?: (res: http.IncomingMessage) => void) => http.ClientRequest = null;
                if (/^https\:/i.test(parsedUrl.protocol)) {
                    request = https.request;
                } else {
                    request = http.request;
                }

                var req = this._client = request(options, res=> {

                    res.setEncoding('utf8');
                    var body = null;
                    res.on('data', (chunk) => {
                        if (this.readyState !== XMLHttpRequest.HEADERS_RECEIVED) {
                            this.readyState = XMLHttpRequest.HEADERS_RECEIVED;
                        }

                        if (body == null) {
                            body = chunk;
                        } else {
                            body += chunk;
                        }

                    });
                    res.on('end', () => {
                        if ((res.statusCode === 301 || res.statusCode === 302) && /GET|HEAD/i.test(options.method) && res.headers['location']) {
                            makeRequest(res.headers['location']);
                            return;
                        } else if (res.statusCode === 401 && !this._request.authSent && (this._request.username !== null || this._request.password !== null)) {
                            var authenticate = res.headers["www-authenticate"];
                            var authType = authenticate && authenticate.split(" ")[0];
                            switch (authType.toLowerCase()) {
                                case "basic":
                                    this._request.requestHeaders["Authorization"] = [authType, new Buffer(this._request.username + ":" + this._request.password).toString('base64')].join(" ");
                                    break;
                            }
                        }

                        this._response = {
                            responseHeaders: res.headers,
                            response: body,
                            statusCode: res.statusCode,
                            statusMessage: res.statusMessage

                        }


                        this.response = body;
                        this.responseText = body;

                        this.status = res.statusCode;
                        this.statusText = res.statusMessage;
                        this.readyState = XMLHttpRequest.DONE;
                    });

                    req.on('error', (e) => {
                        this.readyState = XMLHttpRequest.DONE;
                    });

                });

                if (!/GET|HEAD/i.test(options.method)) {
                    req.write(data);
                }
                req.end();
            };

            makeRequest(this._request.url);
        }

        public setRequestHeader(header: string, value: string) {
            if (this.readyState !== XMLHttpRequest.OPENED) {
                throw new Error("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.");
            }

            this._request.requestHeaders = (this._request.requestHeaders || {});
            if (this._request.requestHeaders[header] !== undefined) {
                this._request.requestHeaders[header] += ", " + value;
            } else {
                this._request.requestHeaders[header] = value;
            }
        }

        private _eventHandlers: EventMap = {};
        private _setEventHandler(type: string, listener: (ev: Event) => any) {
            if (this._eventHandlers["on" + type]) {
                this._events.removeListener(type, this._eventHandlers["on" + type]);
            }

            this._eventHandlers["on" + type] = listener;
            if (listener !== null && listener !== undefined)
                this._events.addListener("readystatechange", listener);
        }

        private _getEventHandler(type: string) {
            return this._eventHandlers[type];
        }

        public get onreadystatechange() {
            return this._getEventHandler("readystatechange");
        }

        public set onreadystatechange(listener: (ev: ProgressEvent) => any) {
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
}
    