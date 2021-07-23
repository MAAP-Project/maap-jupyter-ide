from . import requiredInfoClass
import sys
#sys.path.insert(0, '/home/gllewellyn19/maap-jupyter-ide/ipycmc/ipycmc/loadGeotiffs')
#sys.path.insert(0, '/maap-jupyter-ide/ipycmc/ipycmc/loadGeotiffs')

#from ipycmc.ipycmc.loadGeotiffs import requiredInfoClass

#import requiredInfoClass

global required_info


def create_function_call(urls, maap_var_name):
    # Filter out all urls that do not have the correct ending type
    try:
        global required_info
        required_info = import_variablesjson()
        if not required_info.setup_successful:
            return "# Error evaluating variables.json"
        newUrls, error_message = filter_out_invalid_urls(urls)

        # Add urls
        function_call, valid = add_urls((maap_var_name + ".load_geotiffs(urls="), newUrls)
        if not valid:
            return function_call, error_message[1:-1]
        function_call = function_call + ", default_tiler_ops="+ str(required_info.defaults_tiler) + ", handle_as=\""
        function_call = function_call+required_info.default_handle_as+"\", default_ops_load_layer="+str(required_info.default_ops_load_layer_config)
        function_call = function_call+", debug_mode="+str(required_info.default_debug_mode)+", time_analysis="+str(required_info.default_time_analysis)

        print("error message: "+error_message)
        return function_call + ")", error_message[1:-1]
    except:
        print("Error message: " + str(sys.exc_info()))
        return None, None

def import_variablesjson():
    # TODO fix this to call the right required info
    required_info = requiredInfoClass.RequiredInfoClass(True)
    return required_info

def filter_out_invalid_urls(urls):
    if isinstance(urls, str):
        return determine_single_url_valid(urls)
    newUrls = []
    error_message = ""
    for url in urls:
        url, new_error_message = determine_single_url_valid(url)
        if url != None:
            newUrls.append(url)
        else:
            error_message = error_message + "|" + new_error_message
    print(str(newUrls) + " after error check for ending")
    return newUrls, error_message

def determine_single_url_valid(url):
    valid1, error_message1 = check_valid_ending(url)
    valid2, error_message2 = check_valid_start(url) 
    valid3, error_message3 = check_not_esa_data(url)
    if valid1 and valid2 and valid3:
        return url, None
    else:
        if error_message1:
            return None, error_message1
        if error_message2:
            return None, error_message2
        if error_message3:
            return None, error_message3

def check_valid_ending(url):
    for valid_ending in required_info.required_ends:
        if url[len(valid_ending)*-1:] == valid_ending:
            return True, None
    return False, (url + " excluded because doesn't end with one of " + (', '.join([str(elem) for elem in required_info.required_ends])) + ".")

def check_valid_start(url):
    for valid_start in required_info.required_starts:
        if url[:len(valid_start)] == valid_start:
            return True, None
    return False, (url + " excluded because doesn't end with one of " + (', '.join([str(elem) for elem in required_info.required_starts])) + ".")

def check_not_esa_data(url):
    if "orange-business" in url:
        return False, ("Access not permitted to " + url + " because it is data from ESA.")
    return True, None

def add_urls(function_call, newUrls):
    if len(newUrls) == 0:
        function_call = "# No urls were found that had valid ending types (i.e. one of " + (', '.join([str(elem) for elem in required_info.required_ends]))
        function_call = function_call +") and valid starting types (i.e. one of " + (', '.join([str(elem) for elem in required_info.required_starts]))
        function_call = function_call + ") and didnt' contain orange-business (ESA data)."
        return function_call, False
    elif isinstance(newUrls, str):
        function_call = function_call + "\"" + newUrls + "\""
    elif len(newUrls) == 1:
        function_call = function_call + "\"" + newUrls[0] + "\""
    elif len(newUrls) > 1:
        function_call = function_call + str(newUrls)
    return function_call, True