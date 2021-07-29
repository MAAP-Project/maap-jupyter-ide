"""
This class holds all the parameters that are necessary to create the function call to load_geotiffs mostly by knowing what
urls to remove from the list of urls that the user gives (i.e. checks the file endings type and starting type as specified in variables.json)

Written by Grace Llewellyn, grace.a.llewellyn@jpl.nasa.gov
"""
import json
import os
import sys

path_variablesjson = "ipycmc/ipycmc/loadGeotiffs/variables.json"

class RequiredInfoClass:
    def __init__(self, debug_mode):
        try:
            f = open(os.path.abspath(__file__).replace("edsc_extension/edsc_extension/createLoadGeotiffsFcnCall/"+os.path.basename(__file__), path_variablesjson), "r")
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
            self.default_handle_as = dictionary["default_handle_as"]
            self.default_ops_load_layer_config = dictionary["default_ops_load_layer_config"]
            self.default_debug_mode = dictionary["default_debug_mode"]
            self.default_time_analysis = dictionary["default_time_analysis"]
            self.esa_data_location = dictionary["esa_data_location"]
            self.s3_beginning = dictionary["s3_beginning"]

        except KeyboardInterrupt:
            raise KeyboardInterrupt
        except: 
            print("Essential key missing from JSON file: " + str(sys.exc_info()[1]))
            self.setup_successful = False
            return

        self.setup_successful = True
        if (debug_mode == "" and self.default_debug_mode) or debug_mode:
            self.check_non_empty_all()
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

    def check_correct_types_args(self):
        """
        Checks if all the variables in variables.json are the correct class type. This prints all error messages 
        """
        list_variables = [[self.required_starts, "required_starts", list], [self.required_ends, "required_ends", list], [self.defaults_tiler, "defaults_tiler", dict],
        [self.default_handle_as, "default_handle_as", str], [self.default_ops_load_layer_config, "default_ops_load_layer_config", dict],
        [self.default_debug_mode, "default_debug_mode", bool], [self.default_time_analysis, "default_time_analysis", bool], [self.esa_data_location, "esa_data_location", str],
        [self.s3_beginning, "s3_beginning", str]]
        
        for var in list_variables:
            if not self.check_correct_class_arg(var[0], var[1], var[2]):
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