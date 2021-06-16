import re
from cogeo_mosaic.mosaic import MosaicJSON
from concurrent import futures
from rio_tiler.io import COGReader
import requests
import copy
import boto3
from rasterio.enums import Resampling
from rio_tiler.colormap import cmap
import requests
#import yaml

yml_file_name = "variables.yml"
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

    initialize_variables()

    # Check the type and format of the URLs passed into the function
    if check_valid_arguments(urls) == False:
        return None
    
    # If single GeoTIFF file, execute the functions for a single GeoTIFF to wmts tiles and pass to CMC
    if isinstance(urls, str) and file_ending(urls):
        return create_request_single_geotiff(urls, default_ops)

    # If folder of geoTiff links, execute the functions for a list or single GeoTIFF(s) to make a mosaic JSON
    if isinstance(urls, str) and not file_ending(urls):
        return create_request_folder_geotiffs(urls, default_ops)

    # Execute the functions for a list of GeoTIFF to make a mosaic JSON
    if isinstance(urls, list):
        return create_request_multiple_geotiffs(urls, default_ops)

# Constructs the url to be passed to the Tiler to request the wmts tiles for a single GeoTIFF.
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_single_geotiff(s3Url, default_ops):
    endpoint_tiler = determine_environment(s3Url)
    # None being returns means that the link is published, use the Tiler ops endpoint as a default
    if endpoint_tiler == None:
        endpoint_tiler = endpoint_published_data
    newUrl = endpoint_tiler + tiler_extensions.get("single") + "url=" + s3Url
    newUrl = add_defaults_url(newUrl, default_ops)
    if newUrl == None:
        return None
    if check_errors_request_url(newUrl):
        return None
    return newUrl

# Constructs the url to be passed to the Tiler to request the wmts tiles for the GeoTIFF(s) in the given folder
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_folder_geotiffs(urls, default_ops):
    geotiffs = extract_geotiff_links(urls)
    if len(geotiffs) == 0:
        print("No GeoTIFFs found in the given folder.")
        return None
    elif len(geotiffs) == 1:
        return create_request_single_geotiff(geotiffs[0], default_ops)
    else:
        return create_request_multiple_geotiffs(geotiffs, default_ops)


# Prints the appriopriate error message if error contained in the request url text and then returns True if errors exist
# Try to keep track of the errors that I recognize, but might be another error that starts with "detail", so just print the given error
# message from the Tiler even though it does not always make the most sense
def check_errors_request_url(request_url):
    response = requests.get(request_url).text
    for error in errors_tiler:
        if error in response:
            print(errors_tiler[error])
            return True
    if response[0] == xml_beginning:
        print(general_error_warning_tiler + response)
        return True
    return False

# Constructs the url to be passed to the Tiler to request the wmts tiles for a mosaic JSON created by multiple GeoTIFFs
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_multiple_geotiffs(urls, default_ops):
    endpoint_tiler = determine_environment_list(urls)
    if not tiler_can_access_links(urls):
        return None
    mosaic_json_url = create_mosaic_json_url(urls)
    if mosaic_json_url == None:
        print("Code not set up for published links so not working")
        return None
    newUrl = endpoint_tiler + tiler_extensions.get("multiple") + "url=" + mosaic_json_url
    newUrl = add_defaults_url(newUrl, default_ops)
    if newUrl == None:
        return None
    if check_errors_request_url(newUrl):
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
    
    bucket_name = determine_valid_bucket(urls[0])
    if bucket_name == None:
        mosaic_data_link = None # TODO this means the data is published and it does not work for published data yet
    else:
        mosaic_data_link = required_start[0] + bucket_name + get_file_path(urls[0]) + "/" + mosaicjson_file_name
    return mosaic_data_link

# Determine if the bucket name extracted is a valid bucket name. Returns the bucket name if it is a valid bucket and returns None otherwise
def determine_valid_bucket(s3Url):
    bucket_name = extract_bucket_name(s3Url)
    if bucket_name == None:
        return None
    for key in endpoints_tiler:
        # If the bucket is a valid environment, return that bucket name
        if bucket_name == key:
            return bucket_name
    return None

# Assumes that the file exists in a valid bucket and gives the file path without the s3://bucket-name from the url and the .tif file ending
def get_file_path(url):
    file_path = url[len(required_start[0]):]
    beginning_tif_file = file_path.rfind("/")
    ending_bucket_name = file_path.find("/")
    if (ending_bucket_name == beginning_tif_file):
        # NOTE: might not be a problem?
        print("Please place the file into your workspace and not directly in the environment.")
        return None
    file_path = file_path[ending_bucket_name:beginning_tif_file]
    return file_path

# Assumes that the folder exists in a valid bucket and gives the file path without the s3://bucket-name from the url 
def get_file_path_folder(url):
    file_path = url[len(required_start[0]):]
    ending_bucket_name = file_path.find("/")
    file_path = file_path[ending_bucket_name+1:]
    return file_path


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
    if not check_valid_default_arguments(default_ops):
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
        defaultValues = defaultValues + "&" + key + "=" +defaults_tiler[key]
                    
    url = url + defaultValues
    return url

# Determines if the Tiler can access the links by passing them link a single GeoTIFF into the file. The create_request_single_geotiff function only returns
# None if the default ops are incorrect (impossible because we are passing an empty list) or the response of the request url contains errors
def tiler_can_access_links(urls):
    for url in urls:
        if create_request_single_geotiff(url, {}) == None:
            print("Invalid url: " + url + ".")
            return False
    return True


# Given a string representing a s3 link, checks that the link begins with s3://. If this is not true, prints appropriate error messages
# and returns False. Can add other checks in this function to check the s3 link. Check for ending with .tiff is elsewhere in the function
def check_valid_s3_link(s3Link):  
    # Checks the beginning type of the s3 link is s3://
    for valid_start in required_start:
        if s3Link[:len(valid_start)] == valid_start:
            return True
    print("Invalid s3 link: "+s3Link+". Beginning does not match any of "+(', '.join([str(elem) for elem in required_start]))+ ".")
    return False
    
# Returns False if arguments are invalid and prints appropriate error messages. Reasons that links can be invalid are:
# String: Empty string, doesn't start with s3://, doesn't end with .tiff
# List: Empty list, one of links doesn't start with s3://, one of links doesn't end with .tiff, not all links are from the same environment
def check_valid_arguments(urls):
    if isinstance(urls, str):
        if not urls:
            print("You have provided an empty string. Please provide s3 link(s).")
            return False
        return check_valid_s3_link(urls)
    elif isinstance(urls, list):
        if not urls:
            print("You have provided an empty list. Please provide s3 link(s).")
            return False
        for url in urls:
            if check_valid_s3_link(url) == False:
                return False
            if check_environments_same(urls) == False:
                return False
        return True
    else:
        print("The variable you passed for urls is " +str(type(urls)) + ". The only accepted types for this function are a string or list.")
        return False

# Returns True if all the environments are the same in the list of urls and False otherwise. If one of the environments is not in supported list, assumed to be published.
# Published environments may be combined with a single s3 bucket. Prints appropriate error message if necessary.
def check_environments_same(urls):
    environment = ""
    for url in urls:
        # If not the first go and environments don't match and url is not published, then they provided 2 different s3 buckets 
        if environment != "" and determine_environment(url) != None and endpoints_tiler.get(environment) != determine_environment(url):
            print("Not all environments for your s3 links are the same. You provided environments " + environment + " and " + extract_bucket_name(url) + " which differ.")
            return False
        # Only change the environment if it has not been set and the url is in a s3 bucket
        if environment == "" and determine_environment(url) != None:
            environment = extract_bucket_name(url)
    return True

# Determines the environment of the given link by extracting the bucket name and referring to a constant dictionary for the corresponding Tiler endpoint
# Returns None in the case that the s3 bucket cannot be found. Assumed to be published data in this case. 
# Prints the appropriate error message if the given environment is not provided. For supported environments, see the dictionary constant endpoints_tiler in this file
def determine_environment(s3Link):
    bucket_name = extract_bucket_name(s3Link)
    if bucket_name == None:
        return None
    endpoint_tiler = endpoints_tiler.get(bucket_name)
    if endpoint_tiler == None:
        #print("Environment not supported by this function. For supported s3 buckets try: "+get_supported_environments() + ". You may also pass published s3 links.")
        return None
    return endpoint_tiler

# Assumes that there is not multiple different s3 buckets in the list of urls because this was already checked for
def determine_environment_list(urls):
    for url in urls:
        # When you find the first occurrence of an S3 bucket, return that url
        if determine_environment(url) != None:
            return determine_environment(url)
    # All links are published if no s3 environments found- this means any endpoint can be returned (Choosing to return ops at the moment)
    return endpoint_published_data


# Extracts the bucket name from the s3 link and prints the appropriate error message if the bucket name cannot be found
def extract_bucket_name(s3Link):
    location_start_bucket_name = len(required_start[0])
    if s3Link[location_start_bucket_name:].find("/") == -1:
        #print("Your s3 link does not contain a / to separate the bucket name from the key name. Please provide a correct s3 link. Example: s3://maap-ops-workspace/graceal/filename.tiff")
        return None
    location_end_bucket_name = s3Link[location_start_bucket_name:].find("/") + len(required_start[0])
    return s3Link[location_start_bucket_name:location_end_bucket_name]

# Returns a string of a list of all the keys in the dictionary
def get_printable_list_from_dict(dictionary):
    to_return = ""
    for key in dictionary:
        to_return = to_return + key + ", "
    to_return = to_return[:len(to_return)-2]
    return to_return    

# Returns False if the ending type of the file is not .tif or any other valid ending type and True if it is
def file_ending(s3Link):
    for valid_ending in required_end:
        if s3Link[len(valid_ending)*-1:] == valid_ending:
            return True
    return False

# Extracts the list of geotiff links from the folder path. Returns None if the folder path is not reachable and only returns the names of files that end in
# required_end_s3_link_lowercase or required_end_s3_link_uppercase
def extract_geotiff_links(folder_path):
    bucket_name = determine_valid_bucket(folder_path)
    if bucket_name == None:
        print("The environment of the bucket you passed as a folder is not a valid environment type. The supported environments are: " +  (', '.join([str(key) for key in endpoints_tiler])) + ".")
        return []
    file_path = get_file_path_folder(folder_path)

    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    geotiff_links = []
    for obj in bucket.objects.filter(Prefix=file_path):
        if obj.size and file_ending(obj.key): 
            geotiff_links.append(required_start[0] + bucket_name + "/" + obj.key)

    print("Geotiff links extracted from given folder are "+geotiff_links)
    return geotiff_links


# Returns False if the arguments passed with the default ops is not an accepted argument for that key and True otherwise
def check_valid_default_arguments(default_ops):
    for key in default_ops:
        if (not key in defaults_tiler) and (not key in accepted_arguments_tiler):
            print("The key you are trying to pass as a default argument key to the Tiler, " + key + " is not an accepted default type. The accepted argument types are: " + 
            (', '.join([str(key) for key in defaults_tiler])) + ", " + (', '.join([str(elem) for elem in accepted_arguments_tiler])) + ".")
            return False
        elif (key in accepted_arguments_default_ops) and (default_ops[key] not in accepted_arguments_default_ops[key]):
            accepted_args = accepted_arguments_default_ops[key]
            print("The argument you are passing for " + key + " is not an accepted argument for that key. Try one of these instead: " +
            ', '.join([str(elem) for elem in accepted_args]))
            return False
        elif not isinstance(default_ops[key], required_class_types_args_tiler[key]): 
            print("The argument you are passing for " + key + " is not a valid class for this key. The class " + str(required_class_types_args_tiler[key]) + 
            " is accepted, but you passed " + str(type(default_ops[key])) + ".")
            return False
        
    return True


def initialize_variables():
    stream = open(yml_file_name, 'r')
    dictionary = yaml.load(stream)
    
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
    
