import os.path
import sys
import nbformat
from notebook.base.handlers import IPythonHandler
import subprocess
sys.path.append('./edsc_extension/maap-py')
print(subprocess.check_output('pwd',shell=True))
#from maap import maap.MAAP as MAAP
import maap
from maap.maap import MAAP

# In local Config
#PATH_TO_MAAP_CFG = './maap-py/maap.cfg'

# In Docker Image Che Config
PATH_TO_MAAP_CFG = '/edsc_extension/maap-py/maap.cfg'

class GetGranulesHandler(IPythonHandler):
    def printUrls(self, granules):
        url_list = '[\n'
        for res in granules:
            if res.getDownloadUrl():
                url_list = url_list + '\'' + res.getDownloadUrl() + '\',\n'
        url_list = url_list + ']'
        return url_list

    def get(self):

        maap = MAAP()
        json_obj = self.get_argument('json_obj', '')
        limit = str(self.get_argument('limit', ''))
        print("json obj", json_obj)

        query_string = maap.getCallFromEarthdataQuery(json_obj, limit=limit)
        granules = eval(query_string)
        query_result = self.printUrls(granules)
        try:
            print("Response is: ", query_result)
        except:
            print("Could not print results")
        self.finish({"granule_urls": query_result})


class GetQueryHandler(IPythonHandler):
    def get(self):
        maap = MAAP()
        json_obj = self.get_argument('json_obj', '')
        limit = str(self.get_argument('limit', ''))
        print("json obj", json_obj)

        query_string = maap.getCallFromEarthdataQuery(json_obj, limit=limit)
        print("Response is: ", query_string)
        self.finish({"query_string": query_string})


