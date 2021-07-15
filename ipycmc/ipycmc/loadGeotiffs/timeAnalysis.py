import time 

from . import loadGeotiffs

def conduct_time_analysis(urls, default_tiler_ops, handle_as, default_ops_load_layer, debug_mode, time_analysis):
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
    output = f"The time for debug mode was {time_debug:0.5f} and the time for non debug mode was {time_not_debug:0.5f}. "
    if time_debug > time_not_debug:
        output = output + f"Not debugging was {time_debug-time_not_debug:0.5f} seconds faster than debugging."
    else:
        output = output + f"Debugging was {time_not_debug-time_debug:0.5f} seconds faster than not debugging."
    print(output)