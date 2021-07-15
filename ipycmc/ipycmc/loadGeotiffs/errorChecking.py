import json
from . import loadGeotiffs
from . import extractInfoLinks
import requests

global required_info

def initialize_required_info(required_info_given):
    global required_info
    required_info = required_info_given

# Should print all errors that the user has with the arguments
def check_valid_arguments(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis):
    urls_valid = check_valid_arguments_urls(urls)
    args_valid = check_correct_classes_args(default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis)
    return urls_valid and args_valid

def check_correct_classes_args(default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis):
    return check_correct_class_arg(default_tiler_ops, "default_tiler_ops", dict) and check_correct_class_arg(handle_as, "handle_as", str) and check_correct_class_arg(default_ops_load_layer, "default_ops_load_layer", dict) and check_correct_class_arg(debug_mode, "debug_mode", bool) and check_correct_class_arg(time_analysis, "time_analysis", bool)

def check_correct_class_arg(arg, arg_name, class_type):
    if arg and not isinstance(arg, class_type):
        print(arg_name + " should be a " + str(class_type))
        return False
    return True

# Returns False if arguments are invalid and prints appropriate error messages. Reasons that links can be invalid are:
# String: Empty string, doesn't start with s3://, doesn't end with .tiff
# List: Empty list, one of links doesn't start with s3://, one of links doesn't end with .tiff, not all links are from the same environment
def check_valid_arguments_urls(urls):
    if isinstance(urls, str):
        if not urls:
            print("You have provided an empty string. Please provide s3 link(s).")
            return False
        return check_valid_s3_link(urls)
    elif isinstance(urls, list):
        if not urls:
            print("You have provided an empty list. Please provide s3 link(s).")
            return False
        if check_environments_same(urls) == False:
            return False
        for url in urls:
            if check_valid_s3_link(url) == False:
                return False
            if extractInfoLinks.file_ending(url) == False:
                print(url + " doesn't end in one of " + (', '.join([str(elem) for elem in required_info.required_ends])) + ".")
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
    for error in required_info.errors_tiler:
        if error in response:
            print(required_info.errors_tiler[error])
            return True
    if response[0] != required_info.correct_wmts_beginning:
        print(required_info.general_error_warning_tiler + response)
        return True
    return False

# Determine if the bucket name extracted is a valid bucket name. Returns the bucket name if it is a valid bucket and returns None otherwise
def determine_valid_bucket(s3Url):
    bucket_name = extractInfoLinks.extract_bucket_name(s3Url)
    if bucket_name == None:
        return None
    for key in required_info.endpoints_tiler:
        # If the bucket is a valid environment, return that bucket name
        if bucket_name == key:
            return bucket_name
    return None

# Given a string representing a s3 link, checks that the link begins with s3://. If this is not true, prints appropriate error messages
# and returns False. Can add other checks in this function to check the s3 link. Check for ending with .tiff is elsewhere in the function
def check_valid_s3_link(s3Link):  
    # Checks the beginning type of the s3 link is s3://
    for valid_start in required_info.required_starts:
        if s3Link[:len(valid_start)] == valid_start:
            return True
    print("Invalid s3 link: "+s3Link+". Beginning does not match any of "+(', '.join([str(elem) for elem in required_info.required_starts]))+ ".")
    return False

# Returns True if all the environments are the same in the list of urls and False otherwise. If one of the environments is not in supported list, assumed to be published.
# Published environments may be combined with a single s3 bucket. Prints appropriate error message if necessary.
def check_environments_same(urls):
    environment = ""
    for url in urls:
        # If not the first go and environments don't match and url is not published, then they provided 2 different s3 buckets 
        if environment != "" and extractInfoLinks.determine_environment(url) != None and required_info.endpoints_tiler.get(environment) != extractInfoLinks.determine_environment(url):
            print("Not all environments for your s3 links are the same. You provided environments " + environment + " and " + extractInfoLinks.extract_bucket_name(url) +
             " which differ.")
            return False
        # Only change the environment if it has not been set and the url is in a s3 bucket
        if environment == "" and extractInfoLinks.determine_environment(url) != None:
            environment = extractInfoLinks.extract_bucket_name(url)
    return True

# Returns a string of a list of all the keys in the dictionary
def get_printable_list_from_dict(dictionary):
    to_return = ""
    for key in dictionary:
        to_return = to_return + key + ", "
    to_return = to_return[:len(to_return)-2]
    return to_return  

# Returns False if the arguments passed with the default ops is not an accepted argument for that key and True otherwise
def check_valid_default_arguments(default_tiler_ops):
    for key in default_tiler_ops:
        try:
            if (not key in required_info.defaults_tiler) and (not key in required_info.accepted_parameters_tiler):
                print("The key you are trying to pass as a default argument key to the Tiler, " + key + " is not an accepted default type. The accepted argument types are: " + 
                (', '.join([str(key) for key in required_info.defaults_tiler])) + ", " + (', '.join([str(elem) for elem in required_info.accepted_arguments_tiler])) + ".")
                return False
            elif (key in required_info.accepted_arguments_default_ops) and (default_tiler_ops[key] not in required_info.accepted_arguments_default_ops[key]):
                accepted_args = required_info.accepted_arguments_default_ops[key]
                print("The argument you are passing for " + key + " is not an accepted argument for that key. Try one of these instead: " +
                ', '.join([str(elem) for elem in accepted_args]))
                return False
            elif not isinstance(default_tiler_ops[key], eval(required_info.required_class_types_args_tiler[key])): 
                print("The argument you are passing for " + key + " is not a valid class for this key. The class " + str(required_info.required_class_types_args_tiler[key]) + 
                " is accepted, but you passed " + str(type(default_tiler_ops[key])) + ".")
                return False
        except KeyboardInterrupt:
            raise KeyboardInterrupt
        except:
            print("JSON file variable required_class_types_args_tiler is formatted incorrectly because " + required_info.required_class_types_args_tiler[key] + " is not a valid class type.")
            return False 
    return True

# Determines if the Tiler can access the links by passing them link a single GeoTIFF into the file. The create_request_single_geotiff function only returns
# None if the default ops are incorrect (impossible because we are passing an empty list) or the response of the request url contains errors
def tiler_can_access_links(urls, debug_mode):
    for url in urls:
        if loadGeotiffs.create_request_single_geotiff(url, {}, debug_mode) == None:
            print("Invalid url: " + url + ".")
            return False
    return True