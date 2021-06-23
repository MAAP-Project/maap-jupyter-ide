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

json_file_name = "variables.json"
global required_info

def loadGeotiffs(urls, default_ops):
    """Main function that handles the users request

    Parameters
    ----------
    urls : str or list
        The locations of the files in s3 to read. Can be in the format of a single s3 link, list of s3 links, or folder with tif files
    default_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles

    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error
    """

    #files = [f for f in os.listdir('.') if os.path.isfile(f)]
    #for f in files:
    #    print(f)
    global required_info
    required_info = requiredInfoClass.RequiredInfoClass()
    if not required_info.setup_successful:
        return None
    errorChecking.initialize_required_info(required_info)
    extractInfoLinks.initialize_required_info(required_info)
    createUrl.initialize_required_info(required_info)

    # Check the type and format of the URLs passed into the function
    if errorChecking.check_valid_arguments(urls) == False:
        return None
    
    # If single GeoTIFF file, execute the functions for a single GeoTIFF to wmts tiles and pass to CMC
    if isinstance(urls, str) and extractInfoLinks.file_ending(urls):
        return create_request_single_geotiff(urls, default_ops)

    # If folder of geoTiff links, execute the functions for a list or single GeoTIFF(s) to make a mosaic JSON
    if isinstance(urls, str) and not extractInfoLinks.file_ending(urls):
        return create_request_folder_geotiffs(urls, default_ops)

    # Execute the functions for a list of GeoTIFF to make a mosaic JSON
    if isinstance(urls, list):
        return create_request_multiple_geotiffs(urls, default_ops)

def create_request_single_geotiff(s3Url, default_ops):
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
    newUrl = createUrl.add_defaults_url(newUrl, default_ops)
    if newUrl == None:
        return None
    if errorChecking.check_errors_request_url(newUrl):
        return None
    return newUrl

def create_request_folder_geotiffs(urls, default_ops):
    """Creates the request url in the case of a folder with multiple geotiff files in it

    Parameters
    ----------
    urls : str
        The location of the folder with Geotiff files
    default_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles

    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error or if no Geotiff files in the folder
    """
    geotiffs = extractInfoLinks.extract_geotiff_links(urls)
    if len(geotiffs) == 0:
        print("No GeoTIFFs found in the given folder.")
        return None
    elif len(geotiffs) == 1:
        return create_request_single_geotiff(geotiffs[0], default_ops)
    else:
        return create_request_multiple_geotiffs(geotiffs, default_ops)

def create_request_multiple_geotiffs(urls, default_ops):
    """Creates the request url in the case of a links of s3 links to Geotiff files

    Parameters
    ----------
    urls : list
        The list of s3 urls to create a mosaic json
    default_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles

    Returns
    ------- 
    str
        a request url to be passed to load_layer_config or None in the case of error
    """
    endpoint_tiler = extractInfoLinks.determine_environment_list(urls)
    if not errorChecking.tiler_can_access_links(urls):
        return None
    mosaic_json_url = createUrl.create_mosaic_json_url(urls)
    if mosaic_json_url == None:
        return None
    newUrl = endpoint_tiler + required_info.tiler_extensions.get("multiple") + "url=" + mosaic_json_url
    newUrl = createUrl.add_defaults_url(newUrl, default_ops)
    if newUrl == None:
        return None
    if errorChecking.check_errors_request_url(newUrl):
        return None
    return newUrl
    
