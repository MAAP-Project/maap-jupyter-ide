"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_REQUEST_OPTIONS = {
    ignoreCache: false,
    headers: {
        Accept: 'application/json, text/javascript, text/plain',
    },
    // default max duration for a request
    timeout: 5000,
};
function queryParams(params) {
    if (params === void 0) { params = {}; }
    return Object.keys(params)
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
        .join('&');
}
function withQuery(url, params) {
    if (params === void 0) { params = {}; }
    var queryString = queryParams(params);
    return queryString ? url + (url.indexOf('?') === -1 ? '?' : '&') + queryString : url;
}
function parseXHRResult(xhr) {
    return {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: xhr.getAllResponseHeaders(),
        data: xhr.responseText,
        json: function () { return JSON.parse(xhr.responseText); },
        url: xhr.responseURL
    };
}
function errorResponse(xhr, message) {
    if (message === void 0) { message = null; }
    return {
        ok: false,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: xhr.getAllResponseHeaders(),
        data: message || xhr.statusText,
        json: function () { return JSON.parse(message || xhr.statusText); },
        url: xhr.responseURL
    };
}
function request(method, url, queryParams, body, options) {
    if (queryParams === void 0) { queryParams = {}; }
    if (body === void 0) { body = null; }
    if (options === void 0) { options = exports.DEFAULT_REQUEST_OPTIONS; }
    var ignoreCache = options.ignoreCache || exports.DEFAULT_REQUEST_OPTIONS.ignoreCache;
    var headers = options.headers || exports.DEFAULT_REQUEST_OPTIONS.headers;
    var timeout = options.timeout || exports.DEFAULT_REQUEST_OPTIONS.timeout;
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, withQuery(url, queryParams));
        if (headers) {
            Object.keys(headers).forEach(function (key) { return xhr.setRequestHeader(key, headers[key]); });
        }
        if (ignoreCache) {
            xhr.setRequestHeader('Cache-Control', 'no-cache');
        }
        xhr.timeout = timeout;
        xhr.onload = function (evt) {
            resolve(parseXHRResult(xhr));
        };
        xhr.onerror = function (evt) {
            resolve(errorResponse(xhr, 'Failed to make request.'));
        };
        xhr.ontimeout = function (evt) {
            resolve(errorResponse(xhr, 'Request took longer than expected.'));
        };
        if (method === 'post' && body) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(body));
        }
        else {
            xhr.send();
        }
    });
}
exports.request = request;
