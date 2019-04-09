import logging
import os
import requests
import json

import xml.etree.ElementTree as ET
from .Result import Collection, Granule
from .Dictlist import Dictlist
from .xmlParser import XmlDictConfig

try:
    from configparser import ConfigParser
except ImportError:
    from ConfigParser import ConfigParser


class MAAP(object):
    def __init__(self):

        self.config = ConfigParser()

        config_paths = list(map(self._get_config_path, [os.curdir, os.path.expanduser("~"), os.environ.get("MAAP_CONF") or '.']))

        for loc in config_paths:
            try:
                with open(loc) as source:
                    self.config.read_file(source)
                    break
            except IOError:
                pass

        if not self.config.has_option('service', 'maap_host'):
            raise IOError("No maap.cfg file found. Locations checked: " + '; '.join(config_paths))

        self._MAAP_TOKEN = self.config.get("service", "maap_token")
        self._PAGE_SIZE = self.config.getint("request", "page_size")
        self._CONTENT_TYPE = self.config.get("request", "content_type")
        self._API_HEADER = {'Accept': self._CONTENT_TYPE, 'token': self._MAAP_TOKEN}

        self._SEARCH_GRANULE_URL = self.config.get("service", "search_granule_url")
        self._SEARCH_COLLECTION_URL = self.config.get("service", "search_collection_url")
        self._ALGORITHM_REGISTER = self.config.get("service", "algorithm_register")
        self._ALGORITHM_BUILD = self.config.get("service", "algorithm_build")
        self._JOB_STATUS = self.config.get("service", "job_status")
        self._MAAP_HOST = self.config.get("service", "maap_host")

        self._AWS_ACCESS_KEY = self.config.get("aws", "aws_access_key_id")
        self._AWS_ACCESS_SECRET = self.config.get("aws", "aws_secret_access_key")
        self._INDEXED_ATTRIBUTES = json.loads(self.config.get("search", "indexed_attributes"))

    def _get_config_path(self, directory):
        return os.path.join(directory, "maap.cfg")

    def _get_search_params(self, **kwargs):
        mapped = self._map_indexed_attributes(**kwargs)
        parsed = self._parse_terms(mapped, '|')

        return parsed

    # Parse delimited terms into value arrays
    def _parse_terms(self, parms, delimiter):
        res = Dictlist()

        for i in parms:
            if delimiter in parms[i]:
                for j in parms[i].split(delimiter):
                    res[i + '[]'] = j
            else:
                res[i] = parms[i]

        return res

    # Conform attribute searches to the 'additional attribute' method:
    # https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html#g-additional-attribute
    def _map_indexed_attributes(self, **kwargs):
        p = Dictlist(kwargs)

        for i in self._INDEXED_ATTRIBUTES:
            search_param = i.split(',')[0]

            if search_param in p:
                search_key = i.split(',')[1]
                data_type = i.split(',')[2]

                p['attribute[]'] = data_type + ',' + search_key + ',' + p[search_param]

                del p[search_param]

        return p

    def _get_search_results(self, url, limit, **kwargs):
        """
        Search the CMR granules
        :param limit: limit of the number of results
        :param kwargs: search parameters
        :return: list of results (<Instance of Result>)
        """
        logging.info("======== Waiting for response ========")

        page_num = 1
        results = []
        while len(results) < limit:
            parms = self._get_search_params(**kwargs)

            response = requests.get(
                url=url,
                params=dict(parms, page_num=page_num, page_size=self._PAGE_SIZE),
                headers=self._API_HEADER
            )
            unparsed_page = response.text[1:-2].replace("\\", "")
            page = ET.XML(unparsed_page)

            empty_page = True
            for child in list(page):
                if child.tag == 'result':
                    results.append(XmlDictConfig(child))
                    empty_page = False
                elif child.tag == 'error':
                    raise ValueError('Bad search response: {}'.format(unparsed_page))

            if empty_page:
                break
            else:
                page_num += 1
        return results

    def searchGranule(self, limit=20, **kwargs):
        """
            Search the CMR granules

            :param limit: limit of the number of results
            :param kwargs: search parameters
            :return: list of results (<Instance of Result>)
            """
        results = self._get_search_results(url=self._SEARCH_GRANULE_URL, limit=limit, **kwargs)
        return [Granule(result, self._AWS_ACCESS_KEY, self._AWS_ACCESS_SECRET) for result in results][:limit]

    def getCallFromEarthdataQuery(self, query, variable_name='maap'):
        """
            Generate a literal string to use for calling the MAAP API

            :param query: a Json-formatted string from an Earthdata search-style query. See: https://github.com/MAAP-Project/earthdata-search/blob/master/app/controllers/collections_controller.rb
            :param variable_name: the name of the MAAP variable to qualify the search call
            :return: string in the form of a MAAP API call
            """
        y = json.loads(query)

        params = []

        for key, value in y.items():
            if key.endswith("_h"):
                params.append(key[:-2] + "=\"" + "|".join(value) + "\"")
            elif key == "bounding_box":
                params.append(key + "=\"" + value + "\"")
            elif key == "p":
                params.append("collection_concept_id=\"" + value.replace("!", "|") + "\"")

        result = variable_name + ".searchGranule(" + ", ".join(params) + ")"

        return result


    def searchCollection(self, limit=100, **kwargs):
        """
        Search the CMR collections
        :param limit: limit of the number of results
        :param kwargs: search parameters
        :return: list of results (<Instance of Result>)
        """
        results = self._get_search_results(url=self._SEARCH_COLLECTION_URL, limit=limit, **kwargs)
        return [Collection(result, self._MAAP_HOST) for result in results][:limit]

    def registerAlgorithm(self, arg):
        response = requests.post(
            url=self._ALGORITHM_REGISTER,
            json=arg,
            headers=self._API_HEADER
        )
        return response

    def getJobStatus(self, jobid):
        response = requests.get(
            url=self._JOB_STATUS,
            params=dict(job_id=jobid),
            headers=self._API_HEADER
        )
        return response


if __name__ == "__main__":
    print("initialized")
