/**
 *
 * Url Decoder copied from earthdata search source code
 * https://github.com/nasa/earthdata-search/blob/master/static/src/js/util/url/url.js#L78
 *
 * June 30, 2020 - https://github.com/nasa/earthdata-search/releases/tag/v1.123.14
 *
 */


import qs from 'qs'

import { decodeFeatures, encodeFeatures } from './encodersDecoders'
import { decodeFacets, encodeFacets } from './encodersDecoders'
import { decodeMap, encodeMap } from './encodersDecoders'
import { decodeScienceKeywords, encodeScienceKeywords } from './encodersDecoders'
import { decodeString, encodeString } from './encodersDecoders'
import { decodeTemporal, encodeTemporal } from './encodersDecoders'
import { decodeTimeline, encodeTimeline } from './encodersDecoders'
import { decodeCollections, encodeCollections } from './encodersDecoders'
import { decodeGridCoords, encodeGridCoords } from './encodersDecoders'
import { decodeHasGranulesOrCwic, encodeHasGranulesOrCwic } from './encodersDecoders'
import { encodeAdvancedSearch, decodeAdvancedSearch } from './encodersDecoders'
import { encodeAutocomplete, decodeAutocomplete } from './encodersDecoders'

/**
 * Mapping of URL Shortened Keys to their redux store keys
 */
const urlDefs = {
    focusedGranule: { shortKey: 'g', encode: encodeString, decode: decodeString },
    keywordSearch: { shortKey: 'q', encode: encodeString, decode: decodeString },
    pointSearch: { shortKey: 'sp', encode: encodeString, decode: decodeString },
    boundingBoxSearch: { shortKey: 'sb', encode: encodeString, decode: decodeString },
    polygonSearch: { shortKey: 'polygon', encode: encodeString, decode: decodeString },
    lineSearch: { shortKey: 'line', encode: encodeString, decode: decodeString },
    circleSearch: { shortKey: 'circle', encode: encodeString, decode: decodeString },
    map: { shortKey: 'm', encode: encodeMap, decode: decodeMap },
    temporalSearch: { shortKey: 'qt', encode: encodeTemporal, decode: decodeTemporal },
    overrideTemporalSearch: { shortKey: 'ot', encode: encodeTemporal, decode: decodeTemporal },
    featureFacets: { shortKey: 'ff', encode: encodeFeatures, decode: decodeFeatures },
    platformFacets: { shortKey: 'fp', encode: encodeFacets, decode: decodeFacets },
    instrumentFacets: { shortKey: 'fi', encode: encodeFacets, decode: decodeFacets },
    organizationFacets: { shortKey: 'fdc', encode: encodeFacets, decode: decodeFacets },
    projectFacets: { shortKey: 'fpj', encode: encodeFacets, decode: decodeFacets },
    processingLevelFacets: { shortKey: 'fl', encode: encodeFacets, decode: decodeFacets },
    granuleDataFormatFacets: { shortKey: 'gdf', encode: encodeFacets, decode: decodeFacets },
    gridName: { shortKey: 's2n', encode: encodeString, decode: decodeString },
    gridCoords: { shortKey: 's2c', encode: encodeGridCoords, decode: decodeGridCoords },
    shapefileId: { shortKey: 'sf', encode: encodeString, decode: decodeString },
    tagKey: { shortKey: 'tag_key', encode: encodeString, decode: decodeString },
    hasGranulesOrCwic: { shortKey: 'ac', encode: encodeHasGranulesOrCwic, decode: decodeHasGranulesOrCwic },
    autocompleteSelected: { shortKey: 'as', encode: encodeAutocomplete, decode: decodeAutocomplete }
}

/**
 * Helper method to decode a given paramName from URL parameters base on urlDefs keys
 * @param {object} params Object of encoded URL parameters
 * @param {string} paramName Param to decode
 */
const decodeHelp = (params, paramName) => {
    const value = params[urlDefs[paramName].shortKey]
    return urlDefs[paramName].decode(value)
}

/**
 * Given a URL param string, returns an object that matches the redux store
 * @param {string} paramString a URL encoded parameter string
 * @return {object} An object of values that match the redux store
 */
export const decodeUrlParams = (paramString) => {
    // decode the paramString
    const params = qs.parse(paramString, { ignoreQueryPrefix: true, parseArrays: false })

    // build the param object based on the structure in the redux store
    // e.g. map is store separately from query
    const focusedGranule = decodeHelp(params, 'focusedGranule')

    const map = decodeHelp(params, 'map')

    const spatial = {}
    spatial.point = decodeHelp(params, 'pointSearch')
    spatial.boundingBox = decodeHelp(params, 'boundingBoxSearch')
    spatial.polygon = decodeHelp(params, 'polygonSearch')
    spatial.line = decodeHelp(params, 'lineSearch')
    spatial.circle = decodeHelp(params, 'circleSearch')

    const collectionQuery = { pageNum: 1 }
    const granuleQuery = { pageNum: 1 }
    collectionQuery.spatial = spatial
    collectionQuery.keyword = decodeHelp(params, 'keywordSearch')
    collectionQuery.temporal = decodeHelp(params, 'temporalSearch')
    collectionQuery.overrideTemporal = decodeHelp(params, 'overrideTemporalSearch')
    collectionQuery.gridName = decodeHelp(params, 'gridName')
    collectionQuery.tagKey = decodeHelp(params, 'tagKey')
    collectionQuery.hasGranulesOrCwic = decodeHelp(params, 'hasGranulesOrCwic')
    granuleQuery.gridCoords = decodeHelp(params, 'gridCoords')

    const query = {
        collection: collectionQuery,
        granule: granuleQuery
    }

    const timeline = decodeTimeline(params)

    const featureFacets = decodeHelp(params, 'featureFacets')
    const granuleDataFormats = decodeHelp(params, 'granuleDataFormatFacets')
    const instruments = decodeHelp(params, 'instrumentFacets')
    const organizations = decodeHelp(params, 'organizationFacets')
    const platforms = decodeHelp(params, 'platformFacets')
    const processingLevels = decodeHelp(params, 'processingLevelFacets')
    const projects = decodeHelp(params, 'projectFacets')
    const scienceKeywords = decodeScienceKeywords(params)

    const {
        collections,
        focusedCollection,
        project
    } = decodeCollections(params)

    const cmrFacets = {
        data_center_h: organizations,
        instrument_h: instruments,
        granule_data_format_h: granuleDataFormats,
        platform_h: platforms,
        processing_level_id_h: processingLevels,
        project_h: projects,
        science_keywords_h: scienceKeywords
    }

    const shapefile = {
        shapefileId: decodeHelp(params, 'shapefileId')
    }

    const advancedSearch = decodeAdvancedSearch(params)

    const autocompleteSelected = decodeHelp(params, 'autocompleteSelected')

    // Fetch collections in the project
    const { collectionIds = [] } = project || {}

    // Create a unique list of collections to fetch and remove any empty values [.filter(Boolean)]
    const uniqueCollectionList = [...new Set([
        ...collectionIds,
        focusedCollection
    ])].filter(Boolean)
    // console.log(project, uniqueCollectionList);

    return {
        advancedSearch,
        autocompleteSelected,
        cmrFacets,
        collections,
        featureFacets,
        focusedCollection,
        focusedGranule,
        map,
        conceptId: uniqueCollectionList,
        query,
        shapefile,
        timeline
    }
}

// export const updateStore = ({
//                                 advancedSearch,
//                                 autocompleteSelected,
//                                 cmrFacets,
//                                 collections,
//                                 featureFacets,
//                                 focusedCollection,
//                                 focusedGranule,
//                                 map,
//                                 project,
//                                 query,
//                                 shapefile,
//                                 timeline
//                             }, newPathname) =>  {
//
//     // If the newPathname is not equal to the current pathname, restore the data from the url
//     // if (loadFromUrl || (newPathname && newPathname !== pathname)) {
//     //     dispatch(restoreFromUrl({
//     //         advancedSearch,
//     //         autocompleteSelected,
//     //         cmrFacets,
//     //         collections,
//     //         featureFacets,
//     //         focusedCollection,
//     //         focusedGranule,
//     //         map,
//     //         project,
//     //         query,
//     //         shapefile,
//     //         timeline
//     //     }))
//
//         let requestAddedGranules = true
//
//         // If we are moving to a /search path, fetch collection results, this saves an extra request on the non-search pages.
//         // Setting requestAddedGranules forces all page types other than search to request only the added granules if they exist, in all
//         // other cases, getGranules will be requested using the granule search query params.
//         // if ((pathname.includes('/search') && !newPathname) || (newPathname && newPathname.includes('/search'))) {
//         //     requestAddedGranules = false
//         //     dispatch(actions.getCollections())
//         //     dispatch(actions.getFocusedCollection())
//         // }
//
//         // Fetch collections in the project
//         const { collectionIds = [] } = project || {}
//
//         // Create a unique list of collections to fetch and remove any empty values [.filter(Boolean)]
//         const uniqueCollectionList = [...new Set([
//             ...collectionIds,
//             focusedCollection
//         ])].filter(Boolean)
//
//         if (uniqueCollectionList.length > 0) {
//             try {
//                 await dispatch(actions.getProjectCollections(uniqueCollectionList))
//                 dispatch(actions.fetchAccessMethods(uniqueCollectionList))
//                 dispatch(actions.getGranules(uniqueCollectionList, {
//                     requestAddedGranules
//                 }))
//             } catch (e) {
//                 parseError(e)
//             }
//         }
//
//         dispatch(actions.getTimeline())
//     }
// }