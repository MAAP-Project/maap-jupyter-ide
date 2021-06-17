import json
from . import loadGeotiffs
import requests

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
global accepted_arguments_default_ops


def initialize_variables(json_file_name, accepted_arguments_default_ops_given):
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
    global accepted_arguments_default_ops
    accepted_arguments_default_ops = accepted_arguments_default_ops_given


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

# Prints the appriopriate error message if error contained in the request url text and then returns True if errors exist
# Try to keep track of the errors that I recognize, but might be another error that starts with "detail", so just print the given error
# message from the Tiler even though it does not always make the most sense
def check_errors_request_url(request_url):
    response = requests.get(request_url).text
    for error in errors_tiler:
        if error in response:
            print(errors_tiler[error])
            return True
    if response[0] != xml_beginning:
        print(general_error_warning_tiler + response)
        return True
    return False

# Determine if the bucket name extracted is a valid bucket name. Returns the bucket name if it is a valid bucket and returns None otherwise
def determine_valid_bucket(s3Url):
    bucket_name = loadGeotiffs.extract_bucket_name(s3Url)
    if bucket_name == None:
        return None
    for key in endpoints_tiler:
        # If the bucket is a valid environment, return that bucket name
        if bucket_name == key:
            return bucket_name
    return None

# Given a string representing a s3 link, checks that the link begins with s3://. If this is not true, prints appropriate error messages
# and returns False. Can add other checks in this function to check the s3 link. Check for ending with .tiff is elsewhere in the function
def check_valid_s3_link(s3Link):  
    # Checks the beginning type of the s3 link is s3://
    for valid_start in required_start:
        if s3Link[:len(valid_start)] == valid_start:
            return True
    print("Invalid s3 link: "+s3Link+". Beginning does not match any of "+(', '.join([str(elem) for elem in required_start]))+ ".")
    return False

# Returns True if all the environments are the same in the list of urls and False otherwise. If one of the environments is not in supported list, assumed to be published.
# Published environments may be combined with a single s3 bucket. Prints appropriate error message if necessary.
def check_environments_same(urls):
    environment = ""
    for url in urls:
        # If not the first go and environments don't match and url is not published, then they provided 2 different s3 buckets 
        if environment != "" and loadGeotiffs.determine_environment(url) != None and endpoints_tiler.get(environment) != loadGeotiffs.determine_environment(url):
            print("Not all environments for your s3 links are the same. You provided environments " + environment + " and " + loadGeotiffs.extract_bucket_name(url) + " which differ.")
            return False
        # Only change the environment if it has not been set and the url is in a s3 bucket
        if environment == "" and loadGeotiffs.determine_environment(url) != None:
            environment = loadGeotiffs.extract_bucket_name(url)
    return True

# Returns a string of a list of all the keys in the dictionary
def get_printable_list_from_dict(dictionary):
    to_return = ""
    for key in dictionary:
        to_return = to_return + key + ", "
    to_return = to_return[:len(to_return)-2]
    return to_return  

# Returns False if the arguments passed with the default ops is not an accepted argument for that key and True otherwise
def check_valid_default_arguments(default_ops):
    for key in default_ops:
        try:
            if (not key in defaults_tiler) and (not key in accepted_arguments_tiler):
                print("The key you are trying to pass as a default argument key to the Tiler, " + key + " is not an accepted default type. The accepted argument types are: " + 
                (', '.join([str(key) for key in defaults_tiler])) + ", " + (', '.join([str(elem) for elem in accepted_arguments_tiler])) + ".")
                return False
            elif (key in accepted_arguments_default_ops) and (default_ops[key] not in accepted_arguments_default_ops[key]):
                accepted_args = accepted_arguments_default_ops[key]
                print("The argument you are passing for " + key + " is not an accepted argument for that key. Try one of these instead: " +
                ', '.join([str(elem) for elem in accepted_args]))
                return False
            elif not isinstance(default_ops[key], eval(required_class_types_args_tiler[key])): 
                print("The argument you are passing for " + key + " is not a valid class for this key. The class " + str(required_class_types_args_tiler[key]) + 
                " is accepted, but you passed " + str(type(default_ops[key])) + ".")
                return False
        except:
            print("JSON file is formatted incorrectly because " + required_class_types_args_tiler[key] + " is not a valid class type.")
            return False 
    return True

# Determines if the Tiler can access the links by passing them link a single GeoTIFF into the file. The create_request_single_geotiff function only returns
# None if the default ops are incorrect (impossible because we are passing an empty list) or the response of the request url contains errors
def tiler_can_access_links(urls):
    for url in urls:
        if loadGeotiffs.create_request_single_geotiff(url, {}) == None:
            print("Invalid url: " + url + ".")
            return False
    return True