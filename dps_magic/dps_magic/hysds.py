from IPython.core.magic import (Magics, magics_class, line_magic, cell_magic)
import requests
import json
import os

@magics_class
class HysdsMagic(Magics):
    # '{workspace_id}'.format(workspace_id=workspace_id)

    def __init__(self):
        super(HysdsMagic, self).__init__()
        CHE_BASE_URL = 'https://che-k8s.maap.xyz'
        PREVIEW_URL = os.environ['PREVIEW_URL']
        # self.JUPYTER_SERVER_URL = CHE_BASE_URL+PREVIEW_URL
        self.lk = CHE_BASE_URL+PREVIEW_URL
        # self.lk = 'http://localhost:8888'

    @line_magic
    def execute(self, line):
        endpoint = '/hysds/execute'
        id = 'org.n52.wps.server.algorithm.SimpleBufferAlgorithm'
        algo_ver,params = line.split('(')
        params = params[:-1]
        algo,ver = algo_ver.split(':')
        inputs = []
        for kvpair in params.split(','):
            k,v = kvpair.split('=')
            inputs.append(k)
        inputs.append('')
        call = '?algo_id={algo}&version={ver}&identifier={id}&inputs={inputs}&{params}'.format(algo=algo,ver=ver,id=id,inputs=','.join(inputs),params=params.replace(',','&'))
        url = self.lk + endpoint + call
        print(url)
        try:
            r = requests.get(url)
            try:
                resp = json.loads(r.text)
                print('{}\n{}'.format(url,resp['result']))
            except:
                print('response not json')
                print(r)
        except:
            print('can\'t make requests')
        return
    
    @line_magic
    def status(self, line):
        endpoint = '/hysds/getStatus'
        call = '?job_id={}'.format(line.strip())
        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        print('{}\n{}'.format(url,resp['result']))
        return
    
    @line_magic
    def result(self, line):
        endpoint = '/hysds/getResult'
        call = '?job_id={}'.format(line.strip())
        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        print('{}\n{}'.format(url,resp['result']))
        return
