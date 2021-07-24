"""
This function create the load_geotiffs call after the user presses the button to visualize in CMC after selecting an EarthData search.
This function filters out all invalid urls and only shows the load_geotiffs call with valid urls. This function also adds all defaults 
onto the function call so that the users can edit that data as they please before making the function call to load_geotiffs.
This function also creates info messages for the user to alert them about why certain links were excluded from the function call 
(because of ending and starting file type, data is esa data and will have permission issues, or if boto3 head request cannot reach
the data). If no valid urls or another error in this function, function call returns is a comment explaining the error

Written by: Grace Llewellyn, grace.a.llewellyn@jpl.nasa.gov
"""

from . import requiredInfoClass
import sys
import boto3
import botocore

global required_info


def create_function_call(urls, maap_var_name):
    """
    Checks if the user given arguments are valid. For the urls, checks that the variable is not empty, all the environments are the same,
    and the file ending is valid. Checks that the class types of the other arguments provided by the user are the correct class type
    Filters out all urls that do not have the correct ending type, starting type, contain orange-business (all read from variables.json),
    or if a boto3 head request cannot access the data (404 status)
    Parameters
    ----------
    urls : list or str
        The locations of the files in s3 to read from EarthData search. 
    maap_var_name : str
        Default arguments to pass to the Tiler when making the wmts tiles. May be empty (passed by user)
    
    Returns
    -------
    str
        Function call for the user to run or None in case of error
    str
        Info messages to show to the user about what urls were filtered out
    """
    try:
        global required_info
        required_info = requiredInfoClass.RequiredInfoClass(True)
        if not required_info.setup_successful:
            return "# Error evaluating variables.json"
        newUrls, info_message = filter_out_invalid_urls(urls)

        valid, function_call = add_urls((maap_var_name + ".load_geotiffs(urls="), newUrls)
        if not valid:
            return function_call, info_message[1:-1]
        # Add the defaults to the function call
        function_call = function_call + ", default_tiler_ops="+ str(required_info.defaults_tiler) + ", handle_as=\""
        function_call = function_call+required_info.default_handle_as+"\", default_ops_load_layer="+str(required_info.default_ops_load_layer_config)
        function_call = function_call+", debug_mode="+str(required_info.default_debug_mode)+", time_analysis="+str(required_info.default_time_analysis)
        return function_call + ")", info_message[1:-1]
    except:
        return ("# Error creating function call\n# Error message: " + str(sys.exc_info())), ""

def filter_out_invalid_urls(urls):
    """
    Filters out all urls that do not have the correct ending type, starting type, or contain orange-business (all read from variables.json in case they change)
    Parameters
    ----------
    urls : list
        The locations of the files in s3 to read from EarthData search. 
    
    Returns
    -------
    str
        New list of urls with invalid urls filtered out. Can be empty
    str
        Info messages to show to the user about what urls were filtered out. | is used to separate the different info messages
    """
    if len(urls) == 0:
        return [], "|No urls in granule search results|"
    if isinstance(urls, str):
        urls = [urls]
    elif not isinstance(urls, list):
        return [], "|Object with urls is " +str(type(urls))+" which is invalid|"
    newUrls = []
    info_message = ""
    for url in urls:
        url, new_info_message = determine_single_url_valid(url)
        if url != None:
            newUrls.append(url)
        else:
            info_message = info_message + "|" + new_info_message
    return newUrls, info_message

def determine_single_url_valid(url):
    """
    Determines if the given url is valid by checking its beginning and ending types, and also checking that the data is not esa data because
    permission errors with ESA data in NASA maap. Note that only one error message will be shown to the user for a url that is filtered out.
    Parameters
    ----------
    urls : str
        Single data link to check if valid
    
    Returns
    -------
    str
        The same url given if url is valid for load_geotiffs. If not, None is returned
    str
        Info messages to show to the user about what urls were filtered out
    """
    invalid_end, error_message_end = check_invalid_ending(url)
    if invalid_end:
        return None, error_message_end
    invalid_start, error_message_start = check_invalid_start(url) 
    if invalid_start:
        return None, error_message_start
    invalid_esa_data, error_message_esa_data = check_esa_data(url)
    if invalid_esa_data:
        return None, error_message_esa_data
    invalid_data_present, error_message_invalid_data = check_data_present(url)
    if invalid_data_present:
        return None, error_message_invalid_data
    return url, None

def check_invalid_ending(url):
    """
    Determines if the given url is valid by checking its ending type and making sure that it's in required_info.required_ends
    Parameters
    ----------
    urls : str
        Single data link to check if valid ending
    
    Returns
    -------
    bool
        True if the url has an invalid ending and False if not
    str
        Info message for the user about the ending being invalid. None if no info message required because data is valid
    """
    for valid_ending in required_info.required_ends:
        if url[len(valid_ending)*-1:] == valid_ending:
            return False, None
    return True, (url + " excluded because doesn't end with one of " + (', '.join([str(elem) for elem in required_info.required_ends])) + ".")

def check_invalid_start(url):
    """
    Determines if the given url is valid by checking its start type and making sure that it's in required_info.required_start
    Parameters
    ----------
    urls : str
        Single data link to check if valid start
    
    Returns
    -------
    bool
        True if the url has an invalid start and False if not
    str
        Info message for the user about the start being invalid. None if no info message required because data is valid
    """
    for valid_start in required_info.required_starts:
        if url[:len(valid_start)] == valid_start:
            return False, None
    return True, (url + " excluded because doesn't start with one of " + (', '.join([str(elem) for elem in required_info.required_starts])) + ".")

def check_esa_data(url):
    """
    Determines if the given url is valid by checking if it contains required_info.esa_data_location which is likely orange-business and means
    that nasa maap will have trouble accessing this data. 
    Parameters
    ----------
    urls : str
        Single data link to check if is esa data
    
    Returns
    -------
    bool
        True if the url is esa data and False if not
    str
        Info message for the user about the url containing esa data. None if no info message required because data is valid
    """
    if required_info.esa_data_location in url:
        return True, ("Access not permitted to " + url + " because it is data from ESA (" + required_info.esa_data_location + ").")
    return False, None

def add_urls(function_call, newUrls):
    """
    Adds the urls onto the function call. If there are no urls, makes the function call a comment telling the user why no urls were able to be found.
    Parameters
    ----------
    function_call : str
        Beginning of function call with varName.load_geotiffs(
    newUrls : list
        List of valid urls to add onto the function call
    
    Returns
    -------
    bool
        True if the url is esa data and False if not
    str
        Info message for the user about the url containing esa data. None if no info message required because data valid
    """
    if len(newUrls) == 0:
        function_call = "# No urls were found that had valid ending types (i.e. one of " + (', '.join([str(elem) for elem in required_info.required_ends]))
        function_call = function_call +") and valid starting types (i.e. one of " + (', '.join([str(elem) for elem in required_info.required_starts]))
        function_call = function_call + ") and didn't contain " + required_info.esa_data_location + " (ESA data)."
        return False, function_call
    else:
        return True, (function_call + str(newUrls))

def check_data_present(s3Link):
    """
    Checks if the data is present at the given s3 link. Only returns an error if the boto3 head request doesn't fail, but the response 
    code is not 200 and when the head request fails with a 404 status code. All of this function is in a try except so that if another
    error occurs the url is just not filtered out because another problem might be at play. If there really is a problem with that url,
    then the load_geotiffs function will tell the user
    Parameters
    ----------
    s3Link : str
        link to get head request for
    newUrls : list
    
    Returns
    -------
    bool
        True if the url is invalid because the data cannot be found and False otherwise
    str
        Info message for the user about the url having a invalid status code. None if no info message required because data is valid
    """
    try:
        client = boto3.client('s3')
        if s3Link[:len(required_info.s3_beginning)] != required_info.s3_beginning:
            return False, None
        s3Link_mod = s3Link[len(required_info.s3_beginning):]
        end_bucket_name = s3Link_mod.find("/")
        if end_bucket_name == -1:
            return False, None
        bucket_name = s3Link_mod[:end_bucket_name]
        key_name = s3Link_mod[end_bucket_name+1:]
        try:
            response = client.head_object(
                Bucket=bucket_name,
                Key=key_name
            )
            status_code = response["ResponseMetadata"]["HTTPStatusCode"]
            if status_code == 200:
                return False, None
            else:
                return True, ("Error when attempting to receive data at " + s3Link + " with status code " + str(status_code) + ".")
        except botocore.exceptions.ClientError as error:
            if error.response["ResponseMetadata"]["HTTPStatusCode"] == 404:
                return True, ("Error when attempting to receive data at " + s3Link + " with status code " + str(404) + ".")
            else:
                return False, None
    except:
        return False, None