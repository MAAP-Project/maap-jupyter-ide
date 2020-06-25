import os.path
import sys
from notebook.base.handlers import IPythonHandler

import os
import glob
from pathlib import Path
import requests
import json
import urllib
#import xml.etree.ElementTree as ET
from xml.etree.ElementTree import fromstring, ElementTree

import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# set base url based on ops/dev environment
AUTH_SERVER = "https://auth.nasa.maap.xyz/cas"
if 'ENVIRONMENT' in os.environ.keys() and os.environ['ENVIRONMENT'] == 'OPS':
    AUTH_SERVER = "https://auth.maap-project.org/cas"


class MaapLoginHandler(IPythonHandler):
    def get(self, **params):
        try: 
            param_ticket = self.request.query_arguments['ticket'][0].decode('UTF-8')     
            param_service = self.request.query_arguments['service'][0].decode('UTF-8') 

            url = '{base_url}/p3/serviceValidate?ticket={ticket}&service={service}&pgtUrl={base_url}&state='.format(
                base_url=AUTH_SERVER, ticket=param_ticket, service=param_service)

            logger.debug('auth url: ' + url)

            auth_response = requests.get(
                url, 
                verify=False
            )

            logger.debug('auth response:')
            logger.debug(auth_response)

            xmldump = auth_response.text.strip()#.decode('utf8', 'ignore')
            
            logger.debug('xmldump:')
            logger.debug(xmldump)

            is_valid = True if "cas:authenticationSuccess" in xmldump or \
                            "cas:proxySuccess" in xmldump else False

            if is_valid:
                tree = ElementTree(fromstring(xmldump))
                root = tree.getroot()

                result = {}
                for i in root.iter():
                    if "PGTIOU" in i.tag:
                        continue
                    result[i.tag.replace("cas:", "").replace("{http://www.yale.edu/tp/cas}", "")] = i.text

                self.finish({"status_code": auth_response.status_code, "attributes": json.dumps(result)})
            else:
                self.finish({"status_code": 403, "response": xmldump, "json_object": {}})
            
        except ValueError:
            self.finish({"status_code": 500, "result": auth_response.reason, "json_object": {}})

    def _get_cas_attribute_value(self, attributes, attribute_key):

        if attributes and "cas:" + attribute_key in attributes:
            return attributes["cas:" + attribute_key]
        else:
            return ''
    
