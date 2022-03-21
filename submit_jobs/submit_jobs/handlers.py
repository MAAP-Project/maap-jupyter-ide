from notebook.base.handlers import IPythonHandler
from notebook.notebookapp import list_running_servers
import xml.etree.ElementTree as ET
import requests
import subprocess
import json
import datetime
import copy
import sys
import os
import re
import logging
import yaml
import functools
from maap.maap import MAAP
from .fields import getFields

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

FILEPATH = os.path.dirname(os.path.abspath(__file__))
WORKDIR = FILEPATH+'/..'
# WORKDIR = os.getcwd()+'/../../submit_jobs'
sys.path.append(WORKDIR)

# helper to parse out algorithm parameters for execute, describe
def getParams(rt):
    process = rt[0][0]
    attrib = []
    inputs = []
    for node in process:
        tag = node.tag.split('}')[1]
        if tag in ['Title', 'Identifier']:
            attrib.append((tag, node.text))
        elif tag == 'Input':
            if node[0].text == 'queue_name':
                queue_name = node[2][1][0][0].text
                inputs.append(('queue_name', queue_name))
            else:
                typ = node[2][0].attrib['mimeType']
                inputs.append((node[0].text, typ))
    attrib.append(('Input', inputs))
    return attrib

# helper to parse out products of result
def getProds(node):
    tag = node.tag[node.tag.index('}')+1:]
    if tag in ['JobID']:
        return (tag,node.text)
    elif tag == 'Output':
        return (tag,[loc.text for loc in node])
    else:
        return (tag,[getProds(e) for e in node])

# helper to parse out user-defined inputs when registering algorithm
def parseInputs(popped):
    p1 = [{e['name']:str(e['download']).lower()} for e in popped] 			# parse {"name":"varname","download":boolean} to {"varname":boolean}, convert boolean to lower
    return {k: v for d in p1 for k, v in d.items()}							# flatten list of dicts to just 1 dict

# helper to print accepted user-defined inputs when registering algorithm
def printInputs(resp, inputs):
    result = resp['message'] + '\nInputs:\n'
    for name in inputs.keys():
            if len(name) > 0:
                if inputs[name] == 'true':
                    result += '\t{} (download)\n'.format(name)
                else:
                    result += '\t{} (no download)\n'.format(name)
    return result

# helper to parse user job history
# convert list of strings to list of jobs, rep as dicts
def parse_job(job):
    job = eval(job)
    job_id = job[0]
    status = job[1]
    algo_id = job[2]
    inputs = job[3]
    [x.pop('destination') for x in inputs]
    ts = list(filter(lambda j: j['name'] == 'timestamp', inputs))
    ts = '0' if ts == [] else ts[0]['value']
    return {'job_id':job_id, 'status':status, 'algo_id':algo_id, 'inputs':inputs, 'timestamp':ts}

# helper to parse listed job's detailed info in HTML
def detailed_display(job):
    job_id = job['job_id']
    status = job['status']
    algo_id = job['algo_id']
    inputs = job['inputs']

    result = 'JobID: {}\nStatus: {}\nAlgorithm: {}\nInputs:\n'.format(job_id,status, algo_id)
    for i in inputs:
        result +='	{}: {}\n'.format(i['name'],i['value'])
    return result

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

# currently allows repos from both repo.nasa.maap and mas.maap-project
class RegisterAlgorithmHandler(IPythonHandler):
    def get(self, **params):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        # logging.debug('workdir is '+WORKDIR)
        fields = ['config_path', 'queue']
        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
                # logging.debug('found '+f)
            except:
                params[f] = ''
                # logging.debug('no '+f)

        # load register fields from config yaml
        config = {}
        # check config exists
        os.path.exists(params['config_path'])
        with open(params['config_path'], 'r') as stream:
            config = yaml.load(stream)

        if config['description'] in ['null', None]:
            config['description'] = ''

        if config['inputs'] in ['null', None]:
            config['inputs'] = ''

        if 'queue' in params.keys():
            config['queue'] = params['queue']

            # TODO: bug fix needed -- this mangles the input section of the config yaml
            # Commenting out for now 
            # # overwrite config yaml with queue
            # config_template = WORKDIR+"/submit_jobs/register.yaml"
            # new_config = ''
            # with open(config_template, 'r') as infile:
            #     new_config = infile.read()
            #     new_config = new_config.format(**config)
            #     os.remove(params['config_path'])
            #     with open(params['config_path'], 'w') as outfile:
            #         outfile.write(new_config)

        logging.debug('fields')
        logging.debug(fields)

        logging.debug('config params are')
        logging.debug(config)

        json_file = WORKDIR+"/submit_jobs/register_url.json"

        # only description and inputs are allowed to be empty
        for f in ['algo_name','version','environment','run_command','repository_url','queue','docker_url']:
            if config[f] == '' or config[f] == None:
                self.finish({"status_code": 412, "result": "Error: Register field {} cannot be empty".format(f)})
                return

        if not 'inputs' in config.keys():
            config['inputs'] = {}

        if not 'build_command' in config.keys():
            config['build_command'] = {}

        # replace spaces in algorithm name
        config['algo_name'] = config['algo_name'].replace(' ', '_')

        logging.debug('repo url is {}'.format(config['repository_url']))

        # check if repo is hosted on a MAAP GitLab instance
        if (not ('repo.nasa.maap') in config['repository_url']) and (not ('maap-project.org') in config['repository_url']):
            self.finish({"status_code": 412, "result": "Error: Your git repo is not from a supported host (e.g. mas.maap-project.org)"})
            return

        # ==================================
        # Part 2: Check if User Has Committed
        # ==================================
        if params['config_path'] != '':
            # navigate to project directory
            proj_path = ('/').join(params['config_path'].split('/')[:-1])
            os.chdir(proj_path)

            # get git status
            try:
                git_status_out = subprocess.check_output("git status --branch --porcelain", shell=True).decode("utf-8")
                logger.debug(git_status_out)

            # is there a git repo?
            except:
                # subprocess could also error out (nonzero exit code)
                self.finish({"status_code": 412, "result": "Error: \nThe code you want to register is not saved in a git repository."})
                return

            git_status = git_status_out.splitlines()[1:]
            git_status = [e.strip() for e in git_status]

            # filter for unsaved python, julia, matlab shell files
            unsaved = list(filter(lambda e: ( (e.split('.')[-1] in ['ipynb','py','sh','jl','r','m','mat']) and (e[0] in ['M','?']) ), git_status))
            if len(unsaved) != 0:
                self.finish({"status_code": 412, "result": "Error: Notebook(s) and/or script(s) have not been committed\n{}".format('\n'.join(unsaved))})
                return

            git_unpushed = ('[ahead' in git_status_out[0].strip())
            if git_unpushed:
                self.finish({"status_code": 412, "result": "Error: Recent commits have not been pushed"})
                return

        # ==================================
        # Part 3: Build & Send Request
        # ==================================
        json_in_file = WORKDIR+"/submit_jobs/register_inputs.json"

        with open(json_in_file) as f:
            ins_json = f.read()

        # build inputs json		
        popped = config.pop('inputs')
        inputs = parseInputs(popped) if popped != None else {}

        ins = ''
        for name in inputs.keys():
            if len(name) > 0:
                if len(ins) > 0:
                    ins += ','
                ins += ins_json.format(field_name=name, dl=inputs[name])

        # print(ins)
        # add inputs json to config for template substitution
        config['algo_inputs'] = ins

        with open(json_file) as jso:
            req_json = jso.read()

        req_json = req_json.format(**config)

        # ==================================
        # Part 4: Check Response
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        try:
            r = maap.registerAlgorithm(req_json)
            logging.debug(r.text)
            if r.status_code == 200:
                try:
                    # MAAP API response
                    resp = json.loads(r.text)
                    # show registered inputs
                    result = printInputs(resp,inputs)
                    self.finish({"status_code": resp['code'], "result": result})
                except:
                    self.finish({"status_code": r.status_code, "result": r.text})
            else:
                print('failed')
                self.finish({"status_code": r.status_code, "result": r.reason})
        except:
            self.finish({"status_code": 400, "result": "Bad Request"})

class DeleteAlgorithmHandler(IPythonHandler):
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        complete = True
        fields = getFields('deleteAlgorithm')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                complete = False

        if all(e == '' for e in list(params.values())):
            complete = False

        # print(complete)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        if complete:
            r = maap.deleteAlgorithm('{algo_id}:{version}'.format(**params))
        else:
            r = maap.listAlgorithms()

        # print(r.status_code)
        # print(r.text)

        # ==================================
        # Part 3: Check & Parse Response
        # ==================================

        if r.status_code == 200:
            try:
                if complete:
                    # MAAP API response
                    resp = json.loads(r.text)
                    # show registered inputs
                    result = resp['message']
                else:
                    resp = json.loads(r.text)
                    result = 'Algorithms:\n'
                    for e in resp['algorithms']:
                        result += '\t{}:{}\n'.format(e['type'],e['version'])

                if result.strip() == '':
                    result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                    self.finish({"status_code": 400, "result": result})
                    return

                # print(result)
                self.finish({"status_code": r.status_code, "result": result})
            except:
                self.finish({"status_code": r.status_code, "result": r.text})

        # malformed request will still give 500
        elif r.status_code == 500:
            if 'AttributeError' in r.text:
                result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                self.finish({"status_code": 400, "result": result})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason})
        else:
            self.finish({"status_code": r.status_code, "result": r.reason})

class PublishAlgorithmHandler(IPythonHandler):
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        fields = getFields('publishAlgorithm')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                complete = False

        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        r = maap.publishAlgorithm('{algo_id}:{version}'.format(**params))

        # print(r.status_code)
        # print(r.text)

        # ==================================
        # Part 3: Check & Parse Response
        # ==================================

        if r.status_code == 200:
            try:
                if complete:
                    # MAAP API response
                    resp = json.loads(r.text)
                    # show registered inputs
                    result = resp['message']
                else:
                    resp = json.loads(r.text)
                    result = 'Algorithms:\n'
                    for e in resp['algorithms']:
                        result += '\t{}:{}\n'.format(e['type'],e['version'])

                if result.strip() == '':
                    result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                    self.finish({"status_code": 400, "result": result})
                    return

                # print(result)
                self.finish({"status_code": r.status_code, "result": result})
            except:
                self.finish({"status_code": r.status_code, "result": r.text})

        # malformed request will still give 500
        elif r.status_code == 500:
            if 'AttributeError' in r.text:
                result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                self.finish({"status_code": 400, "result": result})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason})
        else:
            self.finish({"status_code": r.status_code, "result": r.reason})

class GetCapabilitiesHandler(IPythonHandler):
    def get(self):
        # No Required Arguments
        # ==================================
        # Part 1: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        r = maap.getCapabilities()

        # ==================================
        # Part 2: Check & Parse Response
        # ==================================
        try:
            try:
                # parse out capability names & request info
                rt = ET.fromstring(r.text)
                result = ''

                meta = rt[0]
                info = [(n.tag[n.tag.index('}')+1:], n.text) for n in meta]
                for (tag,txt) in info:
                    result += '{tag}: {txt}\n'.format(tag=tag,txt=txt)
                result += '\n'

                cap = rt[2]
                cap_info = [ \
                    ( e.attrib['name'], \
                        e[0][0][0].tag[ e[0][0][0].tag.index('}')+1 : ], \
                        list(e[0][0][0].attrib.values())[0] \
                    ) for e in cap ]

                # print request type and url in indented new line below capability name
                for (title, req_type, req_url) in cap_info:
                    result += '{title}\n	{req_type}\n	{req_url}\n\n'.format(title=title,req_type=req_type,req_url=req_url)

                # print(result)
                self.finish({"status_code": r.status_code, "result": result})

            except:
                self.finish({"status_code": r.status_code, "result": r.text})
        except:
            print('failed')
            self.finish({"status_code": r.status_code, "result": r.reason})

class ExecuteHandler(IPythonHandler):
    def args_to_dict(self):
        # convert args to dict
        params = self.request.arguments
        for k,v in params.items():
            params[k] = v[0].decode("utf-8")
        return params

    def get(self):
        # outsourced to maap-py lib
        kwargs = self.args_to_dict()
        maap = MAAP(maap_api(self.request.host))
        resp = maap.submitJob(**kwargs)
        logger.debug(resp)
        status_code = resp['http_status_code']
        if status_code == 200:
            result = 'JobID is {}'.format(resp['job_id'])
            self.finish({"status_code": status_code, "result": result})
        elif status_code == 400:
            self.finish({"status_code": status_code, "result": resp['result']})
        else:
            self.finish({"status_code": status_code, "result": resp['status']})

class GetStatusHandler(IPythonHandler):
    # inputs: job_id
    # outputs: job_status, result (dialog text of job_status)
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        fields = getFields('getStatus')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                arg = ''

        # print(params)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        try:
            r = maap.getJobStatus(params['job_id'])
            # print(r.status_code)
            # print(r.text)

            # ==================================
            # Part 3: Check Response
            # ==================================
            # bad job id will still give 200
            if r.status_code == 200:
                try:
                    # parse out JobID from response
                    rt = ET.fromstring(r.text)

                    job_id = rt[0].text
                    job_status = rt[1].text
                    # print(job_id)

                    result = 'JobID is {}\nStatus: {}'.format(job_id,job_status)
                    # print("success!")
                    self.finish({"status_code": r.status_code, "result": result, "job_status":job_status})
                except:
                    self.finish({"status_code": r.status_code, "result": r.text, "job_status":''})
            # if no job id provided
            elif r.status_code in [404]:
                # if bad job id, show provided parameters
                result = 'Exception: {}\nMessage: {}\n(Did you provide a valid JobID?)\n'.format(rt[0].attrib['exceptionCode'], rt[0][0].text)
                result += '\nThe provided parameters were:\n'
                for f in fields:
                    result += '\t{}: {}\n'.format(f,params[f])
                result += '\n'
                self.finish({"status_code": 404, "result": result, "job_status":''})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason, "job_status":''})
        except:
            self.finish({"status_code": 400, "result": "Bad Request","job_status":''})

class GetMetricsHandler(IPythonHandler):
    # inputs: job_id
    # outputs: result (HTML table with metric name & value), metrics (JSON object with k-v as metric-value)
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        fields = getFields('getMetrics')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                arg = ''

        # print(params)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        try:
            r = maap.getJobMetrics(params['job_id'])
            # print(r.status_code)
            # print(r.text)

            # ==================================
            # Part 3: Check Response
            # ==================================
            if r.status_code == 200:
                try:
                    # parse XML response
                    metrics = ET.fromstring(r.text)
                    logging.debug(metrics)
                    
                    # format metrics into html table
                    result = '<table id="job-metrics" style="border-style: none; font-size: 11px">'
                    result += '<tbody>'
                    for n in metrics:
                        result += '<tr><td style="text-align:left">{}</td><td style="text-align:left">{}</td></tr>'.format(n.tag,n.text)
                    result += '</tbody>'
                    result += '</table>'
                    logging.debug(result)
                    # print("success!")
                    self.finish({"status_code": r.status_code, "result": result, "metrics":r.text})
                except:
                    self.finish({"status_code": r.status_code, "result": r.text, "metrics":{}})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason, "metrics":{}})

        except:
            self.finish({"status_code": 400, "result": "Bad Request", "metrics":{}})

class GetResultHandler(IPythonHandler):
    # inputs: job_id
    # outputs: result (HTML table with product name & locations)
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        fields = getFields('getResult')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                arg = ''

        # print(params)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        try:
            r = maap.getJobResult(params['job_id'])
            # print(r.status_code)
            # print(r.text)

            # ==================================
            # Part 3: Check & Parse Response
            # ==================================
            if r.status_code == 200:
                try:
                    # parse out JobID from response
                    rt = ET.fromstring(r.text)

                    # if bad job id, show provided parameters
                    if 'Exception' in r.text:
                        result = 'Exception: {}\nMessage: {}\n'.format(rt[0].attrib['exceptionCode'], rt[0][0].text)
                        result += '\nThe provided parameters were:\n'
                        for f in fields:
                            result += '\t{}: {}\n'.format(f,params[f])
                        result += '\n'

                        self.finish({"status_code": 404, "result": result})
                    else:
                        job_id = rt[0].text
                        logging.debug('job_id is {}'.format(job_id))
                        # print(job_id)

                        result = '<table id="job-result-display" style="border-style: none; font-size: 11px">'
                        # result += '<thead><tr><th colspan="2" style="text-align:left"> Job Results</th></tr></thead>'
                        result += '<tbody>'
                        result += '<tr><td>JobID: </td><td style="text-align:left">{}</td></tr>'.format(job_id)

                        # get product name
                        product_name = rt[1].attrib['id']
                        logging.debug('product name is {}'.format(product_name))
                        result += '<tr><td>ProductName: </td><td style="text-align:left">{}</td></tr>'.format(product_name)

                        # format urls for table
                        prods = rt[1]
                        p = getProds(prods) #(Output,['url1','url2'])

                        url_lst = p[1]

                        ## make the last link clickable if is not the traceback
                        lnk = url_lst[-1]
                        if (product_name == "traceback"):
                            result += '<tr><td>{}: </td><td style="text-align:left">{}</td></tr>'.format('Traceback', lnk)
                        else:
                            url_lst[-1] = '<a href="{}" target="_blank" style="border-bottom: 1px solid #0000ff; color: #0000ff;">{}</a>'.format(lnk, lnk)
                            urls_str = '•&nbsp'+('<br>•&nbsp;').join(url_lst)
                            result += '<tr><td>{}: </td><td style="text-align:left">{}</td></tr>'.format('Locations', urls_str)

                        result += '</tbody>'
                        result += '</table>'
                        logging.debug(result)

                        # print("success!")
                        self.finish({"status_code": r.status_code, "result": result})
                except:
                    self.finish({"status_code": r.status_code, "result": r.text})
            # if no job id provided
            elif r.status_code in [404]:
                # print('404?')
                # if bad job id, show provided parameters
                result = 'Exception: {}\nMessage: {}\n(Did you provide a valid JobID?)\n'.format(rt[0].attrib['exceptionCode'], rt[0][0].text)
                result += '\nThe provided parameters were:\n'
                for f in fields:
                    result += '\t{}: {}\n'.format(f,params[f])
                result += '\n'
                self.finish({"status_code": 404, "result": result})

            else:
                try:
                    rt = ET.fromstring(r.text)
                    result = rt[0][0].text
                    self.finish({"status_code": r.status_code, "result": result})
                except:
                    self.finish({"status_code": r.status_code, "result": r.reason})
        except:
            self.finish({"status_code": 400, "result": "Bad Request"})

class DismissHandler(IPythonHandler):
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        fields = getFields('dismiss')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                arg = ''

        # print(params)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        try:
            r = maap.dismissJob(params['job_id'])
            # print(r.status_code)
            # print(r.text)

            # ==================================
            # Part 3: Check Response
            # ==================================
            # if no job id provided
            if params['job_id'] == '':
                result = 'Exception: \nMessage: {}\nEmpty JobID provided.\n'
                result += '\nThe provided parameters were:\n'
                for f in fields:
                    result += '\t{}: {}\n'.format(f,params[f])
                result += '\n'
                self.finish({"status_code": 404, "result": result})
            elif 'Exception' in r.text:
                # parse exception code and message from xml response
                rt = ET.fromstring(r.text)
                exception_code = rt[0].attrib['exceptionCode']
                exception_text = rt[0][0].text

                result = 'Exception: {}\nMessage: {}\n'.format(exception_code, exception_text)
                result += '\nThe provided parameters were:\n'

                for f in fields:
                    result += '\t{}: {}\n'.format(f,params[f])
                result += '\n'
                self.finish({"status_code": 404, "result": result})
            # if dismissal successful
            elif r.status_code == 200:
                try:
                    # parse out JobID from response
                    rt = ET.fromstring(r.text)

                    job_id = rt[0].text
                    status = rt[1].text
                    # print(job_id)

                    result = 'JobID is {}\nStatus: {}'.format(job_id,status)
                    # print("success!")
                    self.finish({"status_code": r.status_code, "result": result})
                except:
                    self.finish({"status_code": r.status_code, "result": r.text})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason})
        except:
            self.finish({"status_code": 400, "result": "Bad Request"})

class DeleteHandler(IPythonHandler):
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        fields = getFields('delete')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                arg = ''

        # print(params)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        try:
            r = maap.deleteJob(params['job_id'])
            # print(r.status_code)
            # print(r.text)

            # ==================================
            # Part 3: Check Response
            # ==================================
            # if no job id provided
            if params['job_id'] == '':
                result = 'Exception: \nMessage: {}\nEmpty JobID provided.\n'
                result += '\nThe provided parameters were:\n'
                for f in fields:
                    result += '\t{}: {}\n'.format(f,params[f])
                result += '\n'
                self.finish({"status_code": 404, "result": result})
            # if deletion successful
            elif r.status_code == 200:
                try:
                    # parse out JobID from response
                    rt = ET.fromstring(r.text)

                    job_id = rt[0].text
                    status = rt[1].text
                    # print(job_id)

                    result = 'JobID is {}\nStatus: {}'.format(job_id,status)
                    # print("success!")
                    self.finish({"status_code": r.status_code, "result": result})
                except:
                    self.finish({"status_code": r.status_code, "result": r.text})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason})
        except:
            self.finish({"status_code": 400, "result": "Bad Request"})

class DescribeProcessHandler(IPythonHandler):
    # inputs: algo_id, version
    # outputs: algo_lst, result (PRE HTML with algo details)
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        complete = True
        fields = getFields('describeProcess')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                complete = False

        # print(params)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        params.pop('proxy-ticket')
        if all(e == '' for e in list(params.values())):
            complete = False

        # logging.debug(list(params.values()))
        # logging.debug(complete)

        maap = MAAP(maap_api(self.request.host))
        # return all algorithms if malformed request
        if complete:
            r = maap.describeAlgorithm('{algo_id}:{version}'.format(**params))
        else:
            r = maap.listAlgorithms()

        # print(r.status_code)
        # print(r.text)

        # ==================================
        # Part 3: Check & Parse Response
        # ==================================

        if r.status_code == 200:
            algo_lst = []
            queue_name = ''
            try:
                if complete:
                    # parse out capability names & request info
                    rt = ET.fromstring(r.text)
                    attrib = getParams(rt)

                    result = ''
                    for tag, val in attrib:
                        if tag == 'Identifier':
                            algo_lst.append(val)
                            algo,version = val.split(':')
                            result += '{tag}:\t{val}\n'.format(tag='Algorithm', val=algo)
                            result += '{tag}:\t{val}\n'.format(tag='Version', val=version)

                        elif tag == 'Input':
                            result += '{}:\n'.format(tag)
                            for tag1, val1 in val:
                                result += '\t{tag1}:\t{val1}\n'.format(tag1=tag1, val1=val1)
                                if tag1 == 'queue_name':
                                    queue_name = val1
                        # result += '\n'


                # if no algorithm passed, list all algorithms
                else:
                    resp = json.loads(r.text)
                    result = 'Algorithms:\n'
                    for e in resp['algorithms']:
                        result += '\t{}:{}\n'.format(e['type'],e['version'])

                    # return set of algos, each mapped to list of versions
                    lst = result.replace('\n','').split('\t')[1:]
                    splt_lst = [e.split(':') for e in lst]
                    algo_lst = {}

                    for a in splt_lst:
                        if not a[0] in algo_lst:
                            algo_lst[a[0]] = [a[1]]
                        else:
                            algo_lst[a[0]].append(a[1])

                if result.strip() == '':
                    result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                    self.finish({"status_code": 400, "result": result})
                    return

                # print(result)
                self.finish({"status_code": r.status_code, "result": result, "algo_set": algo_lst, "queue": queue_name})
            except:
                self.finish({"status_code": r.status_code, "result": r.text})

        # malformed request will still give 500
        elif r.status_code == 500:
            if 'AttributeError' in r.text:
                result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                self.finish({"status_code": 400, "result": result})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason})
        else:
            self.finish({"status_code": 400, "result": "Bad Request"})

class ExecuteInputsHandler(IPythonHandler):
    def get(self):
        # ==================================
        # Part 1: Parse Required Arguments
        # ==================================
        complete = True
        fields = getFields('executeInputs')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                params[f] = ''
                complete = False

        if all(e == '' for e in list(params.values())):
            complete = False

        params2 = copy.deepcopy(params)
        # params2.pop('identifier')
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        # return all algorithms if malformed request
        if complete:
            r = maap.describeAlgorithm('{algo_id}:{version}'.format(**params))
        else:
            r = maap.listAlgorithms()

        # ==================================
        # Part 3: Check & Parse Response
        # ==================================

        if r.status_code == 200:
            try:
                if complete:
                    # parse out capability names & request info
                    rt = ET.fromstring(r.text)
                    attrib = getParams(rt)  					                    # parse XML
                    inputs = attrib[2][-1]                                         # identifier & type for each input
                    ins_req = list(filter(lambda e: e[0] not in
                        ['timestamp', 'username','queue_name'], inputs)) 	                    # filter out automatic timestamp,username req input
                    queue_val = list(filter(lambda e: e[0] == 'queue_name', inputs))[0][1]
                    params['queue_name'] = queue_val                                # add queue name to predefined parameters

                    result = ''
                    for (identifier, typ) in ins_req:
                        result += '{identifier}:\t{typ}\n'.format(identifier=identifier, typ=typ)

                    logging.debug(params)
                    logging.debug(ins_req)
                    self.finish({"status_code": r.status_code, "result": result, "ins": ins_req, "old":params})
                    return

                else:
                    # print('failed 200')
                    result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                    self.finish({"status_code": 400, "result": result, "ins": [], "old":params})
                    return

            except:
                self.finish({"status_code": 500, "result": r.text, "ins": [], "old":params})

        # malformed request will still give 500
        elif r.status_code == 500:
            if 'AttributeError' in r.text:
                result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
                self.finish({"status_code": 400, "result": result, "ins": [], "old":params})
            else:
                self.finish({"status_code": 500, "result": r.reason, "ins": [], "old":params})
        else:
            self.finish({"status_code": 400, "result": "Bad Request", "ins": [], "old":params})

class DefaultValuesHandler(IPythonHandler):
    # inputs: code_path, username
    # outputs: repository_url, algo_name, version, run_command, docker_url, environment_name
    def get(self):
        # ==================================
        # Part 1: Get Notebook Information Processed in UI
        # ==================================
        fields = getFields('defaultValues')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                params[f] = ''
        
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Extract Required Register Parameters
        # ==================================
        # full path provided by ts from PageConfig
        proj_path = os.path.expanduser(params['code_path'])
        proj_path = '/'.join(proj_path.split('/')[:-1])
        os.chdir(proj_path)

        config_path = proj_path+"/algorithm_config.yaml"
        prev_config = os.path.exists(config_path)
        if not prev_config:
            # get git remote url (req)
            repo_url = ''
            try:
                repo_url = subprocess.check_output("git remote get-url origin", shell=True).decode('utf-8').strip()
                logger.debug('repo url is {}'.format(repo_url))
            #return error messsage if unable to get required values for registering
            except:
                self.finish({"status_code": 412, "reason":"Path provided was not a git repository. \n{}".format(proj_path)})
                return

            vals = {}
            username = params['username']
            code_path = params['code_path']
            file_name = code_path.split('/')[-1]
            algo_name = file_name.replace('/',':').replace(' ', '_').replace('"','').replace("'",'')
            vals['algo_name'] = ('.').join(algo_name.split('.')[:-1])

            # if tutorial repo, prepend demo-${username} to algo name
            p = re.compile('https:\/\/(oauth2:)?.*(@)?repo\\.maap-project\.org\/.*\/hello-world')
            m = p.search(repo_url)
            if m is not None:
                vals['algo_name'] = 'demo-{}-{}'.format(username,vals['algo_name'])

            # version is branch name
            branch_name = subprocess.check_output("git branch | grep '*' | awk '{print $2}'",shell=True).decode('utf-8').strip()
            # logging.debug('branch is {}'.format(branch_name))
            vals['version'] = branch_name
            vals['description'] = ''
            vals['disk_space'] = '10GB'
            vals['repository_url'] = repo_url
            # vals['environment'] = os.environ['ENVIRONMENT']
            vals['environment'] = "ubuntu"

            vals['docker_url'] = ''
            try:
                vals['docker_url'] = os.environ['DOCKERIMAGE_PATH']
            except:
                self.finish({"status_code":400, "reason":"Environment base image could not be found. \nAre you registering from within the Che environment?"})
                return

            vals['run_command'] = params['code_path']

            vals['disk_space'] = "10GB"
            vals['queue'] = "15GB"

            # default example algo inputs
            ins = ''
            inputs = [{'name': 'path-number', 'download': False}, 
                {'name': 'file-to-copy-in', 'download': True}]

            ins_template = ''
            with open(WORKDIR+'/submit_jobs/register_inputs.yaml') as f:
                ins_template = f.read()

            for i in inputs:
                ins += ins_template.format(**i)
            vals['inputs'] = ins

            logger.debug('vals before reading')
            logger.debug(vals)

            # read in config template and populate with default values
            config = ''
            config_template = WORKDIR+"/submit_jobs/register.yaml"
            with open(config_template,'r') as infile:
                config = infile.read()
                config = config.format(**vals)

            # output config yaml
            with open(config_path,'w') as outfile:
                outfile.write(config)

        settings = {}
        # repopulate vals with current config settings
        with open(config_path,'r') as stream:
            settings = yaml.load(stream)
        
        if settings['description'] in ['null', None]:
            settings['description'] = ''

        if settings['inputs'] in ['null', None]:
            settings['inputs'] = []

        logger.debug(settings)

        # outputs: algo_name, version, environment, repository_url, dockerfile_path
        self.finish({"status_code": 200, "result": "Got default values.", "default_values":settings, "config_path":config_path, "previous_config":prev_config})

class ListJobsHandler(IPythonHandler):
    # inputs: username
    # outputs: job list, containing job_id, status, algo_id, and inputs
    def get(self):
        fields = getFields('listJobs')

        params = {}
        for f in fields:
            try:
                arg = self.get_argument(f.lower(), '').strip()
                params[f] = arg
            except:
                arg = ''

        # print(params)
        logging.debug('params are')
        logging.debug(params)

        # ==================================
        # Part 2: Build & Send Request (outsourced to maap-py lib)
        # ==================================
        maap = MAAP(maap_api(self.request.host))
        try:
            r = maap.listJobs(params['username'])
            # print(r.status_code)
            # print(r.text)

            # ==================================
            # Part 3: Check Response
            # ==================================
            # bad job id will still give 200
            if r.status_code == 200:
                jobs = []
                details = {}
                table = ""
                try:
                    # parse out JobID from response
                    resp = json.loads(r.text)
                    jobs = resp['jobs']											# save joblist
                    jobs = [parse_job(job) for job in jobs] 					# parse inputs from string to dict
                    # logger.debug('parsing jobs list')
                    # logger.debug(jobs)
                    jobs = sorted(jobs, key=lambda j: j['timestamp'],reverse=True) 	# sort list of jobs by timestamp (most recent)

                    table += '<table id="job-cache-display">'
                    table += '<col width=33%>'
                    table += '<col width=33%>'
                    table += '<col width=33%>'
                    table += '<thead><tr>'
                    table += '<th>Job Id</th>'
                    table += '<th>Status</th>'
                    table += '<th>Algorithm</th>'
                    table += '</tr></thead>'
                    table += '<tbody>'
                    
                    for job in jobs:
                        job['detailed'] = detailed_display(job)
                        table += '<tr><td>{}</td><td>{}</td><td>{}</td></tr>'.format(job['job_id'],job['status'],job['algo_id'])
                        details[job['job_id']] = detailed_display(job)

                    table += '</tbody>'
                    table += '</table>'


                    result = '<div id = "jobs-div" style="height:100%; width:340px">'
                    result += '<div id = "job-table" style="overflow:auto; max-height:45%; width: 335px; font-size:11px;">'
                    result += table
                    result += '</div>'
                    result += '</div>'
                    logging.debug(table)
                    
                    # convert jobs list to dict, keyed by id
                    job_ids = [e['job_id'] for e in jobs]
                    jobs_dict = {job_ids[i]:jobs[i] for i in range(0,len(job_ids))}
                    logging.debug(jobs_dict)

                    # print("success!")
                    self.finish({"status_code": r.status_code, "result": result, "table": table, "jobs": jobs_dict, "displays": details})
                except:
                    table = '<br>'.join(jobs)
                    self.finish({"status_code": r.status_code, "result": table, "table": table, "jobs": jobs, "displays": details, "resp": r.text})
            # if no job id provided
            elif r.status_code in [404]:
                # print('404?')
                # if bad job id, show provided parameters
                table = 'Exception: \nMessage: {}\nInvalid username provided.\n'
                table += '\nThe provided parameters were:\n'
                for f in fields:
                    table += '\t{}: {}\n'.format(f,params[f])
                table += '\n'
                self.finish({"status_code": 404, "result": table})
            else:
                self.finish({"status_code": r.status_code, "result": r.reason})
        except:
            self.finish({"status_code": 400, "result": "Bad Request"})

class GetQueuesHandler(IPythonHandler):
    def get(self):
        maap = MAAP(maap_api(self.request.host))
        r = maap.getQueues()
        try:
            resp = json.loads(r.text)
            # result = [e[len('maap-worker-'):] for e in resp['queues'] if 'maap-worker' in e]
            result = resp['queues']
            self.finish({"status_code": r.status_code, "result": result})
        except:
            self.finish({"status_code": r.status_code, "result": r.text})
