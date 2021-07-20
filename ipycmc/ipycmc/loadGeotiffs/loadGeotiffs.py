"""
This is a file implements the function load_geotiff that allows scientists to input either a single s3 link, multiple s3 links, 
or a folder in s3. 
If the user passes a single s3 link, then it is passed to the Tiler with its default arguments and a link to an XML file with the wmts is 
passed to load_layer_config
If the user passes a s3 folder or list of s3 links, then a mosaic JSON is created that is passed to the Tiler that generated an XML file 
with wmts tile to pass to load_layer_config
This function also provides extensive error checking for the user input arguments so that user's understand the mistakes they are making in their input.
Only certain MAAP s3 environments are permitted at the moment. 
Written by Grace Llewellyn
"""

from . import errorChecking
from . import extractInfoLinks
from . import createUrl
from . import requiredInfoClass
from . import timeAnalysis
import sys

json_file_name = "variables.json"
global required_info

def load_geotiffs(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode_given, time_analysis_given):
    """
    Function that takes in the users arguments, and calls the correct functions based on these arguments
    (i.e. calls time analysis if the user passes time analysis as true). Catches all errors except KeyboardInterrupts

    Parameters
    ----------
    urls : str or list
        The locations of the files in s3 to read. Can be in the format of a single s3 link, list of s3 links, or folder with tif files
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles. May be empty (passed by user)
    handle_as : str
        Default argument for the handle_as parameter in the load_layer_config function. May be empty (passed by user), assigned by user 
    default_ops_load_layer : dict
        Default argument for the default_ops parameter in the load_layer_config function. May be empty (passed by user)
    debug_mode : bool
        Parameter for putting this function into debug mode
    time_analysis : bool
        Parameter for conducting time analysis for this function to determine the speed of debug mode compared to non debug mode
    
    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    varjson_valid, debug_mode, time_analysis = init_required_info(debug_mode_given, time_analysis_given)
    if not varjson_valid:
        return None, None, None
    try:
        if time_analysis:
            return_url,handle_as_varjson,default_ops_load_layer_varjson = timeAnalysis.conduct_time_analysis(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis)
        else:    
            return_url,handle_as_varjson,default_ops_load_layer_varjson = load_geotiffs_base(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis)
        print("Request url generated: " + str(return_url))
        if return_url != None:
            if not handle_as:
                handle_as = handle_as_varjson
            if not default_ops_load_layer:
                default_ops_load_layer = default_ops_load_layer_varjson
        return return_url,handle_as,default_ops_load_layer
        
    except KeyboardInterrupt:
        raise KeyboardInterrupt
    except:
        print("Your function call failed for an unknown reason. Please set debugging to True to get more information.")
        print("Error message: " + str(sys.exc_info()))
        return None,None,None

def load_geotiffs_base(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis):
    """
    Main function that handles the users request for a single geotiff, multiple geotiff, or a folder

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
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    # Check the type and format of the URLs passed into the function
    if debug_mode and errorChecking.check_valid_arguments(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis) == False:
        return None, None, None

    request_url = None 
    # If single GeoTIFF file, execute the functions for a single GeoTIFF to wmts tiles and pass to CMC
    if isinstance(urls, str) and extractInfoLinks.file_ending(urls):
        request_url = create_request_single_geotiff(urls, default_tiler_ops, debug_mode)

    # If folder of geoTiff links, execute the functions for a list or single GeoTIFF(s) to make a mosaic JSON
    if isinstance(urls, str) and not extractInfoLinks.file_ending(urls):
        request_url = create_request_folder_geotiffs(urls, default_tiler_ops, debug_mode)

    # Execute the functions for a list of GeoTIFF to make a mosaic JSON
    if isinstance(urls, list):
        request_url = create_request_multiple_geotiffs(urls, default_tiler_ops, debug_mode)
    return request_url, required_info.default_handle_as, required_info.default_ops_load_layer_config

def create_request_single_geotiff(s3Url, default_tiler_ops, debug_mode):
    """
    Creates the request url in the case of a single s3 geotiff link being passed

    Parameters
    ----------
    s3Url : str
        The location of the s3Url to pass to the Tiler to make tiles
    default_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles
    debug_mode : bool
        Determines if certain error checks should happen

    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    endpoint_tiler, bucket_name = extractInfoLinks.determine_environment(s3Url)
    newUrl = endpoint_tiler + required_info.tiler_extensions.get("single") + "url=" + s3Url
    newUrl = createUrl.add_defaults_url(newUrl, default_tiler_ops, debug_mode)
    if newUrl == None or (debug_mode and errorChecking.check_errors_request_url(newUrl)):
        return None
    return newUrl

def create_request_folder_geotiffs(urls, default_tiler_ops, debug_mode):
    """
    Creates the request url in the case of a folder with multiple geotiff files in it

    Parameters
    ----------
    urls : str
        The location of the folder with Geotiff files
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles
    debug_mode : bool
        Determines if certain error checks should happen

    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error or if no Geotiff files in the folder
    """
    geotiffs = extractInfoLinks.extract_geotiff_links(urls, debug_mode)
    if geotiffs == None:
        return None
    if len(geotiffs) == 1:
        return create_request_single_geotiff(geotiffs[0], default_tiler_ops, debug_mode)
    else:
        return create_request_multiple_geotiffs(geotiffs, default_tiler_ops, debug_mode)

def create_request_multiple_geotiffs(urls, default_tiler_ops, debug_mode):
    """
    Creates the request url in the case of a links of s3 links to Geotiff files

    Parameters
    ----------
    urls : list
        The list of s3 urls to create a mosaic json
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles
    debug_mode : bool
        Determines if certain error checks should happen

    Returns
    ------- 
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    if debug_mode and (not errorChecking.tiler_can_access_links(urls)):
        return None
    newUrl = createUrl.create_mosaic_json_url(urls, default_tiler_ops, debug_mode)
    if newUrl == None or (debug_mode and errorChecking.check_errors_request_url(newUrl)):
        return None
    return newUrl

def init_required_info(debug_mode_given, time_analysis_given):
    """
    Creates the request url in the case of a links of s3 links to Geotiff files

    Parameters
    ----------
    debug_mode_given : bool or str (if empty)
        debug_mode that is given by the user. If empty, assigned to the default_debug_mode in variables.json
    time_analysis_given : bool or str (if empty)
        time_analysis that is given by the user. If empty, assigned to the default_time_analysis in variables.json

    Returns
    ------- 
    bool
        Indicates True if the RequiredInfoClass successfully set up and False otherwise
    bool
        Represents debug_mode whether provided by the user or assigned from variables.json
    bool
        Represents time_analysis whether provided by the user or assigned from variables.json
    """
    global required_info
    required_info = requiredInfoClass.RequiredInfoClass(debug_mode_given)
    if not required_info.setup_successful:
        return False, False, False
    if debug_mode_given == "":
        debug_mode = required_info.default_debug_mode
    else:
        debug_mode = debug_mode_given
    if time_analysis_given == "":
        time_analysis = required_info.default_time_analysis
    else:
        time_analysis = time_analysis_given
    errorChecking.initialize_required_info(required_info)
    extractInfoLinks.initialize_required_info(required_info)
    createUrl.initialize_required_info(required_info)
    return True, debug_mode, time_analysis