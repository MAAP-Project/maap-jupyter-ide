// Whitelist parameters supplied by the request
export const permittedCmrKeys = [
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

export const nonIndexedKeys = [
    'concept_id',
    'exclude',
    'readable_granule_name',
    'sort_key'
]