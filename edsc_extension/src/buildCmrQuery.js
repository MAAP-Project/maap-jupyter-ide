import { stringify } from 'qs';
import { granuleParams, collectionParams } from "./globals";

export const buildCmrQuery = (urlParams, nonIndexedKeys, permittedCmrKeys, granule=true) => {
    return buildParams({
        body: camelCaseKeysToUnderscore(urlParams),
        nonIndexedKeys,
        permittedCmrKeys,
        granule
    });
}

/**
 * Apapted from source: https://github.com/nasa/earthdata-search/blob/f09ff3bfd40420322f005654bc349374aab1fe57/serverless/src/util/cmr/buildParams.js
 * Builds a URL used to perform a search request
 * @param {object} paramObj Parameters needed to build a search request URL
 */
export const buildParams = (paramObj) => {
    const {
        body,
        nonIndexedKeys,
        permittedCmrKeys,
        granule,
        stringifyResult = true
    } = paramObj;


    const obj = pick(body, permittedCmrKeys)
    granule ? granuleParams = obj : collectionParams = obj;

    // console.log("unfiltered", body);
    // console.log("filtered", obj)

    // For JSON requests we want dont want to stringify the params returned
    if (stringifyResult) {
        // Transform the query string hash to an encoded url string
        const queryParams = prepKeysForCmr(obj, nonIndexedKeys)
        return queryParams
    }

    return obj
}

/**
 * Adapted from source https://github.com/nasa/earthdata-search/blob/f09ff3bfd40420322f005654bc349374aab1fe57/serverless/src/util/pick.js
 * Select only desired keys from a provided object.
 * @param {object} providedObj - An object containing any keys.
 * @param {array} keys - An array of strings that represent the keys to be picked.
 * @return {obj} An object containing only the desired keys.
 */
export const pick = (providedObj = {}, keys) => {
    let obj = null

    // if `null` is provided the default parameter will not be
    // set so we'll handle it manually
    if (providedObj == null) {
        obj = {}
    } else {
        obj = providedObj
    }

    let filteredObj = {};
    keys.forEach((key) => {
        let val;
        if (key === 'exclude') {
            val = getObject(obj, "excluded_granule_ids");
        } else {
            val = getObject(obj, key);
        }
        if (val) {
            filteredObj[key] = val;
        }
    })
    return filteredObj
}

/*
* Adapted from
* https://stackoverflow.com/questions/15523514/find-by-key-deep-in-a-nested-array
* */
function getObject(theObject, key) {
    var result = null;
    if(theObject instanceof Array) {
        for(var i = 0; i < theObject.length; i++) {
            result = getObject(theObject[i], key);
            if (result) {
                break;
            }
        }
    }
    else
    {
        for(var prop in theObject) {
            if(prop == key) {
                if(theObject[prop]) {
                    return theObject[prop];
                }
            }
            if(theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
                result = getObject(theObject[prop], key);
                if (result) {
                    break;
                }
            }
        }
    }
    return result;
}

/**
 * Adapted from source https://github.com/nasa/earthdata-search/blob/f09ff3bfd40420322f005654bc349374aab1fe57/sharedUtils/prepKeysForCmr.js
 * Create a query string containing both indexed and non-indexed keys.
 * @param {object} queryParams - An object containing all queryParams.
 * @param {array} nonIndexedKeys - An array of strings that represent the keys which should not be indexed.
 * @return {string} A query string containing both indexed and non-indexed keys.
 */
export const prepKeysForCmr = (queryParams, nonIndexedKeys = []) => {
    const nonIndexedAttrs = {}
    const indexedAttrs = { ...queryParams }

    nonIndexedKeys.forEach((key) => {
        nonIndexedAttrs[key] = indexedAttrs[key]
        delete indexedAttrs[key]
    })

    return [
        stringify(indexedAttrs),
        stringify(nonIndexedAttrs, { indices: false, arrayFormat: 'brackets' })
    ].filter(Boolean).join('&')
}

/*
* Source: https://stackoverflow.com/questions/30970286/convert-javascript-object-camelcase-keys-to-underscore-case
* */
function camelCaseKeysToUnderscore(obj){
    if (typeof(obj) != "object") return obj;

    for(let oldName in obj){

        // Camel to underscore
        let newName = oldName.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});

        // Only process if names are different
        if (newName != oldName) {
            // Check for the old property name to avoid a ReferenceError in strict mode.
            if (obj.hasOwnProperty(oldName)) {
                obj[newName] = obj[oldName];
                delete obj[oldName];
            }
        }

        // Recursion
        if (typeof(obj[newName]) == "object") {
            obj[newName] = camelCaseKeysToUnderscore(obj[newName]);
        }

    }
    return obj;
}