from IPython.core.magic import (Magics, magics_class, line_magic, cell_magic)
import requests
import json
import os

CHE_BASE_URL = 'https://che-k8s.maap.xyz'
preview_url = os.environ['PREVIEW_URL']
JUPYTER_SERVER_URL = CHE_BASE_URL+PREVIEW_URL
lk = 'http://localhost:8888'

@magics_class
class HysdsMagic(Magics):
    # '{workspace_id}'.format(workspace_id=workspace_id)

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
        url = lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        print('{}\n{}'.format(url,resp['result']))
        return
    
    @line_magic
    def status(self, line):
        endpoint = '/hysds/getStatus'
        call = '?job_id={}'.format(line.strip())
        url = lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        print('{}\n{}'.format(url,resp['result']))
        return
    
    @line_magic
    def result(self, line):
        endpoint = '/hysds/getResult'
        call = '?job_id={}'.format(line.strip())
        url = lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        print('{}\n{}'.format(url,resp['result']))
        return

#     @cell_magic
#     def cadabra(self, line, cell):
#         return line, cell

# @register_line_magic
# def execute(line):
#     algo_ver, = line.split('(')
#     return line


# @register_cell_magic
# def cmagic(line, cell):
#     "my cell magic"
#     return line, cell

# @register_line_cell_magic
# def lcmagic(line, cell=None):
#     "Magic that works both as %lcmagic and as %%lcmagic"
#     if cell is None:
#         print("Called as line magic")
#         return line
#     else:
#         print("Called as cell magic")
#         return line, cell

# In an interactive session, we need to delete these to avoid
# name conflicts for automagic to work on line magics.
# del lmagic, lcmagic