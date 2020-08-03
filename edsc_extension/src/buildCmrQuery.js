import { stringify } from 'qs';
import { params } from "./globals";
import { granulePermittedCmrKeys, granuleNonIndexedKeys} from "./searchKeys";

// Whitelist parameters supplied by the request
// const permittedCmrKeys = [
//     'concept_id',
//     'bounding_box',
//     'circle',
//     'browse_only',
//     'cloud_cover',
//     'day_night_flag',
//     'echo_collection_id',
//     'equator_crossing_date',
//     'equator_crossing_longitude',
//     'exclude',
//     'line',
//     'online_only',
//     'options',
//     'orbit_number',
//     'page_num',
//     'page_size',
//     'point',
//     'polygon',
//     'readable_granule_name',
//     'sort_key',
//     'temporal',
//     'two_d_coordinate_system'
// ]
//
// const nonIndexedKeys = [
//     'concept_id',
//     'exclude',
//     'readable_granule_name',
//     'sort_key'
// ]

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

export const buildCmrQuery = (urlParams, nonIndexedKeys, permittedCmrKeys) => {
    return buildParams({
        body: camelCaseKeysToUnderscore(urlParams),
        nonIndexedKeys,
        permittedCmrKeys
    });
}

/**
 * Builds a URL used to perform a search request
 * @param {object} paramObj Parameters needed to build a search request URL
 */
export const buildParams = (paramObj) => {
    const {
        body,
        nonIndexedKeys,
        permittedCmrKeys,
        stringifyResult = true
    } = paramObj;

    // const { params = {} } = JSON.parse(body)
    // const params = body;

    // console.log(`Parameters received: ${Object.keys(params)}`)
    console.log("unfiltered", body);
    const obj = pick(body, permittedCmrKeys)

    // For JSON requests we want dont want to stringify the params returned
    if (stringifyResult) {
        // Transform the query string hash to an encoded url string
        const queryParams = prepKeysForCmr(obj, nonIndexedKeys)

        params = queryParams;
        console.log ("filtered", params);
        return queryParams
    }

    // console.log('CMR Query', JSON.stringify(obj, null, 4))
    params = obj;
    console.log ("filtered", params);
    return obj
}

/**
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
        const val = getObject(obj, key);
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