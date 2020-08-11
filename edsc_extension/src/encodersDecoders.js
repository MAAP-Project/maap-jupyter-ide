/**
 *
 * All encoders and decoders copied from earthdata search source code.
 * They can all be found in this directory: https://github.com/nasa/earthdata-search/tree/master/static/src/js/util/url
 *
 * June 30, 2020 - https://github.com/nasa/earthdata-search/releases/tag/v1.123.14
 *
 * */


/**
 * Decodes a string parameter (returns the same value)
 * @param {string} string
 */
export const decodeString = string => string


/**
 * Encodes a string parameter (returns the same value)
 * @param {string} string
 */
export const encodeString = string => string || ''

/**
 * Encodes a Feature Facet object into a string
 * @param {object} features Feature Facet object
 * @return {string} A `!` delimited string of the Feature Facet values
 */
export const encodeFeatures = (features) => {
    if (!features) return ''

    const {
        customizable,
        mapImagery,
        nearRealTime
    } = features

    const encoded = []

    if (mapImagery) encoded.push('Map Imagery')
    if (nearRealTime) encoded.push('Near Real Time')
    if (customizable) encoded.push('Customizable')

    const encodedString = encoded.join('!')

    if (encodedString === '') return ''

    return encodedString
}


/**
 * Decodes a Feature Facet parameter string into an object
 * @param {string} string A `!` delimited string of the Feature Facet values
 * @return {object} Feature Facet object
 */
export const decodeFeatures = (string) => {
    const defaultFeatures = {
        mapImagery: false,
        nearRealTime: false,
        customizable: false
    }

    if (!string) {
        return defaultFeatures
    }

    const decodedValues = string.split('!')

    const decodedFeatures = {
        mapImagery: decodedValues.indexOf('Map Imagery') !== -1,
        nearRealTime: decodedValues.indexOf('Near Real Time') !== -1,
        customizable: decodedValues.indexOf('Customizable') !== -1
    }

    return {
        ...decodedFeatures
    }
}

/**
 * Encodes a Facet object into a string
 * @param {object} facets Facet object
 * @return {string} A `!` delimited string of the facet values
 */
export const encodeFacets = (facets) => {
    if (!facets) return ''

    const encoded = []

    facets.forEach((facet) => {
        encoded.push(facet)
    })

    return encoded.join('!')
}


/**
 * Decodes a Facet parameter string into an object
 * @param {string} string A `!` delimited string of the facet values
 * @return {object} Facet object
 */
export const decodeFacets = (string) => {
    if (!string) {
        return undefined
    }

    const decodedValues = string.split('!')

    return decodedValues
}
const projections = {
    arctic: 'epsg3413',
    geographic: 'epsg4326',
    antarctic: 'epsg3031'
}

const projectionList = [
    projections.arctic,
    projections.geographic,
    projections.antarctic
]

/**
 * Encodes a Map object into a string
 * @param {object} query Map object with query and state
 * @return {string} A `!` delimited string of the map values
 */
export const encodeMap = (map) => {
    if (!map) return ''

    const {
        base,
        latitude,
        longitude,
        overlays,
        projection,
        zoom
    } = map

    const encodedProjection = projectionList.indexOf(projection)

    let encodedBase
    if (base.blueMarble) encodedBase = 0
    if (base.trueColor) encodedBase = 1
    if (base.landWaterMap) encodedBase = 2

    const encodedOverlays = []
    if (overlays.referenceFeatures) encodedOverlays.push(0)
    if (overlays.coastlines) encodedOverlays.push(1)
    if (overlays.referenceLabels) encodedOverlays.push(2)

    const encodedString = [
        latitude,
        longitude,
        zoom,
        encodedProjection,
        encodedBase,
        encodedOverlays.join(',')
    ].join('!')

    if (encodedString === '0!0!2!1!0!0,2') return ''

    return encodedString
}


/**
 * Decodes a map parameter string into an object
 * @param {string} string A `!` delimited string of the map values
 * @return {object} Map object with query and state
 */
export const decodeMap = (string) => {
    if (!string) {
        return {}
    }

    const [latitude, longitude, zoom, projection, base, overlays] = string.split('!')

    const decodedLatitude = parseFloat(latitude)
    const decodedLongitude = parseFloat(longitude)
    const decodedZoom = parseFloat(zoom)

    const decodedProjection = projectionList[projection]

    const decodedBase = {
        blueMarble: base === '0',
        trueColor: base === '1',
        landWaterMap: base === '2'
    }

    const decodedOverlays = {
        referenceFeatures: overlays.split(',').indexOf('0') !== -1,
        coastlines: overlays.split(',').indexOf('1') !== -1,
        referenceLabels: overlays.split(',').indexOf('2') !== -1
    }

    const map = {
        base: decodedBase,
        latitude: decodedLatitude,
        longitude: decodedLongitude,
        overlays: decodedOverlays,
        projection: decodedProjection,
        zoom: decodedZoom
    }

    return {
        ...map
    }
}

/**
 * Lookup a object key given a value
 * @param {string} object JavaScript Object with key-value pairs
 * @param {string} value A value in the object
 * @return {string} A key in the object
 */
const getObjectKeyByValue = (object, value) => Object.keys(object)
    .find(key => object[key] === value)

/**
 * Mapping of Science Keyword keys to encoded values
 */
const scienceKeywordMapping = {
    topic: 'fst',
    term: 'fsm',
    variable_level_1: 'fs1',
    variable_level_2: 'fs2',
    variable_level_3: 'fs3',
    detailed_variable: 'fsd'
}

/**
 * Encodes a Science Keyword Facet object into a flat object with encoded keys
 * @param {object} scienceKeywords Science Keyword Facet object
 * @return {object} A flat object with encoded Science Keyword keys
 */
export const encodeScienceKeywords = (scienceKeywords) => {
    if (!scienceKeywords) return ''
    if (Object.keys(scienceKeywords).length === 0) return ''

    const encoded = {}
    scienceKeywords.forEach((keyword, index) => {
        Object.keys(keyword).forEach((key) => {
            encoded[`${scienceKeywordMapping[key]}${index}`] = keyword[key]
        })
    })

    return encoded
}


/**
 * Decodes a parameter object into a Science Keyword object
 * @param {object} params URL parameter object from parsing the URL parameter string
 * @return {object} Science Keyword Facet object
 */
export const decodeScienceKeywords = (params) => {
    if (Object.keys(params).length === 0) return undefined

    const decoded = []
    Object.keys(params).forEach((encodedKey) => {
        // All of the science keyword facets have an index as the last character of the key
        // Strip off the last character and check the mapping if it exists
        const key = encodedKey.slice(0, -1)
        const index = encodedKey.slice(-1)

        const decodedKey = getObjectKeyByValue(scienceKeywordMapping, key)
        if (decodedKey) {
            // Update the decoded index with value
            if (decoded[index] === undefined) decoded[index] = {}
            decoded[index][decodedKey] = params[encodedKey]
        }
    })

    if (decoded.length > 0) return decoded

    return undefined
}

/**
 * Encodes a Temporal object into a string
 * @param {object} temporal Temporal object
 * @return {string} A `,` delimited string of the temporal values
 */
export const encodeTemporal = (temporal) => {
    if (!temporal) return undefined

    const {
        endDate,
        startDate,
        recurringDayStart,
        recurringDayEnd,
        isRecurring
    } = temporal

    const valuesToEncode = [
        startDate,
        endDate
    ]

    if (isRecurring) {
        valuesToEncode.push(...[recurringDayStart, recurringDayEnd])
    }

    const encodedString = valuesToEncode.filter(Boolean).join(',')

    // TODO: Strip empty elements then join
    if (encodedString === '') return undefined

    return encodedString
}

/**
 * Mapping of timeline zoom levels. The Timeline (sometimes) and URL use numbers, CMR uses words
 */
export const timelineIntervals = {
    minute: '2',
    hour: '3',
    day: '4',
    month: '5',
    year: '6'
}

/**
 * Decodes a Temporal parameter string into an object
 * @param {string} string A `,` delimited string of the temporal values
 * @return {object} Temporal object
 */
export const decodeTemporal = (string) => {
    if (!string) {
        return {}
    }

    const [
        startDate,
        endDate,
        recurringDayStart = '',
        recurringDayEnd = ''
    ] = string.split(',')

    const isRecurring = !!(recurringDayStart && recurringDayEnd)

    const temporal = {
        endDate,
        startDate,
        recurringDayStart,
        recurringDayEnd,
        isRecurring
    }

    return {
        ...temporal
    }
}

/**
 * Encodes a Timeline object into an encoded object
 * @param {object} timelineQuery Timeline query object
 * @param {string} pathname Pathname string from react-router
 * @return {string} A `!` delimited string of the timeline values
 */
export const encodeTimeline = (timelineQuery, pathname) => {
    if (pathname === '/search') return ''
    if (!timelineQuery) return ''

    const {
        center,
        interval,
        start,
        end
    } = timelineQuery

    if (!center && !start && !end) return ''

    const encodedStart = start || ''
    const encodedEnd = end || ''

    const encodedString = [center, timelineIntervals[interval], encodedStart, encodedEnd].join('!')
    // if there is no center, return an empty string
    if (encodedString[0] === '!') return ''

    return {
        tl: encodedString
    }
}


/**
 * Decodes a parameter object into a Timeline object
 * @param {object} params URL parameter object from parsing the URL parameter string
 * @return {object} Timeline object with query and state
 */
export const decodeTimeline = (params) => {
    const { tl: timeline } = params

    if (!timeline) return undefined

    const [center, intervalNum, start, end] = timeline.split('!')

    const interval = getObjectKeyByValue(timelineIntervals, intervalNum)
    const query = {
        center: parseInt(center, 10) || undefined,
        end: parseInt(end, 10) || undefined,
        interval,
        start: parseInt(start, 10) || undefined
    }

    return query
}

/**
 * Encode a list of Granule IDs
 * @param {boolean} isCwic Are the granules CWIC
 * @param {array} granuleIds List of granule IDs
 */
const encodeGranules = (isCwic, granuleIds) => {
    // On page log, isCwic hasn't been determined yet
    // temporary fix, if the granule doesn't start with G, it is CWIC
    const [firstGranuleId] = granuleIds

    if (isCwic || isNumber(firstGranuleId)) {
        return granuleIds.join('!')
    }

    // CMR Granule Ids
    // G12345-PROVIDER
    const provider = granuleIds[0].split('-')[1]
    const formattedGranuleIds = granuleIds.map(granuleId => granuleId.split('G')[1].split('-')[0])

    return `${formattedGranuleIds.join('!')}!${provider}`
}

/**
 * Decode a string of Granule IDs
 * @param {string} excludedGranules Encoded Granule IDs
 */
const decodedGranules = (key, granules) => {
    const keys = Object.keys(granules)

    let result = {
        isCwic: false,
        granuleIds: []
    }

    if (keys.indexOf(key) !== -1) {
        const { [key]: decodedGranules } = granules
        const granulesList = decodedGranules.split('!')
        const provider = granulesList.pop()
        const granuleIds = granulesList.map(granuleId => `G${granuleId}-${provider}`)

        result = {
            isCwic: false,
            granuleIds
        }
    }
    if (keys.indexOf(`c${key}`) !== -1) {
        const { [`c${key}`]: decodedGranules } = granules
        const granuleIds = decodedGranules.split('!')

        result = {
            isCwic: true,
            granuleIds
        }
    }
    return result
}

const encodeSelectedVariables = (projectCollection) => {
    if (!projectCollection) return null

    const {
        accessMethods,
        selectedAccessMethod
    } = projectCollection

    if (!accessMethods || !selectedAccessMethod) return null

    const selectedMethod = accessMethods[selectedAccessMethod]
    const {
        selectedVariables
    } = selectedMethod

    if (!selectedVariables) return null

    return selectedVariables.join('!')
}

const encodeOutputFormat = (projectCollection) => {
    if (!projectCollection) return null

    const {
        accessMethods,
        selectedAccessMethod
    } = projectCollection

    if (!accessMethods || !selectedAccessMethod) return null

    const selectedMethod = accessMethods[selectedAccessMethod]
    const {
        selectedOutputFormat
    } = selectedMethod

    if (!selectedOutputFormat) return null

    return selectedOutputFormat
}

const encodeAddedGranules = (isCwic, projectCollection) => {
    if (!projectCollection) return null

    const {
        addedGranuleIds = []
    } = projectCollection

    if (!addedGranuleIds.length) return null

    return encodeGranules(isCwic, addedGranuleIds)
}

const encodeRemovedGranules = (isCwic, projectCollection) => {
    if (!projectCollection) return null

    const {
        removedGranuleIds = []
    } = projectCollection

    if (!removedGranuleIds.length) return null

    return encodeGranules(isCwic, removedGranuleIds)
}

const decodedSelectedVariables = (pgParam) => {
    const { uv: variableIds } = pgParam

    if (!variableIds) return undefined

    return variableIds.split('!')
}

const decodedOutputFormat = (pgParam) => {
    const { of: outputFormat } = pgParam

    return outputFormat
}

/**
 * Encodes a Collections object into an object
 * @param {object} collections Collections object
 * @param {string} focusedCollection Focused Collection ID
 * @return {string} An object with encoded Collections
 */
export const encodeCollections = (props) => {
    const {
        collections = {},
        focusedCollection,
        project = {}
    } = props

    const { byId } = collections
    const {
        byId: projectById = {},
        collectionIds: projectIds = []
    } = project

    // pParameter - focusedCollection!projectCollection1!projectCollection2
    const pParameter = [
        focusedCollection,
        ...projectIds
    ].join('!')

    // If there isn't a focusedCollection or any projectIds, we don't see to continue
    if (pParameter === '') return ''

    // pgParameter - excluded granules and granule filters based on pParameter collections
    const pgParameter = []
    if (byId) {
        pParameter.split('!').forEach((collectionId, index) => {
            let pg = {}

            // if the focusedCollection is also in projectIds, don't encode the focusedCollection
            if (index === 0 && projectIds.indexOf(focusedCollection) !== -1) {
                pgParameter[index] = pg
                return
            }

            const collection = byId[collectionId]
            if (!collection) {
                pgParameter[index] = pg
                return
            }

            const projectCollection = projectById[collectionId]

            // excludedGranules
            let encodedExcludedGranules
            const {
                excludedGranuleIds = [],
                granules,
                granuleFilters,
                isVisible,
                isCwic
            } = collection

            const excludedKey = isCwic ? 'cx' : 'x'

            if (granules && excludedGranuleIds.length > 0) {
                encodedExcludedGranules = encodeGranules(isCwic, excludedGranuleIds)
            }

            if (encodedExcludedGranules) pg[excludedKey] = encodedExcludedGranules

            let encodedAddedGranules
            let encodedRemovedGranules
            const addedKey = isCwic ? 'ca' : 'a'
            const removedKey = isCwic ? 'cr' : 'r'

            // Encode granules added to the current project
            if (
                projectCollection
                && projectCollection.addedGranuleIds
                && projectCollection.addedGranuleIds.length > 0
            ) {
                encodedAddedGranules = encodeAddedGranules(isCwic, projectCollection)
            }

            // Encode granules removed from the current project
            if (
                projectCollection
                && projectCollection.removedGranuleIds
                && projectCollection.removedGranuleIds.length > 0
            ) {
                encodedRemovedGranules = encodeRemovedGranules(isCwic, projectCollection)
            }

            if (encodedAddedGranules) pg[addedKey] = encodedAddedGranules
            if (encodedRemovedGranules) pg[removedKey] = encodedRemovedGranules

            // Collection visible, don't encode the focusedCollection
            if (index !== 0 && isVisible) pg.v = 't'

            // Add the granule encoded granule filters
            if (granuleFilters) {
                pg = { ...pg, ...encodeGranuleFilters(granuleFilters) }
            }

            // Encode selected variables
            pg.uv = encodeSelectedVariables(projectCollection)

            // Encode selected output format
            pg.of = encodeOutputFormat(projectCollection)

            pgParameter[index] = pg
        })
    }

    const encoded = {
        p: pParameter,
        pg: pgParameter
    }

    return encoded
}


/**
 * Decodes a parameter object into a Collections object
 * @param {object} params URL parameter object from parsing the URL parameter string
 * @return {object} Collections object
 */
export const decodeCollections = (params) => {
    if (Object.keys(params).length === 0) return {}

    const { p, pg } = params
    if (!p && !pg) return {}

    let focusedCollection = ''
    let collections
    let project
    const allIds = []
    const byId = {}
    const projectIds = []
    const projectById = {}

    p.split('!').forEach((collectionId, index) => {
        // If there is no collectionId, move on to the next index
        // i.e. there is no focusedCollection
        if (collectionId === '') return

        // Add collectionId to correct allIds and projectIds
        if (allIds.indexOf(collectionId) === -1) allIds.push(collectionId)
        if (index > 0) projectIds.push(collectionId)

        // Set the focusedCollection
        if (index === 0) focusedCollection = collectionId

        let excludedGranuleIds = []
        let addedGranuleIds = []
        let removedGranuleIds = []
        let granuleFilters = {}
        let selectedOutputFormat
        let isCwic
        let excludedIsCwic
        let addedIsCwic
        let removedIsCwic
        let isVisible = false

        let variableIds
        if (pg && pg[index]) {
            // Excluded Granules
            ({ isCwic: excludedIsCwic, granuleIds: excludedGranuleIds } = decodedGranules('x', pg[index]));

            ({ isCwic: addedIsCwic, granuleIds: addedGranuleIds = [] } = decodedGranules('a', pg[index]));

            ({ isCwic: removedIsCwic, granuleIds: removedGranuleIds = [] } = decodedGranules('r', pg[index]))

            isCwic = excludedIsCwic || addedIsCwic || removedIsCwic

            // Collection visible
            const { v: visible = '' } = pg[index]
            if (visible === 't') isVisible = true

            // Decode selected variables
            variableIds = decodedSelectedVariables(pg[index])

            // Decode granule filters
            granuleFilters = decodeGranuleFilters(pg[index])

            // Decode output format
            selectedOutputFormat = decodedOutputFormat(pg[index])
        }

        // Populate the collection object for the redux store
        byId[collectionId] = {
            excludedGranuleIds,
            granules: {},
            granuleFilters,
            isCwic,
            isVisible,
            metadata: {}
        }

        if (index > 0) {
            projectById[collectionId] = {}
        }

        if (variableIds || selectedOutputFormat) {
            projectById[collectionId] = {
                accessMethods: {
                    opendap: {
                        selectedVariables: variableIds,
                        selectedOutputFormat
                    }
                }
            }
        }

        if (addedGranuleIds.length && projectById[collectionId]) {
            projectById[collectionId].addedGranuleIds = addedGranuleIds
        }

        if (removedGranuleIds.length && projectById[collectionId]) {
            projectById[collectionId].removedGranuleIds = removedGranuleIds
        }
    })

    // if no decoded collections information exists, return undfined for collections
    if (pg || projectIds.length > 0) {
        collections = {
            allIds,
            byId
        }

        project = {
            byId: projectById,
            collectionIds: projectIds
        }
    }

    return {
        collections,
        focusedCollection,
        project
    }
}

/**
 * Encodes a granule filters object into an object.
 * @param {Object} granuleFilters - The granule filters object.
 * @return {String} An object with encoded granule filters.
 */
export const encodeGranuleFilters = (granuleFilters) => {
    const pg = {}
    if (granuleFilters.temporal) pg.qt = encodeTemporal(granuleFilters.temporal)
    if (granuleFilters.dayNightFlag) pg.dnf = granuleFilters.dayNightFlag
    if (granuleFilters.browseOnly) pg.bo = granuleFilters.browseOnly
    if (granuleFilters.onlineOnly) pg.oo = granuleFilters.onlineOnly
    if (granuleFilters.cloudCover) pg.cc = granuleFilters.cloudCover
    if (granuleFilters.orbitNumber) pg.on = granuleFilters.orbitNumber
    if (granuleFilters.equatorCrossingLongitude) pg.ecl = granuleFilters.equatorCrossingLongitude
    if (granuleFilters.readableGranuleName) pg.id = granuleFilters.readableGranuleName.join('!')
    if (granuleFilters.equatorCrossingDate) {
        pg.ecd = encodeTemporal(granuleFilters.equatorCrossingDate)
    }
    if (granuleFilters.sortKey) pg.gsk = granuleFilters.sortKey

    return pg
}

/**
 * Decodes part of the decoded ?pg url parameter into a granule filters object
 * @param {Object} params - URL parameter object from parsing the URL parameter string
 * @return {Object} A granule filters object
 */
export const decodeGranuleFilters = (params = {}) => {
    const granuleFilters = {}
    if (params.qt) granuleFilters.temporal = decodeTemporal(params.qt)
    if (params.dnf) granuleFilters.dayNightFlag = params.dnf
    if (params.bo) granuleFilters.browseOnly = params.bo === 'true'
    if (params.oo) granuleFilters.onlineOnly = params.oo === 'true'
    if (params.cc) granuleFilters.cloudCover = params.cc
    if (params.on) granuleFilters.orbitNumber = params.on
    if (params.ecl) granuleFilters.equatorCrossingLongitude = params.ecl
    if (params.id) granuleFilters.readableGranuleName = params.id.split('!')
    if (params.ecd) granuleFilters.equatorCrossingDate = decodeTemporal(params.ecd)
    if (params.gsk) granuleFilters.sortKey = params.gsk

    return granuleFilters
}

/**
 * Returns true the string contains only number characters and false if there are any non-number characters
 * @return {boolean}
 */
const reg = new RegExp(/^\d+$/)
export const isNumber = string => reg.test(string)

export const encodeGridCoords = (gridCoords) => {
    if (!gridCoords) return ''

    const encodedCoords = gridCoords
        .trim()
        .replace(/,/g, ':')
        .replace(/\s+/g, ',')
        .replace(/(^|,)(\d+)($|:)/g, '$1$2-$2$3')
        .replace(/(^|:)(\d+)($|,)/g, '$1$2-$2$3')

    return encodedCoords
}

export const decodeGridCoords = (string) => {
    if (!string) return undefined

    const decodedString = string
        .replace(/,/g, ' ')
        .replace(/:/g, ',')
        .replace(/(\d+)-(\d+)/g, (m, m0, m1) => {
            if (m0 === m1) return m0
            return m
        })

    return decodedString
}

/**
 * Encodes hasGranulesOrCwic
 * @param {object} hasGranulesOrCwic hasGranulesOrCwic value from redux store
 * @return {string} Encoded value for hasGranulesOrCwic
 */
export const encodeHasGranulesOrCwic = (hasGranulesOrCwic) => {
    // When we have undefined in the store, the encoded value is true (ac=true)
    if (!hasGranulesOrCwic) return true

    // When we have true in the store, we don't encode the value
    return ''
}


/**
 * Decodes hasGranulesOrCwic
 * @param {string} value Encoded value for hasGranulesOrCwic
 * @return {object} Decoded hasGranulesOrCwic value
 */
export const decodeHasGranulesOrCwic = (value) => {
    // When we see true in the url, we do not store hasGranulesOrCwic in the store
    if (value === 'true') return undefined

    // If we do not see the ac param in the store, we save hasGranulesOrCwic=true in the store
    return true
}

/**
 * Encodes the Advanced Search params into an object
 * @param {Object} advancedSearch advancedSearch object from the store
 */
export const encodeAdvancedSearch = (advancedSearch) => {
    if (!advancedSearch) return ''

    const { regionSearch } = advancedSearch

    if (!regionSearch) return ''

    const { selectedRegion } = regionSearch

    if (!selectedRegion) return ''

    return {
        sr: {
            ...selectedRegion
        }
    }
}

/**
 * Decodes a parameter object into an advancedSearch object
 * @param {Object} params URL parameter object from parsing the URL parameter string
 */
export const decodeAdvancedSearch = (params) => {
    if (Object.keys(params).length === 0) return undefined

    const { sr } = params
    if (!sr) return undefined

    const advancedSearch = {
        regionSearch: {
            selectedRegion: {
                ...sr
            }
        }
    }

    return advancedSearch
}

import { isEmpty } from 'lodash'

/**
 * Encodes the Autocomplete Selected params into an object
 * @param {Object} selected autocomplete selected object from the store
 */
export const encodeAutocomplete = (selected) => {
    if (!selected || selected.length === 0) return ''

    const param = {}
    selected.forEach(({ type, fields }) => {
        if (Object.keys(param).includes(type)) {
            param[type].push(fields)
        } else {
            param[type] = [fields]
        }
    })

    return param
}

/**
 * Decodes a parameter object into an Autocomplete Selected array
 * @param {Object} params URL parameter object from parsing the URL parameter string
 */
export const decodeAutocomplete = (params) => {
    if (!params || isEmpty(params)) return undefined

    const values = []

    Object.keys(params).forEach((key) => {
        const items = params[key]
        Object.keys(items).forEach((index) => {
            // Pull out the colon delimited value
            const fields = items[index]

            // Split the fields and pop the last element (which represents the leaf node)
            const value = fields.split(':').slice(-1)

            // slice returns an array, select the element
            const [selectedValue] = value

            values.push({ type: key, fields: items[index], value: selectedValue })
        })
    })

    return values
}