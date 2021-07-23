"""
This file extracts information from the links that the user passed to load_geotiffs. Some of the functionality of these functions include
extracting the geotiff links from a folder, extracting the bucket name, and extracting the file ending from links.

Written by: Grace Llewellyn, grace.a.llewellyn@jpl.nasa.gov
"""

import boto3
import os

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

def extract_geotiff_links(folder_path, debug_mode):
    """
    Extracts the geotiff links by getting the bucket name then calling a helper function

    Parameters
    ----------
    folder_path : str
        The location of the folder with Geotiff files
    debug_mode : bool
        Determines if certain error checks and print statements should happen

    Returns
    -------
    list
        list of the geotiffs extracted from the folder. None in case of error
    """
    bucket_name = determine_environment(folder_path)[1]
    if bucket_name == None:
        print("The environment of the bucket you passed as a folder is not a valid environment type. The supported environments are: " +  
            (', '.join([str(key) for key in required_info.endpoints_tiler])) + ".")
        return None
    return extract_geotiff_links_from_folder(bucket_name, (get_file_path_folder(folder_path) + "/"), folder_path, debug_mode)
    

def extract_geotiff_links_from_folder(bucket_name, file_path, folder_path, debug_mode):
    """
    Extracts the geotiff links by finding all files with the prefix file_path and adding that to the list along with the s3 start and
    bucket_name

    Parameters
    ----------
    bucket_name : str
        Bucket name of MAAP ADE
    file_path : str
        The location of the folder with Geotiff files
    debug_mode : bool
        Determines if certain error checks and print statements should happen

    Returns
    -------
    list
        list of the geotiffs extracted from the folder. None in case of error
    """
    try:
        s3 = boto3.resource('s3')
        bucket = s3.Bucket(bucket_name)
        geotiff_links = []
        for obj in bucket.objects.filter(Prefix=file_path):
            # Check makes sure that geotiffs below file path are not added
            if obj.size and file_ending(obj.key) and (obj.key[len(file_path)+1:].find("/") == -1): 
                geotiff_links.append(required_info.s3_beginning + bucket_name + "/" + obj.key)
    except KeyboardInterrupt:
        raise KeyboardInterrupt
    except:
        print("Error reading file contents from bucket. This is likely a permissions error.")
        return None
    if len(geotiff_links) == 0:
        if not os.path.isdir(folder_path):
            print("No GeoTIFFs found in the given folder. The folder path (" + folder_path + ") you provided may not be a valid directory.")
        else:
            print("No GeoTIFFs found in the given folder.")
        return None
    if debug_mode:
        print("Geotiff links extracted from given folder are: "+str(geotiff_links))
    return geotiff_links

def extract_bucket_name(s3Link):
    """
    Extracts the name of the bucket by looking between the location of // and / in the given link. For example, s3://maap-ops-workspace/graceal
    would have maap-ops-workspace extracted from it. s3://maap-ops-workspace would be an invalid folder to pass because information cannot be stored
    at the top level of MAAP ops ade

    Parameters
    ----------
    s3Link : str
        Single s3 link to extract the bucket name from (or could be a folder path)

    Returns
    -------
    str
        Bucket name or None in case of error
    """
    location_start_bucket_name = s3Link.find("//") + 2
    if location_start_bucket_name == -1 + 2:
        print("Error reading extract bucket name because no // to indicate link in " + s3Link)
        return None
    if s3Link[location_start_bucket_name:].find("/") == -1:
        print("Your s3 link does not contain a / to separate the bucket name from the key name. Please provide a correct s3 link. Example: s3://maap-ops-workspace/graceal/filename.tiff")
        return None
    location_end_bucket_name = s3Link[location_start_bucket_name:].find("/") + location_start_bucket_name
    return s3Link[location_start_bucket_name:location_end_bucket_name]

def determine_environment(s3Link):
    """
    Determines which TiTiler endpoint use for passing a geotiff or mosaic json. This is based on the bucket name and required_info.endpoints_tiler.
    If unable to find the bucket name or the bucket name is invalid, assumes that the data is published data and used required_info.endpooint_published_data

    Parameters
    ----------
    s3Link : str
        Single s3 link to determine the TiTiler endpoint of (based on the bucket name and required_info.endpoints_tiler)

    Returns
    -------
    str
        Endpoint of the TiTiler to pass geotiff or mosaic to 
    str
        Represents the bucket name, None is returned if cannot find bucket name or published data (this value should not be used then)
    """
    bucket_name = extract_bucket_name(s3Link)
    if bucket_name == None:
        return None, None
    endpoint_tiler = required_info.endpoints_tiler.get(bucket_name)
    if endpoint_tiler == None:
        return required_info.endpoint_published_data, None
    return endpoint_tiler, bucket_name

def file_ending(s3Link):
    """
    Determines if the file_ending is one of the required_info.required_ends

    Parameters
    ----------
    s3Link : str
        Single s3 link to determine the ending of

    Returns
    -------
    bool
        True if the file ending is valid and False otherwise 
    """
    for valid_ending in required_info.required_ends:
        if s3Link[len(valid_ending)*-1:] == valid_ending:
            return True
    return False

def get_file_path_folder(s3Link):
    """
    Determines the file path of the folder by looking after the bucket name

    Parameters
    ----------
    s3Link : str
        Single s3 link to extract the folder path from

    Returns
    -------
    str
        File path for folder, not including the bucket name. Returns None in case of error
    """
    location_start_bucket_name = s3Link.find("//")
    if location_start_bucket_name == -1:
        print("Error reading extract bucket name because no // to indicate link in " + s3Link)
        return None
    file_path = s3Link[location_start_bucket_name+2:]
    ending_bucket_name = file_path.find("/")
    file_path = file_path[ending_bucket_name+1:]
    return file_path