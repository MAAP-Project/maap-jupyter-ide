import os.path
import sys
import nbformat
from notebook.base.handlers import IPythonHandler
import subprocess
# sys.path.append('/Users/mdebelli/MAAP/maap-py')
# print(subprocess.check_output('pwd',shell=True))
#from maap import maap.MAAP as MAAP
import maap
from maap.maap import MAAP

# In local Config
#PATH_TO_MAAP_CFG = './maap-py/maap.cfg'

# In Docker Image Che Config
# PATH_TO_MAAP_CFG = '/edsc_extension/maap-py/maap.cfg'

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
        maap = MAAP()
        cmr_query = self.get_argument('cmr_query', '')
        limit = str(self.get_argument('limit', ''))
        query_type = self.get_argument('query_type', 'granule')
        print("cmr_query", cmr_query)

        query_string = maap.getCallFromCmrUri(cmr_query, limit=limit, search=query_type)
        print("Response is: ", query_string)
        self.finish({"query_string": query_string})


