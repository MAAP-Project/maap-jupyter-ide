from IPython.core.magic import (Magics, magics_class, line_magic, cell_magic)
import requests

@magics_class
class HysdsMagic(Magics):

    @line_magic
    def execute(self, line):
        lk = 'http://localhost:8888/hysds/execute?'
        id = 'org.n52.wps.server.algorithm.SimpleBufferAlgorithm'
        algo_ver,params = line.split('(')
        params = params[:-1]
        algo,ver = algo_ver.split(':')
        inputs = []
        for kvpair in params.split(','):
            k,v = kvpair.split('=')
            inputs.append(k)
        inputs.append('')
        call = 'algo_id={algo}&version={ver}&identifier={id}&inputs={inputs}&{params}'.format(algo=algo,ver=ver,id=id,inputs=','.join(inputs),params=params.replace(',','&'))
        url = lk + call
        r = requests.get(url)
        print('{}\n{}'.format(url,r.text))
        return 

    @cell_magic
    def cadabra(self, line, cell):
        return line, cell

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