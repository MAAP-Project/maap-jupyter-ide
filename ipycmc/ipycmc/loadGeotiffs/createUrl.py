"""
This file has all the load_geotiffs helper functions that help create the mosaic json request url to pass to the TiTiler

Written by Grace Llewellyn, grace.a.llewellyn@jpl.nasa.gov
"""

from cogeo_mosaic.mosaic import MosaicJSON
import copy
from . import errorChecking
import os
import requests
import json

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

def create_mosaic_json_url(urls, default_tiler_ops, debug_mode):
    """
    Creates a mosaic json, then posts the mosaic JSON to a TiTiler endpoints, then generates a request url to the TiTiler by 
    adding on the default arguments.

    Parameters
    ----------
    urls : list
        List of geotiffs to create a mosaic json from
    default_tiler_ops : dict
        User-given defaults to add to the request url to TiTiler ops, if this is empty, defaults from variables.json are used
    debug_mode : bool
        Determines if certain error checks and print statements should happen
    
    Returns
    -------
    str
        Request url to pass to TiTiler with mosaic json, None returned in case of error
    """
    mosaic_data_json = create_mosaic_json_from_urls(urls)
    if mosaic_data_json == None:
        return None
    r = post_mosaic_json(mosaic_data_json)
    
    bucket_name = errorChecking.get_environment_list(urls)[1]
    if (bucket_name == None or bucket_name=="maap-ops-dataset"):
        try:
            xml_endpoint = eval(required_info.getting_wmts_endpoint)
        except KeyboardInterrupt:
            raise KeyboardInterrupt
        except:
            print("getting_wmts_endpoint variable unable to be evaluated from variables.json or error in request url "+r)
            return None

        return add_defaults_url(xml_endpoint + "?", default_tiler_ops, debug_mode)
    elif bucket_name=="maap-ops-workspace":
        tilejson_endpoint = list(filter(lambda x: x.get('rel') == 'mosaicjson', dict(r)['links']))[0].get('href')
        newUrl = required_info.endpoints_tiler.get(bucket_name) + required_info.tiler_extensions.get("multiple") + "url=" + tilejson_endpoint
        newUrl = add_defaults_url(newUrl, default_tiler_ops, debug_mode)
        if newUrl == None or (debug_mode and errorChecking.check_errors_request_url(newUrl)):
            return None
        return newUrl
    else:
        return None
    
def post_mosaic_json(mosaic_data_json):
    """
    Posts the mosaic JSON as a request to a TiTiler

    Parameters
    ----------
    mosaic_data_json : dict
        Mosaic JSON to post
    
    Returns
    -------
    dict
        Response to request
    """
    r = requests.post(
        url=f"{required_info.posting_tiler_endpoint}/mosaicjson/mosaics",
        headers={
            "Content-Type": "application/vnd.titiler.mosaicjson+json",
        },
        json=mosaic_data_json).json()
    return r 

    
def create_mosaic_json_from_urls(urls):
    """
    Creates the mosaic json from using MosaicJSON.from_urls()

    Parameters
    ----------
    urls : list
        Geotiffs to create into mosaic json
    
    Returns
    -------
    dict
        Mosaic json
    """
    try:
        os.environ['CURL_CA_BUNDLE']='/etc/ssl/certs/ca-certificates.crt'
        mosaicJson = MosaicJSON.from_urls(urls).json()
        mosaicJson = json.loads(mosaicJson)
        return mosaicJson
    except KeyboardInterrupt:
        raise KeyboardInterrupt
    except:
        print("Error creating the mosaic json using MosaicJSON.from_urls. This is likely because of a permissions error.")
        return None

def add_defaults_url(url, default_tiler_ops, debug_mode):
    """
    Adds the defaults for the TiTiler to the request url. Even if the user does not pass arguments for the TiTiler, the defaults
    are still added to the request url because the tiles may not show up on CMC without these defaults, especially the rescale parameter.
    Whichever keys the user doesn't provide in default_tiler_ops, required_info.defaults_tiler gives.

    Parameters
    ----------
    url : str
        Request url to add TiTiler default to
    default_tiler_ops : dict
        User-given defaults for the TiTiler, may be empty. Checked for errors if in debug mode
    debug_mode : bool
        Determines if certain error checks and print statements should happen
    
    Returns
    -------
    str
        Request url ready to pass to the TiTiler
    """
    if debug_mode and (not errorChecking.check_valid_default_arguments(default_tiler_ops)):
        return None

    defaultValues = ""
    temp_defaults_tiler = copy.copy(required_info.defaults_tiler)
    # If given no default_tiler_ops, this for loop will not run and all the rest of the default values will just be added
    for key in default_tiler_ops:
        defaultValues = defaultValues + "&" + key + "=" + add_escape_sequences(str(default_tiler_ops[key]), key)
        if key in temp_defaults_tiler:
            temp_defaults_tiler.pop(key, None)
            
    # When finished with user's arguments, add the rest of the default values
    for key in temp_defaults_tiler:
        defaultValues = defaultValues + "&" + key + "=" + add_escape_sequences(str(required_info.defaults_tiler[key]), key)
                    
    url = url + defaultValues
    return url

def add_escape_sequences(value, tiler_key):
    """
    Adds escape sequences onto the tiler argument. This is mostly for the rescale value which needs to be formatted in a certain manner
    for the tiles to show up correctly

    Parameters
    ----------
    value : str
        Value to add the default values onto
    tiler_key : str
        Key to the tiler used to identify if the value is for the rescale tiler parameter
    
    Returns
    -------
    str
        Updated value with escape sequences added
    """
    for key in required_info.escape_sequences:
        index_escape_seq = value.find(key)
        if index_escape_seq != -1:
            value = value[:index_escape_seq] + required_info.escape_sequences[key] + value[index_escape_seq+1:]
            # This is not elegant, but for some reason rescale must have 3 0s added to the end
            if tiler_key == "rescale":
                value = value + "000"
            return value
    return value 