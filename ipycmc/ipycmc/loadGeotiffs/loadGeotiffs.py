from cogeo_mosaic.mosaic import MosaicJSON
from concurrent import futures
from rio_tiler.io import COGReader
import requests
import copy
from rasterio.enums import Resampling
from rio_tiler.colormap import cmap
import requests
import json
#import yaml
#from . import variables
#from . import testing
from . import errorChecking
from . import extractInfoLinks

json_file_name = "variables.json"
global required_start
global required_end
global defaults_tiler
global endpoints_tiler
global tiler_extensions
global endpoint_published_data
global errors_tiler
global accepted_arguments_tiler
global mosaicjson_file_name
global general_error_warning_tiler
global required_class_types_args_tiler
global xml_beginning

accepted_arguments_default_ops = {"TileMatrixSetId":[(entry["id"]) for entry in requests.get("https://api.cogeo.xyz/tileMatrixSets").json()["tileMatrixSets"]], 
                                 "resampling_method": [(r.name) for r in Resampling], 
                                 "colormap_name": cmap.list()}

# Main function that returns a url or None in case of error back to widget.py and calls other functions in this file
def loadGeotiffs(urls, default_ops):
    #files = [f for f in os.listdir('.') if os.path.isfile(f)]
    #for f in files:
    #    print(f)

    initialize_variables()
    errorChecking.initialize_variables(json_file_name, accepted_arguments_default_ops)

    # Check the type and format of the URLs passed into the function
    if errorChecking.check_valid_arguments(urls) == False:
        return None
    
    # If single GeoTIFF file, execute the functions for a single GeoTIFF to wmts tiles and pass to CMC
    if isinstance(urls, str) and extractInfoLinks.file_ending(urls):
        return create_request_single_geotiff(urls, default_ops)

    # If folder of geoTiff links, execute the functions for a list or single GeoTIFF(s) to make a mosaic JSON
    if isinstance(urls, str) and not extractInfoLinks.file_ending(urls):
        return create_request_folder_geotiffs(urls, default_ops)

    # Execute the functions for a list of GeoTIFF to make a mosaic JSON
    if isinstance(urls, list):
        return create_request_multiple_geotiffs(urls, default_ops)

# Constructs the url to be passed to the Tiler to request the wmts tiles for a single GeoTIFF.
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_single_geotiff(s3Url, default_ops):
    endpoint_tiler = extractInfoLinks.determine_environment(s3Url)
    # None being returns means that the link is published, use the Tiler ops endpoint as a default
    if endpoint_tiler == None:
        endpoint_tiler = endpoint_published_data
    newUrl = endpoint_tiler + tiler_extensions.get("single") + "url=" + s3Url
    newUrl = add_defaults_url(newUrl, default_ops)
    if newUrl == None:
        return None
    if errorChecking.check_errors_request_url(newUrl):
        return None
    return newUrl

# Constructs the url to be passed to the Tiler to request the wmts tiles for the GeoTIFF(s) in the given folder
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_folder_geotiffs(urls, default_ops):
    geotiffs = extractInfoLinks.extract_geotiff_links(urls)
    if len(geotiffs) == 0:
        print("No GeoTIFFs found in the given folder.")
        return None
    elif len(geotiffs) == 1:
        return create_request_single_geotiff(geotiffs[0], default_ops)
    else:
        return create_request_multiple_geotiffs(geotiffs, default_ops)

# Constructs the url to be passed to the Tiler to request the wmts tiles for a mosaic JSON created by multiple GeoTIFFs
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_multiple_geotiffs(urls, default_ops):
    endpoint_tiler = extractInfoLinks.determine_environment_list(urls)
    if not errorChecking.tiler_can_access_links(urls):
        return None
    mosaic_json_url = create_mosaic_json_url(urls)
    if mosaic_json_url == None:
        print("Code not set up for published links so not working")
        return None
    newUrl = endpoint_tiler + tiler_extensions.get("multiple") + "url=" + mosaic_json_url
    newUrl = add_defaults_url(newUrl, default_ops)
    if newUrl == None:
        return None
    if errorChecking.check_errors_request_url(newUrl):
        return None
    return newUrl

# Returns the list for a mosaic JSON for the given s3 links. Returns None in case of error and prints the appropriate error message
def create_mosaic_json_url(urls):
    mosaic_data = create_mosaic_json(urls)
    #print(mosaic_data)
    
    # TODO try writing to where the first link is?
    f = open(mosaicjson_file_name, "w")
    f.write(mosaic_data)
    f.close()
    
    bucket_name = errorChecking.determine_valid_bucket(urls[0])
    if bucket_name == None:
        mosaic_data_link = None # TODO this means the data is published and it does not work for published data yet
    else:
        mosaic_data_link = required_start[0] + bucket_name + extractInfoLinks.get_file_path(urls[0]) + "/" + mosaicjson_file_name
    return mosaic_data_link

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
    temp_defaults_tiler = copy.copy(defaults_tiler)
    # If given no default_ops, this for loop will not run and all the rest of the default values will just be added
    for key in default_ops:
        defaultValues = defaultValues + "&" + key + "=" + default_ops[key]
        if key in temp_defaults_tiler:
            temp_defaults_tiler.pop(key, None)
            
    # When finished with user's arguments, add the rest of the default values
    for key in temp_defaults_tiler:
        defaultValues = defaultValues + "&" + key + "=" + str(defaults_tiler[key])
                    
    url = url + defaultValues
    return url

def initialize_variables():
    f = open(json_file_name, "r")
    dictionary = json.loads(f.read())
    
    # Initialize all the variables
    global required_start
    required_start = dictionary["required_start"]
    global required_end
    required_end = dictionary["required_end"]
    global defaults_tiler
    defaults_tiler = dictionary["defaults_tiler"]
    global endpoints_tiler
    endpoints_tiler = dictionary["endpoints_tiler"]
    global tiler_extensions
    tiler_extensions = dictionary["tiler_extensions"]
    global endpoint_published_data
    endpoint_published_data = dictionary["endpoint_published_data"]
    global errors_tiler
    errors_tiler = dictionary["errors_tiler"]
    global accepted_arguments_tiler
    accepted_arguments_tiler = dictionary["accepted_arguments_tiler"]
    global mosaicjson_file_name
    mosaicjson_file_name = dictionary["mosaicjson_file_name"]
    global general_error_warning_tiler
    general_error_warning_tiler = dictionary["general_error_warning_tiler"]
    global required_class_types_args_tiler
    required_class_types_args_tiler = dictionary["required_class_types_args_tiler"]
    global xml_beginning
    xml_beginning = dictionary["xml_beginning"]
    
