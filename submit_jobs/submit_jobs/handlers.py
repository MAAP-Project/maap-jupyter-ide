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
import logging
from .fields import getFields

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

FILEPATH = os.path.dirname(os.path.abspath(__file__))
WORKDIR = FILEPATH+'/..'
# WORKDIR = os.getcwd()+'/../../submit_jobs'
sys.path.append(WORKDIR)
# USE https when pointing to actual MAAP API server
#BASE_URL = "http://localhost:5000/api"
BASE_URL = "https://api.maap.xyz/api"

def dig(node):
	# print("dig!")
	if len(node) > 1:
		return {node.tag[node.tag.index('}')+1:]:[dig(e) for e in node]}
	elif len(node) == 1:
		return {node.tag[node.tag.index('}')+1:]:dig(node[0])}
	else:
		# return {node.tag[node.tag.index('}')+1:]:node.text.split(' ')}
		return {node.tag[node.tag.index('}')+1:]:node.text}

# helper to parse out algorithm parameters for execute
def getParams(node):
	tag = node.tag[node.tag.index('}')+1:]
	if tag in ['Title','Identifier']:
		return (tag,node.text)
	elif tag == 'LiteralData':
		return (node[1][1].tag.split('}')[-1],list(node[1][1].attrib.values())[0].split(':')[-1])
	else:
		return (tag,[getParams(e) for e in node])

# helper to parse out products of result
def getProds(node):
	tag = node.tag[node.tag.index('}')+1:]
	if tag in ['ProductName','Location']:
		return (tag,node.text)
	elif tag == 'Locations':
		return (tag,[loc.text for loc in node])
	else:
		return (tag,[getProds(e) for e in node])

# helper to parse out user-defined inputs when registering algorithm
def parseInputs(popped):
	a = popped.strip()
	a = a.replace('\n',';')
	inputs = [e.split(',') for e in a.split(';')]							# split lines into inputs
	inputs = [[e.strip().replace(' ','_') for e in e1] for e1 in inputs]	# strip whitespace & replace <space> with _
	inputs = [e+['false'] if len(e) == 1 else e for e in inputs]			# set false if dl not set
	inputs = [[e[0],'true'] if e[1].lower() in ['true','download','dl'] else [e[0],'false'] for e in inputs] 	# replace anything not dl=true to false
	inputs = {e[0]:e[1] for e in inputs}									# convert to dictionary & overwrite duplicate input names
	# print(a)
	# print(inputs)
	return inputs

# helper to print accepted user-defined inputs when registering algorithm
def printInputs(resp,inputs):
	result = resp['message'] + '\nInputs:\n'
	for name in inputs.keys():
			if len(name) > 0:
				if inputs[name] == 'true':
					result += '\t{} (download)\n'.format(name)
				else:
					result += '\t{} (no download)\n'.format(name)
	return result

class RegisterAlgorithmHandler(IPythonHandler):
	def get(self,**params):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		# logging.debug('workdir is '+WORKDIR)
		fields = ['nb_name','repo_url','version'] + getFields('register')
		logging.debug('fields')
		logging.debug(fields)

		params = {}
		# TODO: need way to build registry url instead of hardcoded
		# user doesn't need to know how to make this parameter
		params['docker_url'] = os.environ['DOCKERIMAGE_PATH']
		# params['docker_url'] = 'registry.nasa.maap.xyz/root/dps_plot:master'
		# params['docker_url'] = 'registry.nasa.maap.xyz/maap-devs/base-images/plant'
		# params['environment'] = 'ubuntu'
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
				# logging.debug('found '+f)
			except:
				params[f] = ''
				# logging.debug('no '+f)
		
		# print(params)
		logging.debug('params are')
		logging.debug(params)
		nb_name = params['nb_name']

		if params['repo_url'] == '':
			json_file = WORKDIR+"/submit_jobs/register.json"
			params.pop('repo_url')
		else:
			json_file = WORKDIR+"/submit_jobs/register_url.json"

		# replace spaces in algorithm name
		params['algo_name'] = params['algo_name'].replace(' ', '_')

		# get repo url
		# proj_path = '/'.join(proj_path.split('/')[:-1])
		# os.chdir(proj_path)
		# git_url = subprocess.check_output("git remote get-url origin", shell=True).decode('utf-8').strip()
		# logging.debug(git_url)
		# params['repo_url'] = git_url

		# ==================================
		# Part 2: Check if User Has Committed
		# ==================================
		if nb_name != '':
			# navigate to project directory
			proj_path = ('/').join(['/projects']+nb_name.split('/')[:-1])
			os.chdir(proj_path)

			# get git status
			git_status_out = subprocess.check_output("git status --porcelain", shell=True).decode("utf-8")

			# is there a git repo?
			if 'not a git repository' in git_status_out:
				self.finish({"status_code": 412, "result": "Error: \n{}".format(git_status_out)})
				return

			git_status = git_status_out.splitlines()
			git_status = [e.strip() for e in git_status]

			# filter for unsaved python files
			unsaved = list(filter(lambda e: ( (e.split('.')[-1] in ['ipynb','py']) and (e[0] in ['M','?']) ), git_status))

			# if there are unsaved python files, user needs to commit
			if len(unsaved) != 0:
				self.finish({"status_code": 412, "result": "Error: Notebook(s) and/or script(s) have not been committed\n{}".format('\n'.join(unsaved))})
				return

		# ==================================
		# Part 3: Build & Send Request
		# ==================================
		json_in_file = WORKDIR+"/submit_jobs/register_inputs.json"
		url = BASE_URL+'/mas/algorithm'
		headers = {'Content-Type':'application/json'}

		with open(json_in_file) as f:
			ins_json = f.read()

		# build inputs json		
		popped = params.pop('inputs')
		inputs = parseInputs(popped)

		ins = ''
		for name in inputs.keys():
			if len(name) > 0:
				ins += ins_json.format(field_name=name,dl=inputs[name])

		# print(ins)
		# add inputs json to params for template substitution
		params['algo_inputs'] = ins

		with open(json_file) as jso:
			req_json = jso.read()

		req_json = req_json.format(**params)
		logging.debug('request is')
		logging.debug(req_json)

		# ==================================
		# Part 4: Check Response
		# ==================================
		try:
			r = requests.post(
				url=url,
				data=req_json,
				headers=headers
			)
			print(r.text)
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

		print(complete)
		logging.debug('params are')
		logging.debug(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		# return all algorithms if malformed request
		headers = {'Content-Type':'application/json'}
		if complete:
			url = BASE_URL+'/mas/algorithm/{algo_id}:{version}'.format(**params) 
			r = requests.delete(
				url,
				headers=headers
			)
		else:
			url = BASE_URL+'/mas/algorithm'
			r = requests.get(
				url,
				headers=headers
			)

		# print(url)
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
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetCapabilitiesHandler(IPythonHandler):
	def get(self):
		# No Required Arguments
		# ==================================
		# Part 1: Build & Send Request
		# ==================================
		url = BASE_URL+'/dps/job'
		headers = {'Content-Type':'application/json'}

		r = requests.get(
			url,
			headers=headers
		)

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
	def get(self):
		xml_file = WORKDIR+"/submit_jobs/execute.xml"
		input_xml = WORKDIR+"/submit_jobs/execute_inputs.xml"
		
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		fields = getFields('execute')
		input_names = self.get_argument("inputs", '').split(',')[:-1]
		if not 'username' in input_names:
			input_names.append('username')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''

		inputs = {}
		for f in input_names:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				inputs[f] = arg
			except:
				inputs[f] = ''

		logging.debug('fields are')
		logging.debug(fields)

		logging.debug('params are')
		logging.debug(params)

		logging.debug('inputs are')
		logging.debug(inputs)

		params['timestamp'] = str(datetime.datetime.today())
		if 'username' in params.keys() and inputs['username'] =='':
			inputs['username'] = 'anonymous'
		# if inputs['localize_urls'] == '':
		# 	inputs['localize_urls'] = []
		# print(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		req_xml = ''
		ins_xml = ''
		url = BASE_URL+'/dps/job'
		headers = {'Content-Type':'application/xml'}

		other = ''
		with open(input_xml) as xml:
			ins_xml = xml.read()

		# -------------------------------
		# Insert XML for algorithm inputs
		# -------------------------------
		for i in range(len(input_names)):
			name = input_names[i]
			other += ins_xml.format(name=name).format(value=inputs[name])
			other += '\n'

		# print(other)
		params['other_inputs'] = other

		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		print(req_xml)

		logging.debug('request is')
		logging.debug(req_xml)

		# -------------------------------
		# Send Request
		# -------------------------------
		try:
			r = requests.post(
				url=url, 
				data=req_xml, 
				headers=headers
			)
			logging.debug('status code '+r.status_code)
			logging.debug('response text\n'+r.text)

			# ==================================
			# Part 3: Check & Parse Response
			# ==================================
			# malformed request will still give 200
			if r.status_code == 200:
				try:
					# parse out JobID from response
					rt = ET.fromstring(r.text)

					# if bad request, show provided parameters
					if 'Exception' in r.text:
						result = 'Exception: {}\n'.format(rt[0].attrib['exceptionCode'])
						result += 'Bad Request\nThe provided parameters were:\n'
						for f in fields:
							result += '\t{}: {}\n'.format(f,params[f])
						result += '\n'
						self.finish({"status_code": 400, "result": result})

					else:
						job_id = rt[0].text
						# print(job_id)

						result = 'JobID is {}'.format(job_id)
						# print("success!")
						self.finish({"status_code": r.status_code, "result": result})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			else:
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetStatusHandler(IPythonHandler):
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
		# Part 2: Build & Send Request
		# ==================================
		url = BASE_URL+'/dps/job/{job_id}/status'.format(**params)
		headers = {'Content-Type':'application/xml'}
		# print(url)
		# print(req_xml)

		try:
			r = requests.get(
				url,
				headers=headers
			)

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
					status = rt[1].text
					# print(job_id)

					result = 'JobID is {}\nStatus: {}'.format(job_id,status)
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
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetResultHandler(IPythonHandler):
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
		# Part 2: Build & Send Request
		# ==================================
		url = BASE_URL+'/dps/job/{job_id}'.format(**params)
		headers = {'Content-Type':'application/xml'}
		# print(url)
		# print(req_xml)

		try:
			r = requests.get(
				url,
				headers=headers
			)
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
						# print(job_id)

						prods = rt[1][0]
						p = getProds(prods)

						result = "<table>"
						result += '<thead><tr><th colspan="2" style="text-align:left"> Job Results</th></tr></thead>'
						result += '<tbody>'
						result += '<tr><td>JobID: </td><td style="text-align:left">{}</td></tr>'.format(job_id)

						for product in p[1]:
							for attrib in product[1]:
								if attrib[0] == 'Locations' and type(attrib[1] == type([])):
									lst = attrib[1]
									lnk = lst[-1]
									lst[-1] = "<a href=\"{}\">{}</a>".format(lnk,lnk)
									prop = ('<br>	').join(lst)
									result += '<tr><td>{}: </td><td style="text-align:left">{}</td></tr>'.format(attrib[0],prop)
								else:
									result += '<tr><td>{}: </td><td style="text-align:left">{}</td></tr>'.format(attrib[0],attrib[1])
							# result += '\n'

						result += '</tbody>'
						result += '</table>'
						print(result)
						# result = result.replace(',',',<br>	')
						# result = result.replace('\n','<br>')
						# print(result)

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
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class DismissHandler(IPythonHandler):
	def post(self):
		fields = getFields('dismiss')
		params = {}

		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = params.pop('url',None)
		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		params['service'] = 'WPS'
		params['version'] = '2.0.0'
		params['request'] = 'Dismiss'
		r.requests.get(
			url,
			params=params
		)
		try:
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

class DescribeProcessHandler(IPythonHandler):
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

		if all(e == '' for e in list(params.values())):
			complete = False

		# print(params)
		print(complete)
		logging.debug('params are')
		logging.debug(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		# return all algorithms if malformed request
		if complete:
			url = BASE_URL+'/mas/algorithm/{algo_id}:{version}'.format(**params) 
		else:
			url = BASE_URL+'/mas/algorithm'

		headers = {'Content-Type':'application/json'}
		# print(url)

		r = requests.get(
			url,
			headers=headers
		)
		# print(r.status_code)
		# print(r.text)

		# ==================================
		# Part 3: Check & Parse Response
		# ==================================

		if r.status_code == 200:
			algo_lst = []
			try:
				if complete:
					# parse out capability names & request info
					rt = ET.fromstring(r.text)
					attrib = [getParams(e) for e in rt[0][0]]

					result = ''
					for (tag,txt) in attrib:
						if tag == 'Input':
							result += '{}\n'.format(tag)
							for (tag1,txt1) in txt:
								result += '\t{tag1}:\t{txt1}\n'.format(tag1=tag1,txt1=txt1)
							result += '\n'

						elif tag == 'Title':
							txt = txt.split(';')
							for itm in txt:
								result += '{}\n'.format(itm.strip())
						else:
							result += '{tag}:\t{txt}\n'.format(tag=tag,txt=txt)

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
				self.finish({"status_code": r.status_code, "result": result, "algo_set": algo_lst})
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

		# print(params)
		params2 = copy.deepcopy(params)
		# params2.pop('identifier')
		# print(params)
		logging.debug('params are')
		logging.debug(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		# return all algorithms if malformed request
		if complete:
			url = BASE_URL+'/mas/algorithm/{algo_id}:{version}'.format(**params2) 
		else:
			url = BASE_URL+'/mas/algorithm'

		headers = {'Content-Type':'application/json'}
		# print(url)

		r = requests.get(
			url,
			headers=headers
		)
		# print(r.status_code)
		# print(r.text)

		# ==================================
		# Part 3: Check & Parse Response
		# ==================================

		if r.status_code == 200:
			try:
				# print('200')
				if complete:
					# print('complete')
					# parse out capability names & request info
					rt = ET.fromstring(r.text)
					attrib = [getParams(e) for e in rt[0][0]] 						# parse XML
					inputs = [e[1] for e in attrib[2:-1]]
					ins_req = [[e[1][1],e[2][1]] for e in inputs] 					# extract identifier & type for each input
					ins_req = list(filter(lambda e: e[0] != 'timestamp', ins_req)) 	# filter out automatic timestamp req input
					ins_req = list(filter(lambda e: e[0] != 'username', ins_req)) 	# filter out automatic username req input

					result = ''
					for (identifier,typ) in ins_req:
						result += '{identifier}:\t{typ}\n'.format(identifier=identifier,typ=typ)
					# print(result)

					if result.strip() == '':
						result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
						self.finish({"status_code": 400, "result": result})
						return

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
	# inputs: code_path
	# outputs: repo_url, algo_name, version, run_cmd, dockerfile_path, environment_name
	def get(self):
		# ==================================
		# Part 1: Get Notebook Information Processed in UI
		# ==================================
		fields = ['code_path']

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''
		proj_path = '/projects/'+params['code_path']
		
		logging.debug('params are')
		logging.debug(params)

		# ==================================
		# Part 2: Extract Required Register Parameters
		# ==================================
		proj_path = '/'.join(proj_path.split('/')[:-1])
		os.chdir(proj_path)
		git_url = subprocess.check_output("git remote get-url origin", shell=True).decode('utf-8').strip()
		print(git_url)

		vals = {}
		code_path = params['code_path']
		file_name = code_path.split('/')[-1]
		algo_name = file_name.replace('/',':').replace(' ', '_').replace('"','').replace("'",'')
		vals['algo_name'] = ('.').join(algo_name.split('.')[:-1])

		# if code_path.split('.')[-1] in ['.py','ipynb']:
		# 	vals['run_cmd'] = 'python '+code_path
		# else:
		# 	vals['run_cmd'] = code_path

		# version is branch name
		branch_name = subprocess.check_output("git branch | grep '*' | awk '{print $2}'",shell=True).decode('utf-8').strip()
		# logging.debug('branch name is {}'.format(branch_name))
		vals['version'] = branch_name
		vals['repo_url'] = git_url
		vals['environment'] = "ubuntu"
		# FIX IN DOCKER IMAGE
		# vals['dockerfile_path'] = os.environ['DOCKERFILE_PATH']
		# vals['dockerfile_path'] = 'registry.nasa.maap.xyz/root/dps_plot:master'

		# outputs: repo_url, algo_name, run_cmd, dockerfile_path, environment_name, branch
		self.finish({"status_code": 200, "default_values":vals})
