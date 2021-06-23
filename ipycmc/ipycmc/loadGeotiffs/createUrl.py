"""
This file has all the load_geotiffs helper methods that help create

Written by Grace Llewellyn
"""

from cogeo_mosaic.mosaic import MosaicJSON
from concurrent import futures
from rio_tiler.io import COGReader
import copy
from . import errorChecking
import os

global required_info

def initialize_required_info(required_info_given):
    global required_info
    required_info = required_info_given

# Returns the list for a mosaic JSON for the given s3 links. Returns None in case of error and prints the appropriate error message
def create_mosaic_json_url(urls):
    mosaic_data = create_mosaic_json_from_urls(urls)
    print(mosaic_data)
    
    # TODO try writing to where the first link is?
    f = open(required_info.mosaicjson_file_name, "w")
    f.write(mosaic_data)
    f.close()
    
    bucket_name = errorChecking.determine_valid_bucket(urls[0])
    if bucket_name == None:
        print("Code not set up for published links so not working.")
        mosaic_data_link = None # TODO this means the data is published and it does not work for published data yet, will work when I know how to determine current bucket
    else:
        mosaic_data_link = create_s3_link_mosaic(bucket_name, os.getcwd())
        print("Mosaic json file path: " + str(mosaic_data_link))
    return mosaic_data_link

def create_s3_link_mosaic(bucket_name, mosaic_path):
    mosaic_s3_link = required_info.required_start[0] + bucket_name + "/"
    if not os.getenv('PWD').startswith('/projects'):
        print("Currently, capabilities for writing mosaic JSONs to s3 only work for maap-ops-workspace and maap-ops-dataset.")
        return None
    if (bucket_name == "maap-ops-workspace"):
        if required_info.public_bucket_path in mosaic_path:
            mosaic_s3_link = mosaic_s3_link + "shared/" + os.getenv(required_info.workspace_namespace) + mosaic_path[len(os.getenv(required_info.env_home)+required_info.public_bucket_path):]
        elif required_info.private_bucket_path in mosaic_path:
            mosaic_s3_link = mosaic_s3_link + os.getenv(required_info.workspace_namespace) + mosaic_path[len(os.getenv(required_info.env_home)+required_info.private_bucket_path):]
    elif (bucket_name == "maap-ops-dataset"):
        mosaic_s3_link = mosaic_s3_link + mosaic_path[len(os.getenv(required_info.env_home)):]
    else:
        print(bucket_name + " workspace not supported to writing mosaic JSON files and reading them.")
        return None
    return mosaic_s3_link + "/" + required_info.mosaicjson_file_name

# Creates a variable representing a mosaic JSON to pass to the Tiler
def create_mosaic_json(urls):
    files = [
        dict(
            path=l,
        )
        for l in urls
    ]

    with futures.ThreadPoolExecutor(max_workers=5) as executor:
        features = [r for r in executor.map(worker, files) if r]

    if features == []:
        features = [{'geometry': {'type': 'Polygon',
            'coordinates': [[[-101.00013888888888, 46.00013888888889],
                [-101.00013888888888, 44.999861111111116],
                [-99.9998611111111, 44.999861111111116],
                [-99.9998611111111, 46.00013888888889],
                [-101.00013888888888, 46.00013888888889]]]},
            'properties': {'path': 's3://nasa-maap-data-store/file-staging/nasa-map/SRTMGL1_COD___001/N45W101.SRTMGL1.tif'},
            'type': 'Feature'},
            {'geometry': {'type': 'Polygon',
            'coordinates': [[[-102.00013888888888, 46.00013888888889],
                [-102.00013888888888, 44.999861111111116],
                [-100.9998611111111, 44.999861111111116],
                [-100.9998611111111, 46.00013888888889],
                [-102.00013888888888, 46.00013888888889]]]},
            'properties': {'path': 's3://nasa-maap-data-store/file-staging/nasa-map/SRTMGL1_COD___001/N45W102.SRTMGL1.tif'},
            'type': 'Feature'}]
    
    return MosaicJSON.from_features(features, minzoom=10, maxzoom=18).json()
    
def create_mosaic_json_from_urls(urls):
    os.environ['CURL_CA_BUNDLE']='/etc/ssl/certs/ca-certificates.crt'
    return MosaicJSON.from_urls(urls)

# Fuction provided by Development Seed. Creates the features for each geoTIFF in the mosaic JSON
def worker(meta):
    try:
        with COGReader(meta["path"]) as cog:
            wgs_bounds = cog.bounds
    except:
        return {}
    return {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [wgs_bounds[0], wgs_bounds[3]],
                    [wgs_bounds[0], wgs_bounds[1]],
                    [wgs_bounds[2], wgs_bounds[1]],
                    [wgs_bounds[2], wgs_bounds[3]],
                    [wgs_bounds[0], wgs_bounds[3]]
                ]
            ]
        },
        "properties": meta,
        "type": "Feature"
    }

# Adds the specified defaults onto the url taking user input into account. Returns None if errors in the user-given default arguments
def add_defaults_url(url, default_ops):
    if not errorChecking.check_valid_default_arguments(default_ops):
        return None

    defaultValues = ""
    temp_defaults_tiler = copy.copy(required_info.defaults_tiler)
    # If given no default_ops, this for loop will not run and all the rest of the default values will just be added
    for key in default_ops:
        defaultValues = defaultValues + "&" + key + "=" + default_ops[key]
        if key in temp_defaults_tiler:
            temp_defaults_tiler.pop(key, None)
            
    # When finished with user's arguments, add the rest of the default values
    for key in temp_defaults_tiler:
        defaultValues = defaultValues + "&" + key + "=" + str(required_info.defaults_tiler[key])
                    
    url = url + defaultValues
    return url