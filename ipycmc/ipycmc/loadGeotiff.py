required_start_s3_link_lowercase = "s3://"
required_start_s3_link_uppercase = "S3://"
required_end_s3_link_lowercase = ".tif"
required_end_s3_link_uppercase = ".TIF"
defaults_tiler = {"tile_format": "png", "tile_scale":"1", "pixel_selection":"first", "TileMatrixSetId":"WebMercatorQuad", "resampling_method":"nearest", "return_mask":"true", "rescale":"0%2C1000"}
endpoints_tiler = {"maap-ops-workspace": "https://jqsd6bqdsf.execute-api.us-west-2.amazonaws.com", "maap-ops-dataset":"https://baxpil3vd6.execute-api.us-east-1.amazonaws.com"}
tiler_extensions = {"single":"/cog/WMTSCapabilities.xml?", "multiple":"/mosaicjson/WMTSCapabilities.xml?"}
endpoint_ops = endpoints_tiler.get("maap-ops-workspace") # Tiler endpoint used for published links


import time
#from cogeo_mosaic.mosaic import MosaicJSON
from concurrent import futures
#from rio_tiler.io import COGReader
import requests

# Main function that returns a url or None in case of error back to widget.py and calls other functions in this file
def loadGeotiffs(urls):
    time.sleep(1)

    # Check the type and format of the URLs passed into the function
    if check_valid_arguments(urls) == False:
        return None
    
    # Execute the functions for a single GeoTIFF to wmts tiles and pass to CMC
    if isinstance(urls, str):
        return create_request_single_geotiff(urls)

    # Execute the functions for a list of GeoTIFF to make a mosaic JSON
    if isinstance(urls, list):
        create_request_multiple_geotiffs(urls)

# Constructs the url to be passed to the Tiler to request the wmts tiles for a single GeoTIFF.
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_single_geotiff(s3Url):
    newUrl = ""
    endpoint_tiler = determine_environment(s3Url)
    # None being returns means that the link is published, use the Tiler ops endpoint as a default
    if endpoint_tiler == None:
        endpoint_tiler = endpoint_ops
    newUrl = endpoint_tiler + tiler_extensions.get("single") + "url=" + s3Url
    defaultValues = ""
    for key in defaults_tiler:
        defaultValues = defaultValues + "&" + key + "=" +defaults_tiler[key]
    newUrl = newUrl + defaultValues
    return newUrl

# Constructs the url to be passed to the Tiler to request the wmts tiles for a mosaic JSON created by multiple GeoTIFFs
# Returns None if an error was encountered when constructing this url. Appropriate error message will already be printed 
def create_request_multiple_geotiffs(urls):
    #print("Create in multiple geotiffs")
    newUrl = ""
    endpoint_tiler = determine_environment_list(urls)
    
    #print("Endpoint tiler is " + endpoint_tiler)
    mosaic_json_url = create_mosaic_json_url(urls)
    if mosaic_json_url == None:
        print("Code not set up so not working")
        return None
    newUrl = endpoint_tiler + tiler_extensions.get("multiple") + "url=" + mosaic_json_url
    defaultValues = ""
    for key in defaults_tiler:
        defaultValues = defaultValues + "&" + key + "=" +defaults_tiler[key]
    newUrl = newUrl + defaultValues
    return newUrl

# Returns the list for a mosaic JSON for the given s3 links. Returns None in case of error and prints the appropriate error message
def create_mosaic_json_url(urls):
    mosaic_data = create_mosaic_json(urls)
    # TODO Write the mosaic_data to a file or upload it somehow. Return that link
    #print("About to write file")
    #f = open("mosaicjson.txt", "w")
    #f.write(mosaic_data)
    #f.close()
    #print("Done writing file")
    #print("Mosaic generated: "+mosaic_data)
    return ""

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
    
    #print("Features: ")
    #print(features)
    return features     
    #return MosaicJSON.from_features(features, minzoom=10, maxzoom=18).json()

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


# Given a string representing a s3 link, checks that the link begins with s3:// and ends with .tiff. If this is not true, prints appropriate error messages
# and returns False
def check_valid_s3_link(s3Link):  
    # Prints multiple errors if multiple errors exist within the given S3 link
    errors_found = True
    # Checks the beginning type of the s3 link is s3://
    if s3Link[:len(required_start_s3_link_lowercase)] != required_start_s3_link_lowercase and s3Link[:len(required_start_s3_link_uppercase)] != required_start_s3_link_uppercase:
        print("Invalid s3 link: "+s3Link+". Beginning "+s3Link[:len(required_start_s3_link_lowercase)]+ " does not match "+required_start_s3_link_lowercase +" or "+required_start_s3_link_uppercase+ ".")
        errors_found = False
        
    # Checks that the ending type of the s3 link is .tiff
    if s3Link[len(required_end_s3_link_lowercase)*-1:] != required_end_s3_link_lowercase and s3Link[len(required_end_s3_link_uppercase)*-1:] != required_end_s3_link_uppercase:
        print("Invalid s3 link: "+s3Link+". Ending "+s3Link[len(required_end_s3_link_lowercase)*-1:]+ " does not match "+required_end_s3_link_lowercase +" or "+required_end_s3_link_uppercase+ ".")
        errors_found = False
        
    return errors_found
    
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

# Returns a string of all supported environments from the endpoints_tiler dictionary
def get_supported_environments():
    supported_environments = ""
    for key in endpoints_tiler:
        supported_environments = supported_environments + key + ", "
    supported_environments = supported_environments[:len(supported_environments)-2] + "."
    return supported_environments    