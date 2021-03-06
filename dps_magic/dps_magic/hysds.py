from IPython.core.magic import (Magics, magics_class, line_magic, cell_magic)
import requests
import json
import os
import logging
from IPython.display import display, HTML

logger = logging.getLogger()
# logger.setLevel(logging.DEBUG)

@magics_class
class HysdsMagic(Magics):

    def __init__(self):
        super(HysdsMagic, self).__init__()
        PREVIEW_URL = os.environ['PREVIEW_URL'] if 'PREVIEW_URL' in os.environ else ''

        self.config_helper = ConfigHelper()
        self.env = self.config_helper.get_maap_config()

        self.lk = 'https://{}{}'.format(self.env['ade_server'], PREVIEW_URL) 
        self.bucket = 'maap-{}-dataset'.format(self.env['environment']) 

    def html(self,txt1,txt2=None):
        if txt2 == None:
            display(HTML("<pre>{}</pre>".format(txt1)))
        else:
            display(HTML("<pre>{}<br>{}</pre>".format(txt1,txt2)))

    def to_html_table(self,lstt):
        table = '<table>'
        table += '<tr><th>Magic Command</th><th style="text-align:left">Description</th></tr>'
        for e in lstt:
            table += '<tr><td style="text-align:left">{}</td><td style="text-align:left">{}</td></tr>'.format(e[0],e[1])
        table += '</table>'
        return table
        
    @line_magic
    def help(self,line):
        lstt = []
        lstt.append(['%capabilities','get information about MAAP API services'])
        lstt.append(['%list','list algorithms registered in MAS'])
        lstt.append(['%describe','describe the selected algorithm'])
        lstt.append(['%execute', 'submit a job to DPS using an algorithm registered in MAS'])
        lstt.append(['%list_jobs','list all of a user\'s submitted jobs'])
        lstt.append(['%status','check the status of a submitted job'])
        lstt.append(['%metrics','get the metrics of a completed job'])
        lstt.append(['%result','get the results for a completed job'])
        lstt.append(['%delete_algorithm','remove a registered algorithm from MAS'])
        lstt.append(['%delete_job','remove a completed job from DPS'])
        lstt.append(['%dismiss','stop a running job on DPS'])
        lstt.append(['%s3_url','get a presigned s3 url for an object'])
        lstt.append(['%help','print this help info'])
        table = self.to_html_table(lstt)
        extra_text = 'For more information, call the command of interest with parameter "help"<br>Example:<br>&nbsp&nbsp&nbsp&nbsp%describe help'
        self.html(table,extra_text)

    def execute_fn(self,line):
        algo_ver,params = line.split('(')
        params = params[:-1]
        algo,ver = algo_ver.split(':')
        inputs = []
        for kvpair in params.split(','):
            k,v = kvpair.split('=')
            inputs.append(k)
        inputs.append('')
        call = '?algo_id={algo}&version={ver}&inputs={inputs}&{params}'.format(algo=algo,ver=ver,inputs=','.join(inputs),params=params.replace(',','&'))
        return call
    
    def execute_dict(self,line):
        params = eval(line)
        keys = list(params.keys())
        inputs = list(filter( lambda k: not k in ['algo_id','version'], keys ))
        inputs.append('')
        params['inputs'] = ','.join(inputs)
        call = '?' + ('&'.join(list(map(lambda k: k+'='+params[k], params))))
        return call

    @line_magic
    def execute(self, line):
        logging.debug('line call is')
        logging.debug(line)

        call = ''
        endpoint = '/hysds/execute'
        if line.strip() in ['','h','help']:
            exec_help = 'Execute Job Help<br>Execute a job through DPS.  You need to know the parameters of your algorithm.  Use %describe to check if you are unsure.'
            sample_str = '    %execute plot_algo:master(pass_number=3,username=liz)'
            sample_dict = "    d = {'pass_number':'6','username':'liz','algo_id':'plot_algo','version':'master'} <br>    %execute $d"
            self.html(exec_help, '<br>Example String Call: <br>{}<br>Example Dictionary Call: <br>{}'.format(sample_str,sample_dict))
            return

        if '(' in line or ')' in line:
            call = self.execute_fn(line)
        elif line[0] == '{' and line[-1] == '}':
            call = self.execute_dict(line)
        else:
            print('unable to parse')

        logging.debug("call is")
        logging.debug(call)
        if call != '':
            url = self.lk + endpoint + call
            # print('url is '+url)
            r = requests.get(url)
            try:
                resp = json.loads(r.text)
                self.html(resp['result'])
            except:
                self.html(url,'Error Status '+r.status_code)
        else:
            print('unable to parse')
        return

    @line_magic
    def list_jobs(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            list_job_help = 'Job List Help<br><br>List all the jobs a user has submitted to DPS.  You need to know your username.'
            list_job_str = 'Example Job List Call:<br>    %list_jobs eyam'
            self.html(list_job_help,list_job_str)
            return

        endpoint = '/hysds/listJobs'
        call = '?username={}'.format(line.strip())

        logging.debug("call is")
        logging.debug(call)

        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        return 
    
    @line_magic
    def status(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            stat_help = 'Job Status Help<br><br>Check the status of a job in DPS.  You need to know your job ID.'
            stat_str = 'Example Status Call:<br>    %status ef6fde9e-0975-4556-b8a7-ee52e91d8e61'
            self.html(stat_help,stat_str)
            return

        endpoint = '/hysds/getStatus'
        call = '?job_id={}'.format(line.strip())

        logging.debug("call is")
        logging.debug(call)

        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        return
    
    @line_magic
    def result(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            res_help = 'Job Result Help<br><br>Check the result of a completed job in DPS.  You need to know your job ID.'
            res_str = 'Example Result Call:<br>    %result ef6fde9e-0975-4556-b8a7-ee52e91d8e61'
            self.html(res_help,res_str)
            return

        endpoint = '/hysds/getResult'
        call = '?job_id={}'.format(line.strip())

        logging.debug("call is")
        logging.debug(call)

        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        return

    @line_magic
    def metrics(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            metrics_help = 'Job Metrics Help<br><br>Check the metrics of a completed job in DPS.  You need to know your job ID.'
            metrics_str = 'Example Result Call:<br>    %metrics ef6fde9e-0975-4556-b8a7-ee52e91d8e61'
            self.html(metrics_help,metrics_str)
            return

        endpoint = '/hysds/getMetrics'
        call = '?job_id={}'.format(line.strip())

        logging.debug("call is")
        logging.debug(call)

        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        return

    @line_magic
    def capabilities(self,line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['h','help']:
            cap_help = 'Capabilities Help<br><br>Get the capabilities of the MAAP API.  You don\'t need any parameters.'
            cap_str = 'Example Capabilities Call:<br>    %capabilities'
            self.html(cap_help,cap_str)
            return

        endpoint = '/hysds/getCapabilities'
        url = self.lk + endpoint
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        
    @line_magic
    def list(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['h','help']:
            lst_help = 'List Algorithms Help<br><br>Get a list of the algorithms stored in the MAS.  You don\'t need any parameters.'
            lst_str = 'Example List Call:<br>    %list'
            self.html(lst_help,lst_str)
            return

        endpoint = '/hysds/listAlgorithms'
        url = self.lk + endpoint
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        
    @line_magic
    def describe(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            des_help = 'Describe Algorithm Help<br><br>Check the inputs required for an algorithm stored in MAS.  You need to know your algorithm name and version.'
            sample_str = '    %describe plot_algo:master'
            sample_dict = "    d = {'algo_id':'plot_algo','version':'master'} <br>    %describe $d"
            self.html(des_help, '<br>Example Describe Call:<br>{}<br>Example Dictionary Call: <br>{}'.format(sample_str,sample_dict))
            return

        call = ''
        if line[0] == '{' and line[-1] == '}':
            params = eval(line)
            call = '?algo_id={algo_id}&version={version}'.format(**params)
        elif ':' in line:
            params = line.strip().split(':')
            call = '?algo_id={}&version={}'.format(*params)
        else:
            print('unable to parse')

        logging.debug("call is")
        logging.debug(call)

        if call != '':
            endpoint = '/hysds/describeProcess'    
            url = self.lk + endpoint + call
            r = requests.get(url)
            try:
                resp = json.loads(r.text)
                self.html(resp['result'])
            except:
                self.html(url,'Error Status '+r.status_code)
        else:
            print('unable to parse')
        return
    
    @line_magic
    def delete_algorithm(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            del_help = 'Delete Algorithm Help<br><br>Remove an algorithm stored in MAS.  You need to know your algorithm name and version.'
            sample_str = '    %delete plot_algo:master'
            sample_dict = "    d = {'algo_id':'plot_algo','version':'master'} <br>    %delete_algorithm $d"
            self.html(del_help, '<br>Example Delete Call:<br>{}<br>Example Dictionary Call: <br>{}'.format(sample_str,sample_dict))
            return

        call = ''
        if line[0] == '{' and line[-1] == '}':
            params = eval(line)
            call = '?algo_id={algo_id}&version={version}'.format(**params)
        elif ':' in line:
            params = line.strip().split(':')
            call = '?algo_id={}&version={}'.format(*params)
        else:
            print('unable to parse')

        logging.debug("call is")
        logging.debug(call)

        if call != '':
            endpoint = '/hysds/deleteAlgorithm'   
            url = self.lk + endpoint + call
            r = requests.get(url)
            try:
                resp = json.loads(r.text)
                self.html(resp['result'])
            except:
                self.html(url,'Error Status '+r.status_code)
        else:
            print('unable to parse')
        return

    @line_magic
    def delete_job(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            del_help = 'Delete Job Help<br><br>Delete a finished (completed or failed) job or queued job stored in DPS.  You need to know your Job ID.'
            sample_str = 'Example Delete Call:<br>    %delete_job ef6fde9e-0975-4556-b8a7-ee52e91d8e61'
            self.html(del_help, sample_str)
            return

        endpoint = '/hysds/delete'
        call = '?job_id={}'.format(line.strip())

        logging.debug("call is")
        logging.debug(call)
        
        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        return

    @line_magic
    def dismiss(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            del_help = 'Dismiss Job Help<br><br>Dismiss a running (started, NOT queued) job on DPS.  You need to know your Job ID.'
            sample_str = 'Example Dismiss Call:<br>    %dismiss_job ef6fde9e-0975-4556-b8a7-ee52e91d8e61'
            self.html(del_help, sample_str)
            return

        endpoint = '/hysds/dismiss'
        call = '?job_id={}'.format(line.strip())

        logging.debug("call is")
        logging.debug(call)
        
        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['result'])
        return

    @line_magic
    def s3_url(self, line):
        logging.debug('line call is')
        logging.debug(line)

        if line.strip() in ['','h','help']:
            s3url_help = 'Presigned S3 Url Help<br><br>Get a presigned s3 url for an object.  You need to know the path of the file relative to the bucket or your /projects directory.'
            sample_str = 'Example s3_url call:<br>    %s3_url eyam/file-on-bucket'
            self.html(s3url_help, sample_str)
            return

        endpoint = '/show_ssh_info/getSigneds3Url'
        call = '?bucket={}&key={}'.format(self.bucket,line.strip())

        logging.debug("call is")
        logging.debug(call)

        url = self.lk + endpoint + call
        r = requests.get(url)
        resp = json.loads(r.text)
        self.html(resp['url'])
        return

class ConfigHelper(object):
    def get_maap_config(self):
        # Reaching into the maapsec extension here because this is a server-only extension with no reference to the statedb
        path_to_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..', 'maap_environments.json')

        with open(path_to_json) as f:
            data = json.load(f)

        env = self._get_environment(data)

        return env

    def _get_environment(self, envs):
        CHE_API = os.environ['CHE_API'].replace('/api', '') if 'CHE_API' in os.environ else 'NON-ADE-HOST'

        match = next((x for x in envs if CHE_API in x['ade_server']), None)

        if match is None:
            return next((x for x in envs if x['default_host'] == True), None)
        else:
            return match
