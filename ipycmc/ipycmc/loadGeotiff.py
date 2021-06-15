required_start_s3_link_lowercase = "s3://"
required_start_s3_link_uppercase = "S3://"
required_end_s3_link_lowercase = ".tif"
required_end_s3_link_uppercase = ".TIF"
defaults_tiler = {"tile_format": "png", "tile_scale":"1", "pixel_selection":"first", "TileMatrixSetId":"WebMercatorQuad", "resampling_method":"nearest", "return_mask":"true", "rescale":"0%2C1000"}
endpoints_tiler = {"maap-ops-workspace": "https://jqsd6bqdsf.execute-api.us-west-2.amazonaws.com", "maap-ops-dataset":"https://baxpil3vd6.execute-api.us-east-1.amazonaws.com", "maap-uat-workspace":"https://titiler.uat.maap-project.org", "maap-dev-dataset":"https://jqsd6bqdsf.execute-api.us-west-2.amazonaws.com"}
tiler_extensions = {"single":"/cog/WMTSCapabilities.xml?", "multiple":"/mosaicjson/WMTSCapabilities.xml?"}
endpoint_ops = endpoints_tiler.get("maap-ops-workspace") # Tiler endpoint used for published links
errors_tiler = {"not recognized as a supported file format.":"You have entered an invalid file path that does not exist or the TiTiler does not have access to.", "Access Denied":"The Tiler does not have access to the file path that you have provided, please give a maap s3 bucket or published data."}
accepted_arguments_tiler = ["minzoom", "maxzoom", "bidx", "expression", "nodata", "unscale", "color_formula", "colormap_name", "colormap"]
mosaicjson_file = "mosaicjson.json"
tiler_general_error_beginning = "{\"detail\":"
general_error_warning_tiler = "There was an error reading your link and Tiler gave the following error message: "


import time
from cogeo_mosaic.mosaic import MosaicJSON
from concurrent import futures
from rio_tiler.io import COGReader
import requests
import copy
import boto3

# Main function that returns a url or None in case of error back to widget.py and calls other functions in this file
def loadGeotiffs(urls, default_ops):
    #time.sleep(1)

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
        endpoint_tiler = endpoint_ops
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
    if response[:len(tiler_general_error_beginning)] == tiler_general_error_beginning:
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
    f = open(mosaicjson_file, "w")
    f.write(mosaic_data)
    f.close()
    
    bucket_name = determine_valid_bucket(urls[0])
    if bucket_name == None:
        mosaic_data_link = None # TODO this means the data is published and it does not work for published data yet
    else:
        mosaic_data_link = required_start_s3_link_lowercase + bucket_name + get_file_path(urls[0]) + "/" + mosaicjson_file
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
    file_path = url[len(required_start_s3_link_lowercase):]
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
    file_path = url[len(required_start_s3_link_lowercase):]
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
    defaultValues = ""
    if not default_ops:
        for key in defaults_tiler:
            defaultValues = defaultValues + "&" + key + "=" +defaults_tiler[key]
    else:
        temp_defaults_tiler = copy.copy(defaults_tiler)
        for key in default_ops:
            # If the argument they tried to give is not allowed as a standard default
            if (not key in defaults_tiler) and (not key in accepted_arguments_tiler):
                print("The argument you are trying to pass as a default argument to the Tiler, " + key + " is not an accepted default type. The accepted argument types are: " + get_accepted_argument_types())
                return None
            else: 
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
    if s3Link[:len(required_start_s3_link_lowercase)] != required_start_s3_link_lowercase and s3Link[:len(required_start_s3_link_uppercase)] != required_start_s3_link_uppercase:
        print("Invalid s3 link: "+s3Link+". Beginning "+s3Link[:len(required_start_s3_link_lowercase)]+ " does not match "+required_start_s3_link_lowercase +" or "+required_start_s3_link_uppercase+ ".")
        return False
        
    return True
    
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
    return endpoint_ops


# Extracts the bucket name from the s3 link and prints the appropriate error message if the bucket name cannot be found
def extract_bucket_name(s3Link):
    location_start_bucket_name = len(required_start_s3_link_lowercase)
    if s3Link[location_start_bucket_name:].find("/") == -1:
        #print("Your s3 link does not contain a / to separate the bucket name from the key name. Please provide a correct s3 link. Example: s3://maap-ops-workspace/graceal/filename.tiff")
        return None
    location_end_bucket_name = s3Link[location_start_bucket_name:].find("/") + len(required_start_s3_link_lowercase)
    return s3Link[location_start_bucket_name:location_end_bucket_name]

# Returns a string of a list of all the keys in the dictionary
def get_printable_list_from_dict(dictionary):
    to_return = ""
    for key in dictionary:
        to_return = to_return + key + ", "
    to_return = to_return[:len(to_return)-2]
    return to_return    

# Returns a string of the accepted argument types to the tiler
def get_accepted_argument_types():
    arguments = get_printable_list_from_dict(defaults_tiler)
    for argument in accepted_arguments_tiler:
        arguments = arguments + ", " + argument
    return arguments

# Returns False if the ending type of the file is not .tif and True if it is
def file_ending(s3Link):
    return not (s3Link[len(required_end_s3_link_lowercase)*-1:] != required_end_s3_link_lowercase and s3Link[len(required_end_s3_link_uppercase)*-1:] != required_end_s3_link_uppercase)

# Extracts the list of geotiff links from the folder path. Returns None if the folder path is not reachable and only returns the names of files that end in
# required_end_s3_link_lowercase or required_end_s3_link_uppercase
def extract_geotiff_links(folder_path):
    bucket_name = determine_valid_bucket(folder_path)
    if bucket_name == None:
        print("The environment of the bucket you passed as a folder is not a valid environment type. The supported environments are: " + get_printable_list_from_dict(endpoints_tiler) + ".")
        return []
    file_path = get_file_path_folder(folder_path)

    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    geotiff_links = []
    for obj in bucket.objects.filter(Prefix=file_path):
        if obj.size and file_ending(obj.key): 
            geotiff_links.append(required_start_s3_link_lowercase + bucket_name + "/" + obj.key)

    print("Geotiff links extracted from given folder are "+geotiff_links)
    return geotiff_links
