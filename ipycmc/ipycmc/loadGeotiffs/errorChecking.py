"""
This file error checks the user given arguments to determine if they are valid and prints the appropriate error message/
Most of these functions will not be called if debug_mode is False

Written by: Grace Llewellyn
"""
import json
from . import loadGeotiffs
from . import extractInfoLinks
import requests

global required_info

def initialize_required_info(required_info_given):
    """
    Initializes required_info for use throughout the file

    Parameters
    ----------
    required_info_given : RequiredInfoClass
        Instance of RequiredInfoClass created in loadGeotiffs.py with all the variables from variables.json
    """
    global required_info
    required_info = required_info_given
    
def check_valid_arguments(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis):
    """
    Checks if the user given arguments are valid. For the urls, checks that the variable is not empty, all the environments are the same,
    and the file ending is valid. Checks that the class types of the other arguments provided by the user are the correct class type

    Parameters
    ----------
    urls : str or list
        The locations of the files in s3 to read. Can be in the format of a single s3 link, list of s3 links, or folder with tif files
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles. May be empty (passed by user)
    handle_as : str
        Default argument for the handle_as parameter in the load_layer_config function. May be empty (passed by user)
    default_ops_load_layer : dict
        Default argument for the default_ops parameter in the load_layer_config function. May be empty (passed by user)
    debug_mode : bool
        Parameter for putting this function into debug mode. If was empty, was assigned to default
    time_analysis : bool
        Parameter for conducting time analysis for this function to determine the speed of debug mode compared to non debug mode
    
    Returns
    -------
    bool
        True if all the arguments are valid and False if not
    """
    list_variables = [[default_tiler_ops, "default_tiler_ops", dict], [handle_as, "handle_as", str],[default_ops_load_layer, "default_ops_load_layer", dict],
                      [debug_mode, "debug_mode", bool], [time_analysis, "time_analysis", bool]]
    successful = True
    for var in list_variables:
        successful = required_info.check_correct_class_arg(var[0], var[1], var[2]) and successful 
    return check_valid_arguments_urls(urls) and successful

def check_valid_arguments_urls(urls):
    """
    Checks if the user given arguments are valid. For the urls, checks that the variable is not empty, all the environments are the same,
    and the file ending is valid. Checks that the class types of the other arguments provided by the user are the correct class type

    Parameters
    ----------
    urls : str or list
        The locations of the files in s3 to read. Can be in the format of a single s3 link, list of s3 links, or folder with tif files
    
    Returns
    -------
    bool
        True if all the arguments are valid and False if not
    """
    if isinstance(urls, str):
        if not urls:
            print("You have provided an empty string. Please provide s3 link(s).")
            return False
        return check_valid_s3_link(urls)
    elif isinstance(urls, list):
        if not urls:
            print("You have provided an empty list. Please provide s3 link(s).")
            return False
        # Check that all environment same in list
        if get_environment_list(urls)[0] == False:
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

def check_errors_request_url(request_url):
    """
    Checks if there are errors in the request url. This means that instead of returning an XML object, the link contains a JSON object with
    an error message. Sometimes these error messages are not the most detailed, so if the JSON object contains an one of required_info.errors_tiler, 
    then I inform the user what the error means and a potential fix. If content of the request url does not begin with required_info.correct_wmts_beginning
    which is < since that is the beginning of an XML file, then I just show the error message to the user. Note that this function can take a little to run
    and is only called if the user is in debug mode

    Parameters
    ----------
    request_url : str
        Request url to send to the TiTiler. This request url may contain an error message for the user
    
    Returns
    -------
    bool
        True if there is an error message in the request url and False otherwise
    """
    response = requests.get(request_url).text
    for error in required_info.errors_tiler:
        if error in response:
            print(required_info.errors_tiler[error])
            print("Error: " + response)
            return True
    if response[0] != required_info.correct_wmts_beginning:
        print(required_info.general_error_warning_tiler + response)
        return True
    return False

def check_valid_s3_link(s3Link):
    """
    Checks if the given links begins with one of required_info.required_starts which means that it's a valid link

    Parameters
    ----------
    s3Link : str
        s3 link to check if it begins with required_info.required_starts (s3://)
    
    Returns
    -------
    bool
        True if s3Links begins with one of required_info.required_starts, and False otherwise
    """
    for valid_start in required_info.required_starts:
        if s3Link[:len(valid_start)] == valid_start:
            return True
    print("Invalid s3 link: "+s3Link+". Beginning does not match any of "+(', '.join([str(elem) for elem in required_info.required_starts]))+ ".")
    return False

def get_environment_list(urls):
    """
    Checks if the environments are the same. If bucket name not found or not in required_info.endpoints_tiler, then assumed to be published data.
    Links can be any combination of one maap ade environment and published data. Prints appropriate error message if necessary. 

    Parameters
    ----------
    urls : list
        List of urls to check that environments are the same of
    
    Returns
    -------
    bool
        True if all the environments are the same or some mix of one environment and published data, False otherwise
    str 
        Returns the current bucket name of the list, or None if the environments were different 
    """
    current_environment = None
    for url in urls:
        env, bucket_name = extractInfoLinks.determine_environment(url)
        if env == None:
            return False, None
        # If not the first go and environments don't match and url is not published, then they provided 2 different s3 buckets 
        if current_environment != None and bucket_name != None and current_environment != bucket_name:
            print("Not all environments for your s3 links are the same. You provided environments " + current_environment + " and " + bucket_name +
             " which differ.")
            return False, None
        # Only change the environment if it has not been set and the url is in a s3 bucket
        if current_environment == None and bucket_name != None:
            current_environment = extractInfoLinks.extract_bucket_name(url)
    return True, current_environment

# Returns False if the arguments passed with the default ops is not an accepted argument for that key and True otherwise
def check_valid_default_arguments(default_tiler_ops):
    """
    Checks if the user passed valid arguments in default_tiler_ops. Checks that they did not pass a key that TiTiler doesn't accept, 
    did not pass a value that's outside the allowed values for certain keys, the argument they passed is the class expected (and the 
    class expected is a valid class)

    Parameters
    ----------
    default_tiler_ops : dict
        User-given dictionary for default arguments for TiTiler
    
    Returns
    -------
    bool
        False if there is an error in default_tiler_ops
    """
    for key in default_tiler_ops:
        try:
            if (not key in required_info.defaults_tiler) and (not key in required_info.accepted_parameters_tiler):
                print("The key you are trying to pass as a default argument key to the Tiler, " + key + " is not an accepted default type. The accepted argument types are: " + 
                (', '.join([str(key) for key in required_info.defaults_tiler])) + ", " + (', '.join([str(elem) for elem in required_info.accepted_parameters_tiler])) + ".")
                return False
            elif (key in required_info.accepted_arguments_default_ops) and (default_tiler_ops[key] not in required_info.accepted_arguments_default_ops[key]):
                print("The argument you are passing for " + key + " is not an accepted argument for that key. Try one of these instead: " +
                ', '.join([str(elem) for elem in required_info.accepted_arguments_default_ops[key]]))
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

def tiler_can_access_links(urls):
    """
    Tests if the TiTiler can access all the given links by creating a request url as if each individual link was a single geotiff passed to the function.
    The create_request_single_geotiff function only returns None if the default ops are incorrect (impossible because we are passing an empty list)
    or the response of the request url contains errors

    Parameters
    ----------
    urls : list
        Links to verify that TiTiler can access
    
    Returns
    -------
    bool
        True if TiTiler can access all links and False otherwise
    """
    to_return = True
    for url in urls:
        if loadGeotiffs.create_request_single_geotiff(url, {}, True) == None:
            print("Invalid url: " + url + ".")
            to_return = False
    return to_return