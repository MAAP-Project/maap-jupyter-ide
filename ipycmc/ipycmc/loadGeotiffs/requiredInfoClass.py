"""
This class holds all the parameters that are necessary to operate the load_geotiffs function

Written by Grace Llewellyn
"""
import json
import requests
from rasterio.enums import Resampling
from rio_tiler.colormap import cmap
import os
import sys

#json_file_name = "variables.json"
json_file_path = "/ipycmc/ipycmc/loadGeotiffs/variables.json"

class RequiredInfoClass:
    def __init__(self):
        try:
            f = open(os.getcwd() + json_file_path, "r")
            dictionary = json.loads(f.read())
        except:
            print("JSON file with variable information could not be found.")
            self.setup_successful = False
            return
        
        try:
            # Initialize all the variables
            self.required_start = dictionary["required_start"]
            self.required_end = dictionary["required_end"]
            self.defaults_tiler = dictionary["defaults_tiler"]
            self.endpoints_tiler = dictionary["endpoints_tiler"]
            self.tiler_extensions = dictionary["tiler_extensions"]
            self.endpoint_published_data = dictionary["endpoint_published_data"]
            self.errors_tiler = dictionary["errors_tiler"]
            self.accepted_arguments_tiler = dictionary["accepted_arguments_tiler"]
            self.mosaicjson_file_name = dictionary["mosaicjson_file_name"]
            self.general_error_warning_tiler = dictionary["general_error_warning_tiler"]
            self.required_class_types_args_tiler = dictionary["required_class_types_args_tiler"]
            self.xml_beginning = dictionary["xml_beginning"]
            self.accepted_arguments_default_ops = {"TileMatrixSetId":[(entry["id"]) for entry in requests.get("https://api.cogeo.xyz/tileMatrixSets").json()["tileMatrixSets"]], 
                                 "resampling_method": [(r.name) for r in Resampling], 
                                 "colormap_name": cmap.list(),
                                 "tile_format":dictionary["tile_format"],
                                 "pixel_selection":dictionary["pixel_selection"]}
            if dictionary["workspace_namespace"]=="":
                print("Essential key workspace_namespace empty.")
                self.setup_successful = False
                return
            self.workspace_namespace = os.getenv(dictionary["workspace_namespace"]) # Check if None
            self.env_home = dictionary["env_home"]
            self.private_bucket_path = dictionary["private_bucket_path"]
            self.public_bucket_path = dictionary["public_bucket_path"]
            
        except:
            print("Essential key missing from JSON file: " + str(sys.exc_info()[1]))
            self.setup_successful = False

        self.setup_successful = True
        self.check_non_empty_all()
        
    # Note that not all variables are required to be non empty
    def check_non_empty_all(self):
        if self.empty(self.required_start, "required_start") or self.empty(self.required_end, "required_end") or self.empty(self.defaults_tiler, "defaults_tiler") or self.empty(self.endpoints_tiler, "endpoints_tiler") or self.empty(self.tiler_extensions, "tiler_extensions") or self.empty(self.endpoint_published_data, "endpoint_published_data") or self.empty(self.accepted_arguments_tiler, "accepted_arguments_tiler") or self.empty(self.mosaicjson_file_name, "mosaicjson_file_name") or self.empty(self.general_error_warning_tiler, "general_error_warning_tiler") or self.empty(self.required_class_types_args_tiler, "required_class_types_args_tiler") or self.empty(self.xml_beginning, "xml_beginning") or self.empty(self.accepted_arguments_default_ops, "accepted_arguments_default_ops"):
            self.setup_successful = False
        
    def empty(self, var, var_name):
        if not var:
            print("Cannot pass an empty value for " + var_name + " in variables.json file.")
            return True
        return False