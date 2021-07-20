"""
This file runs load_geotiffs in debug mode and not in debug mode and compares the time difference for completing those 2 functins. 
The time difference only includes running load_geotiffs and not load_layer_config. 

Written by Grace Llewellyn
"""
import time 

from . import loadGeotiffs

def conduct_time_analysis(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis):
    """
    Conducts the time analysis by calling load_geotiffs_base twice (once with debug mode and once without) and records the amount of time
    it takes for the function to run. Returns the information as if load_geotiff_base was called with the given debug_mode (this can make
    a difference because when debug_mode=False, it is possible that a return url is generated when it should not be because an error was missed)

    Parameters
    ----------
    urls : str or list
        The locations of the files in s3 to read. Can be in the format of a single s3 link, list of s3 links, or folder with tif files. Used to make call back to load_geotiffs_base
    default_tiler_ops : dict
        Default arguments to pass to the Tiler when making the wmts tiles. May be empty (passed by user). Used to make call back to load_geotiffs_base
    handle_as : str
        Default argument for the handle_as parameter in the load_layer_config function. May be empty (passed by user). Used to make call back to load_geotiffs_base
    default_ops_load_layer : dict
        Default argument for the default_ops parameter in the load_layer_config function. May be empty (passed by user). Used to make call back to load_geotiffs_base
    debug_mode : bool
        Parameter for putting this function into debug mode. If was empty, was assigned to default. Used to make call back to load_geotiffs_base
    time_analysis : bool
        Parameter for conducting time analysis for this function to determine the speed of debug mode compared to non debug mode. Used to make call back to load_geotiffs_base

    Returns
    -------
    str
        a request url to be passed to load_layer_config or None in the case of error
    str
        handle_as_varjson as extracted from variables.json (could be changed to user's input later), used for load_layer_config
    dict 
        default_ops_load_layer_varjson as extracted from variables.json (could be changed to user's input later), used for load_layer_config
    """
    start = time.perf_counter()
    return_url,handle_as_varjson,default_ops_load_layer_varjson = loadGeotiffs.load_geotiffs_base(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis)
    end = time.perf_counter()
    time_debug = end - start

    start = time.perf_counter()
    loadGeotiffs.load_geotiffs_base(urls, default_tiler_ops, handle_as, default_ops_load_layer, not debug_mode, time_analysis)
    end = time.perf_counter()
    time_not_debug = end - start

    if debug_mode:
        timing_print_statement(time_debug, time_not_debug)
    else:
        timing_print_statement(time_not_debug, time_debug)
    return return_url,handle_as_varjson,default_ops_load_layer_varjson

def timing_print_statement(time_debug, time_not_debug):
    """
    Prints the times for running debug mode and not in debug mode. Says how much faster it was running debug or not

    Parameters
    ----------
    time_debug : float
        Time it took load_geotiffs_base to run in debug mode
    time_not_debug : float
        Time it took load_geotiffs_base to run not in debug mode
    """
    output = f"The time for debug mode was {time_debug:0.5f} and the time for non debug mode was {time_not_debug:0.5f}. "
    if time_debug > time_not_debug:
        output = output + f"Not debugging was {time_debug-time_not_debug:0.5f} seconds faster than debugging."
    else:
        output = output + f"Debugging was {time_not_debug-time_debug:0.5f} seconds faster than not debugging."
    print(output)