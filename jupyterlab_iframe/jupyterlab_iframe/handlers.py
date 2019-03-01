import os.path
import sys
import nbformat
from notebook.base.handlers import IPythonHandler
import subprocess
sys.path.append('./jupyterlab_iframe/maap-py')
print(subprocess.check_output('pwd',shell=True))
#from maap import maap.MAAP as MAAP
import maap
from maap.maap import MAAP

PATH_TO_MAAP_CFG = './maap-py/maap.cfg'

# Set selected ADE Docker Image 
class GetCollectionsHandler(IPythonHandler):
    def printResultsToString(self,results):
        datasets = ''
        for res in results:
            datasets += ("Short Name: " + res['Collection']['ShortName'] + '\n')
            datasets += ("Dataset ID: " + res['Collection']['DataSetId'] + '\n')
            if 'Collection' in res and 'ArchiveCenter' in res['Collection']:
                datasets += ("Archive Center: " + res['Collection']['ArchiveCenter'] + '\n')
            if res['Collection']['Description'] is not None:
                datasets += ("Description: " + res['Collection']['Description'] + '\n')
            # if 'BoundingRectangle' in res['Collection']['Spatial']['HorizontalSpatialDomain']['Geometry'] is not None:
            #     datasets += ("Bounding Rectangle: " + str(res['Collection']['Spatial']['HorizontalSpatialDomain']['Geometry']['BoundingRectangle']) + '\n')
            datasets += "================================================\n"
        # print(datasets)
        return datasets

    def get(self):
        #print(subprocess.check_output('ls',shell=True))
        # do stuff
        maap = MAAP(PATH_TO_MAAP_CFG)
        #maap = MAAP('/home/ubuntu/extensions/search/search/maap-py/maap.cfg')

        query_result = ''

        try:
            kw = self.get_argument('keyword', '')
            results = maap.searchCollection(keyword=kw)
            query_result = self.printResultsToString(results)
            # query_result = results
        except:
            kw = ''


        try:
            instr = self.get_argument('instrument', '')
            results = maap.searchCollection(instrument=instr)
            url_list = ''
            for res in results:
                url_list = url_list + res.getDownloadUrl() + '\n'
            query_result = url_list
        except:
            instr = ''


        #results = maap.searchCollection(keyword='precipitation')
        #granules = maap.searchGranule(short_name='MOD11A1')
        self.finish({"collections_found": query_result})


class GetGranulesHandler(IPythonHandler):
    def printUrls(self, granules):
        url_list = '[\n'
        for res in granules:
            url_list = url_list + '\'' + res.getDownloadUrl() + '\',\n'
        url_list = url_list + ']'
        return url_list

    def get(self):
        print(subprocess.check_output('ls',shell=True))
        print(subprocess.check_output('pwd',shell=True))
        # do stuff
        maap = MAAP(PATH_TO_MAAP_CFG)
        #maap = MAAP('/home/ubuntu/extensions/search/search/maap-py/maap.cfg')

        query_result = ''

        try:
            instr = self.get_argument('instrument', '')
            site = self.get_argument('sitename', '')
            platform = self.get_argument('platform', '')
            granules = maap.searchGranule(sitename=site, instrument=instr, platform=platform)
            query_result = self.printUrls(granules)
        except:
            instr = ''

        self.finish({"granule_urls": query_result})

