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

path_variablesjson = "ipycmc/ipycmc/loadGeotiffs/variables.json"

class RequiredInfoClass:
    def __init__(self, debug_mode):
        try:
            f = open(os.path.abspath(__file__).replace("edsc_extension/edsc_extension/"+os.path.basename(__file__), path_variablesjson), "r")
            dictionary = json.loads(f.read())
        except KeyboardInterrupt:
            raise KeyboardInterrupt
        except:
            print("JSON file with variable information could not be found.")
            self.setup_successful = False
            return
        
        try:
            # Initialize all the variables
            self.required_starts = dictionary["required_starts"]
            self.required_ends = dictionary["required_ends"]
            self.defaults_tiler = dictionary["defaults_tiler"]
            self.endpoints_tiler = dictionary["endpoints_tiler"]
            self.tiler_extensions = dictionary["tiler_extensions"]
            self.endpoint_published_data = dictionary["endpoint_published_data"]
            self.posting_tiler_endpoint = dictionary["posting_tiler_endpoint"]
            self.errors_tiler = dictionary["errors_tiler"]
            self.accepted_parameters_tiler = dictionary["accepted_parameters_tiler"]
            self.general_error_warning_tiler = dictionary["general_error_warning_tiler"]
            self.required_class_types_args_tiler = dictionary["required_class_types_args_tiler"]
            self.correct_wmts_beginning = dictionary["correct_wmts_beginning"]
            self.accepted_arguments_default_ops = {"TileMatrixSetId":[(entry["id"]) for entry in requests.get("https://api.cogeo.xyz/tileMatrixSets").json()["tileMatrixSets"]], 
                                 "resampling_method": [(r.name) for r in Resampling], 
                                 "colormap_name": cmap.list(),
                                 "tile_format_args":dictionary["tile_format_args"],
                                 "pixel_selection_args":dictionary["pixel_selection_args"]}
            self.getting_wmts_endpoint = dictionary["getting_wmts_endpoint"]
            self.web_starts = dictionary["web_starts"]
            self.default_handle_as = dictionary["default_handle_as"]
            self.default_ops_load_layer_config = dictionary["default_ops_load_layer_config"]
            self.default_debug_mode = dictionary["default_debug_mode"]
            self.default_time_analysis = dictionary["default_time_analysis"]
        except KeyboardInterrupt:
            raise KeyboardInterrupt
        except:
            print("Essential key missing from JSON file: " + str(sys.exc_info()[1]))
            self.setup_successful = False
            return

        self.setup_successful = True
        if debug_mode:
            self.check_non_empty_all()
            self.other_error_checking([self.posting_tiler_endpoint, self.endpoint_published_data] + list(self.endpoints_tiler.values()))
            self.check_correct_types_args()
        
    # Note that not all variables are required to be non empty
    # Print all variables that are empty that need to be filled at once for the user
    def check_non_empty_all(self):
        variables = vars(self)
        for key in variables:
            if not variables[key] and variables[key]!=False:
                print("Cannot pass an empty value for " + key + " in variables.json file.")
                self.setup_successful = False
    
    def other_error_checking(self, links):
        for link in links:
            start_found = False
            for web_start in self.web_starts:
                if link.startswith(web_start):
                    start_found = True
                    break
            if not start_found:
                print(link + " in variables.json must start with one of " + (', '.join([str(web_start) for web_start in self.web_starts])) + " to be considered a link.")
                self.setup_successful = False

# Prints all incorrect arguments if something went wrong
    # Not the prettiest but short circuiting hurts in this case if all in one statement because not everything will evaluate
    def check_correct_types_args(self):
        return1 = self.check_correct_class_arg(self.required_starts, "required_starts", list) 
        return2 = self.check_correct_class_arg(self.required_ends, "required_ends", list)
        return3 = self.check_correct_class_arg(self.tiler_extensions, "tiler_extensions", dict) 
        return4 = self.check_correct_class_arg(self.endpoint_published_data, "endpoint_published_data", str)
        return5 = self.check_correct_class_arg(self.posting_tiler_endpoint, "posting_tiler_endpoint", str)
        return6 = self.check_correct_class_arg(self.errors_tiler, "errors_tiler", dict)
        return7 = self.check_correct_class_arg(self.accepted_parameters_tiler, "accepted_parameters_tiler", list)
        return8 = self.check_correct_class_arg(self.general_error_warning_tiler, "general_error_warning_tiler", str)
        return9 = self.check_correct_class_arg(self.required_class_types_args_tiler, "required_class_types_args_tiler", dict) 
        return10 = self.check_correct_class_arg(self.correct_wmts_beginning, "correct_wmts_beginning", str)
        return11 = self.check_correct_class_arg(self.accepted_arguments_default_ops.get("tile_format_args"), "tile_format_args", list)
        return12 = self.check_correct_class_arg(self.accepted_arguments_default_ops.get("pixel_selection_args"), "pixel_selection_args", list)
        return13 = self.check_correct_class_arg(self.getting_wmts_endpoint, "getting_wmts_endpoint", str) 
        return14 = self.check_correct_class_arg(self.web_starts, "web_starts", list)
        return15 = self.check_correct_class_arg(self.default_handle_as, "default_handle_as", str)
        return16 = self.check_correct_class_arg(self.default_ops_load_layer_config, "default_ops_load_layer_config", dict)
        return17 = self.check_correct_class_arg(self.default_debug_mode, "default_debug_mode", bool)
        return18 = self.check_correct_class_arg(self.default_time_analysis, "default_time_analysis", bool)
        successful = return1 and return2 and return3 and return4 and return5 and return6 and return7 and return8 and return9 and return10 and return11 and return12 and return13 and return14 and return15 and return16 and return17 and return18
        if not successful:
            self.setup_successful = False

    def check_correct_class_arg(self, arg, arg_name, class_type):
        if arg and not isinstance(arg, class_type):
            print(arg_name + " should be a " + str(class_type) + " in variables.json")
            return False
        return True