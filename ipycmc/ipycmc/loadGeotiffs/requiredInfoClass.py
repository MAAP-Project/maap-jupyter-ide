"""
This class holds all the parameters that are necessary to operate the load_geotiffs function. It reads the variables from variables.json. 
If debug_mode is True, then checks these variables to make sure that they are valid. All files that make up the load_geotiffs function have
copies of the RequiredInfoClass

Written by Grace Llewellyn
"""
import json
import requests
from rasterio.enums import Resampling
from rio_tiler.colormap import cmap
import os
import sys

json_file_name = "variables.json"

class RequiredInfoClass:
    def __init__(self, debug_mode):
        try:
            f = open(os.path.abspath(__file__).replace(os.path.basename(__file__), json_file_name), "r")
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
        
    def check_non_empty_all(self):
        """
        Note that not all variables are required to be non empty. Prints all variables that are empty so that the user doesn't need to 
        keep rerunning the function to realize there errors. As soon as one required variable is found, sets setup_successful to False so 
        that the function doesn't conclude. 
        """
        variables = vars(self)
        for key in variables:
            if not variables[key] and variables[key]!=False:
                print("Cannot pass an empty value for " + key + " in variables.json file.")
                self.setup_successful = False
    
    def other_error_checking(self, links):
        """
        Searches each link in the list of links to see if it begins with web_starts. If one does not begin with one of web_starts, 
        then setup_successful is set to False. All links that are invalid have an error message printed.

        Parameters
        ----------
        links : list
            List of links to be verified start with one of web_starts
        """
        for link in links:
            start_found = False
            for web_start in self.web_starts:
                if link.startswith(web_start):
                    start_found = True
                    break
            if not start_found:
                print(link + " in variables.json must start with one of " + (', '.join([str(web_start) for web_start in self.web_starts])) + " to be considered a link.")
                self.setup_successful = False

    def check_correct_types_args(self):
        """
        Checks if all the variables in variables.json are the correct class type. This prints all error messages 
        """
        list_variables = [[self.required_starts, "required_starts", list], [self.required_ends, "required_ends", list], [self.tiler_extensions, "tiler_extensions", dict],
        [self.endpoint_published_data, "endpoint_published_data", str], [self.posting_tiler_endpoint, "posting_tiler_endpoint", str], [self.errors_tiler, "errors_tiler", dict],
        [self.accepted_parameters_tiler, "accepted_parameters_tiler", list], [self.general_error_warning_tiler, "general_error_warning_tiler", str], 
        [self.required_class_types_args_tiler, "required_class_types_args_tiler", dict], [self.correct_wmts_beginning, "correct_wmts_beginning", str], 
        [self.accepted_arguments_default_ops.get("tile_format_args"), "tile_format_args", list], [self.accepted_arguments_default_ops.get("pixel_selection_args"), "pixel_selection_args", list],
        [self.getting_wmts_endpoint, "getting_wmts_endpoint", str], [self.web_starts, "web_starts", list], [self.default_handle_as, "default_handle_as", str], 
        [self.default_ops_load_layer_config, "default_ops_load_layer_config", dict], [self.default_debug_mode, "default_debug_mode", bool], [self.default_time_analysis, "default_time_analysis", bool]
        
        successful = True
        for var in list_variables:
            print ("checking: " + var[0] + var[1] + var[2])
            successful = self.check_correct_class_arg(var[0], var[1], var[2]) and successful 
        if not successful:
            self.setup_successful = False

    def check_correct_class_arg(self, arg, arg_name, class_type):
        """
        Determines if the given argument is the correct, given class type

        Parameters
        ----------
        arg : any
            Argument whose value this function is assessing (makes sure that it matches class_type)
        arg_name : str
            Name of the given argument as shown in variables.json (used to show error message to user)
        class_type : any
            Class that arg should be or error printed

        Returns
        -------
        bool
            True if arg is an instance of class_type and False if not 
        """
        if not isinstance(arg, class_type):
            print(arg_name + " should be a " + str(class_type) + " in variables.json")
            return False
        return True