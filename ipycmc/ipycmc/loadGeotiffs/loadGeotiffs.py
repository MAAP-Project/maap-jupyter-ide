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

def load_geotiffs(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis):
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
    """Main function that handles the users request
    Parameters
    ----------
    urls : str or list
        The locations of the files in s3 to read. Can be in the format of a single s3 link, list of s3 links, or folder with tif files
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles
    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    if not init_required_info(debug_mode):
        return None, None, None

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
    """Creates the request url in the case of a single s3 geotiff link being passed
    Parameters
    ----------
    s3Url : str
        The location of the s3Url to pass to the Tiler to make tiles
    default_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles
    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    endpoint_tiler = extractInfoLinks.determine_environment(s3Url)
    # None being returns means that the link is published, use the Tiler ops endpoint as a default
    if endpoint_tiler == None:
        endpoint_tiler = required_info.endpoint_published_data
    newUrl = endpoint_tiler + required_info.tiler_extensions.get("single") + "url=" + s3Url
    newUrl = createUrl.add_defaults_url(newUrl, default_tiler_ops, debug_mode)
    if newUrl == None or (debug_mode and errorChecking.check_errors_request_url(newUrl)):
        return None
    return newUrl

def create_request_folder_geotiffs(urls, default_tiler_ops, debug_mode):
    """Creates the request url in the case of a folder with multiple geotiff files in it
    Parameters
    ----------
    urls : str
        The location of the folder with Geotiff files
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles
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
    """Creates the request url in the case of a links of s3 links to Geotiff files
    Parameters
    ----------
    urls : list
        The list of s3 urls to create a mosaic json
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles
    Returns
    ------- 
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    if debug_mode and (not errorChecking.tiler_can_access_links(urls, debug_mode)):
        return None
    newUrl = createUrl.create_mosaic_json_url(urls, default_tiler_ops, debug_mode)
    if newUrl == None or (debug_mode and errorChecking.check_errors_request_url(newUrl)):
        return None
    return newUrl

def init_required_info(debug_mode):
    global required_info
    required_info = requiredInfoClass.RequiredInfoClass(debug_mode)
    if not required_info.setup_successful:
        return False
    errorChecking.initialize_required_info(required_info)
    extractInfoLinks.initialize_required_info(required_info)
    createUrl.initialize_required_info(required_info)
    return True