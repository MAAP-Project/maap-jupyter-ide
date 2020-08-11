/**
 * Whitelist parameters supplied by the request
 * Modified from https://github.com/nasa/earthdata-search/blob/f09ff3bfd40420322f005654bc349374aab1fe57/static/src/js/util/request/granuleRequest.js
 */
export const granulePermittedCmrKeys = [
    'concept_id',
    'bounding_box',
    'circle',
    'browse_only',
    'cloud_cover',
    'day_night_flag',
    'echo_collection_id',
    'equator_crossing_date',
    'equator_crossing_longitude',
    'exclude',
    'line',
    'online_only',
    'options',
    'orbit_number',
    'page_num',
    'page_size',
    'point',
    'polygon',
    'readable_granule_name',
    'sort_key',
    'temporal',
    'two_d_coordinate_system'
]

export const granuleNonIndexedKeys = [
    'concept_id',
    'exclude',
    'readable_granule_name',
    'sort_key'
]

// Whitelist parameters supplied by the request
export const collectionPermittedCmrKeys = [
    'bounding_box',
    'circle',
    'collection_data_type',
    'concept_id',
    'data_center_h',
    'data_center',
    'echo_collection_id',
    'facets_size',
    'format',
    'granule_data_format',
    'granule_data_format_h',
    'has_granules_or_cwic',
    'has_granules',
    'include_facets',
    'include_granule_counts',
    'include_has_granules',
    'include_tags',
    'instrument',
    'instrument_h',
    'keyword',
    'line',
    'options',
    'page_num',
    'page_size',
    'platform',
    'platform_h',
    'point',
    'polygon',
    'processing_level_id_h',
    'project_h',
    'project',
    'provider',
    'science_keywords_h',
    'sort_key',
    'spatial_keyword',
    'tag_key',
    'temporal',
    'two_d_coordinate_system'
]

export const collectionNonIndexedKeys = [
    'collection_data_type',
    'concept_id',
    'data_center_h',
    'granule_data_format',
    'granule_data_format_h',
    'instrument',
    'instrument_h',
    'platform',
    'platform_h',
    'processing_level_id_h',
    'project_h',
    'provider',
    'sort_key',
    'spatial_keyword',
    'tag_key'
]