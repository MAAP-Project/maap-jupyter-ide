/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export interface RequestOptions {
    ignoreCache?: boolean;
    headers?: {
        [key: string]: string;
    };
    timeout?: number;
}
export declare const DEFAULT_REQUEST_OPTIONS: {
    ignoreCache: boolean;
    headers: {
        Accept: string;
    };
    timeout: number;
};
export interface RequestResult {
    ok: boolean;
    status: number;
    statusText: string;
    data: string;
    json: <T>() => T;
    headers: string;
    url: string;
}
export declare function request(method: 'get' | 'post', url: string, queryParams?: any, body?: any, options?: RequestOptions): Promise<RequestResult>;
