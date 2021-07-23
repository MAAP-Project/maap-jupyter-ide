import os.path
import sys
import nbformat
from notebook.base.handlers import IPythonHandler
import subprocess
import functools
import json
import maap
from maap.maap import MAAP

from .createLoadGeotiffsFcnCall import createLoadGeotiffsFcnCall

@functools.lru_cache(maxsize=128)
def get_maap_config(host):
    path_to_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..', 'maap_environments.json')

    with open(path_to_json) as f:
        data = json.load(f)

    match = next((x for x in data if host in x['ade_server']), None)
    maap_config = next((x for x in data if x['default_host'] == True), None) if match is None else match
    
    return maap_config

def maap_api(host):
    return get_maap_config(host)['api_server']

class GetGranulesHandler(IPythonHandler):
    def printUrls(self, granules):
        url_list = '[\n'
        for res in granules:
            if res.getDownloadUrl():
                url_list = url_list + '\'' + res.getDownloadUrl() + '\',\n'
        url_list = url_list + ']'
        return url_list

    def get(self):

        maap = MAAP(maap_api(self.request.host))
        cmr_query = self.get_argument('cmr_query', '')
        limit = str(self.get_argument('limit', ''))
        print("cmr_query", cmr_query)

        query_string = maap.getCallFromCmrUri(cmr_query, limit=limit)
        granules = eval(query_string)
        query_result = self.printUrls(granules)
        try:
            print("Response is: ", query_result)
        except:
            print("Could not print results")
        self.finish({"granule_urls": query_result})


class GetQueryHandler(IPythonHandler):
    def get(self):
        maap = MAAP(maap_api(self.request.host))
        cmr_query = self.get_argument('cmr_query', '')
        limit = str(self.get_argument('limit', ''))
        query_type = self.get_argument('query_type', 'granule')
        print("cmr_query", cmr_query)

        query_string = maap.getCallFromCmrUri(cmr_query, limit=limit, search=query_type)
        print("Response is: ", query_string)
        self.finish({"query_string": query_string})


class VisualizeCMCHandler(IPythonHandler):
    """
    Gets the parameters from index.ts and creates a list of granules. Then makes a call to the python script that creates the function call
    and passes that back to the index.ts along with info messages to display to the user
    """
    def get(self):
        maap = MAAP(maap_api(self.request.host))
        cmr_query = self.get_argument('cmr_query', '')
        limit = str(self.get_argument('limit', ''))
        maap_var_name = self.get_argument('maapVarName', '')

        query_string = maap.getCallFromCmrUri(cmr_query, limit=limit)
        granules = eval(query_string)

        # get list of granules to pass to load geotiffs 
        urls = []
        for res in granules:
            if res.getDownloadUrl():
                urls.append(res.getDownloadUrl())
        
        function_call, errors = createLoadGeotiffsFcnCall.create_function_call(urls, maap_var_name)
        self.finish({"function_call": function_call, "errors":errors})