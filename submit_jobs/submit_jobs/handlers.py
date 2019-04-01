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

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from fields import getFields
# USE https when pointing to actual MAAP API server
#BASE_URL = "http://localhost:5000/api"
BASE_URL = "https://api.maap.xyz/api"
WORKDIR = os.getcwd()+'/../submit_jobs'

def dig(node):
	# print("dig!")
	if len(node) > 1:
		return {node.tag[node.tag.index('}')+1:]:[dig(e) for e in node]}
	elif len(node) == 1:
		return {node.tag[node.tag.index('}')+1:]:dig(node[0])}
	else:
		# return {node.tag[node.tag.index('}')+1:]:node.text.split(' ')}
		return {node.tag[node.tag.index('}')+1:]:node.text}

# helper to parse out algorithm parameters
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

class RegisterAlgorithmHandler(IPythonHandler):
	def get(self):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		fields = getFields('register')

		params = {}
		# params['url_list'] = []
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''
		# print(params)

		if params['repo_url'] == '':
			json_file = WORKDIR+"/submit_jobs/register.json"
			params.pop('repo_url')
		else:
			json_file = WORKDIR+"/submit_jobs/register_url.json"

		# replace spaces in algorithm name
		params['algo_name'] = params['algo_name'].replace(' ', '_')

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		url = BASE_URL+'/mas/algorithm'
		headers = {'Content-Type':'application/json'}

		with open(json_file) as jso:
			req_json = jso.read()

		req_json = req_json.format(**params)
		# print(req_json)

		# ==================================
		# Part 3: Check Response
		# ==================================
		try:
			r = requests.post(
				url=url,
				data=req_json,
				headers=headers
			)
			if r.status_code == 200:
				# print(r.text)
				try:
					# empty
					resp = json.loads(r.text)
					self.finish({"status_code": resp['code'], "result": resp['message']})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			else:
				print('failed')
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class RegisterAutoHandler(IPythonHandler):
	def get(self):
		# ==================================
		# Part 1: Get Notebook Information
		# ==================================
		# get list of running servers
		servers = list(list_running_servers())
		# buid API call with workspace url
		lk = 'https://che-k8s.maap.xyz'+servers[0]['base_url']+'api/sessions'

		# send request for server information
		r = requests.get(lk)
		resp = json.loads(r.text)

		# filter to current notebook
		current = list(filter(lambda e: e['kernel']['execution_state'] in ['busy'],resp))
		tab = current[0]

		# ==================================
		# Part 2: GitLab Token
		# ==================================
		# set key and path
		ENV_TOKEN_KEY = 'gitlab_token'
		proj_path = ('/').join(tab['path'].split('/')[:-1])
		os.chdir(proj_path)
		
		# check if GitLab token has been set
		git_url = str(subprocess.check_output("git remote get-url origin", shell=True).strip())
		# print(git_url)
		token = git_url.split("repo.nasa")[0][:-1]
		ind = token.find("gitlab-ci-token:")
		notoken = True

		# if repo url has token, no problems
		if ind != -1:
			token = token[ind+len("gitlab-ci-token:"):]
			if len(token) != 0:
				print("token has been set")
				notoken = False
		
		# token needs to be set
		if notoken:
			# if saved in environment, set for user
			if ENV_TOKEN_KEY in os.environ:
				token = os.environ[ENV_TOKEN_KEY]
				url = git_url.split("//")
				new_url = "{}//gitlab-ci-token:${}@{}".format(url[0],ENV_TOKEN_KEY,url[1])
				status = subprocess.check_output("git remote set-url origin {}".format(new_url))

				if status != 0:
					self.finish({"status_code": 412, "result": "Error {} setting GitLab Token".format(status)})
			else:
				self.finish({"status_code": 412, "result": "Error: GitLab Token not set in environment"})

		# ==================================
		# Part 3: Check if User Has Committed
		# ==================================
		# get git status
		git_status_out = subprocess.check_output("git status --porcelain", shell=True).decode("utf-8")
		git_status = git_status_out.splitlines()
		git_status = [e.strip() for e in git_status]
		unsaved = list(filter(lambda e: (('.ipynb' in e) or ('.py' in e)) and ((e[0] == 'M') or (e[0] == '?')), git_status))
		if len(unsaved) != 0:
			self.finish({"status_code": 412, "result": "Error: Notebook(s) and/or script(s) have not been committed\n{}".format(git_status_out)})

		# ==================================
		# Part 4: Extract Required Parameters
		# ==================================
		# grab info necessary for registering
		algo_name = tab['notebook']['path'].split('/').replace(' ', '_')
		lang = tab['kernel']['name']
		nb_name = tab['path'] 
		git_url = str(subprocess.check_output("git remote get-url origin", shell=True).strip())

		# convert python notebook to python script
		status = subprocess.call("ipython nbconvert --to python GetKernelData.ipynb", shell=True)
		if status != 0:
			self.finish({"status_code": 500, "result": "Could not convert .ipynb to .py"})

		run_cmd = '/{} {}'.format(lang,nb_name.replace('.ipynb','.py'))
		
		# ==================================
		# Part 5: Build & Send Request
		# ==================================
		json_file = WORKDIR+"/submit_jobs/register_url.json"
		url = BASE_URL+'/mas/algorithm'
		headers = {'Content-Type':'application/json'}

		with open(json_file) as jso:
			req_json = jso.read()

		req_json = req_json.format(**params)
		# print(req_json)

		# ==================================
		# Part 6: Check Response
		# ==================================
		try:
			r = requests.post(
				url=url,
				data=req_json,
				headers=headers
			)
			if r.status_code == 200:
				# print(r.text)
				try:
					# empty
					resp = json.loads(r.text)
					self.finish({"status_code": resp['code'], "result": resp['message']})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			else:
				print('failed')
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
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
		# Part 3: Check & Parse Response
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
		# print(inputs)
		# print(fields)

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

		params['timestamp'] = str(datetime.datetime.today())
		if inputs['username'] =='':
			inputs['username'] = 'anonymous'
		if inputs['localize_urls'] == '':
			inputs['localize_urls'] = []
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
		# print(req_xml)

		# -------------------------------
		# Send Request
		# -------------------------------
		try:
			r = requests.post(
				url=url, 
				data=req_xml, 
				headers=headers
			)
			# print(r.status_code)
			# print(r.text)

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

						result = 'JobID is {}\n'.format(job_id)

						for product in p[1]:
							for attrib in product[1]:
								result += '{}: {}\n'.format(attrib[0],attrib[1])
							result += '\n'

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
						else:
							result += '{tag}:\t{txt}\n'.format(tag=tag,txt=txt)
				else:
					resp = json.loads(r.text)
					result = 'Algorithms:\n'
					for e in resp['algorithms']:
						result += '\t{}:{}\n'.format(e['type'],e['version'])

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
		params2.pop('identifier')
		# print(params)

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

					result = ''
					for (identifier,typ) in ins_req:
						result += '{identifier}:\t{typ}\n'.format(identifier=identifier,typ=typ)
					# print(result)
					self.finish({"status_code": r.status_code, "result": result, "ins": ins_req, "old":params})

				else:
					# print('failed 200')
					result = 'Bad Request\nThe provided parameters were\n\tidentifier:{}\n\talgo_id:{}\n\tversion:{}\n'.format(params['identifier'],params['algo_id'],params['version'])
					self.finish({"status_code": 400, "result": result, "ins": [], "old":params})
			except:
				self.finish({"status_code": r.status_code, "result": r.text, "ins": [], "old":params})

		# malformed request will still give 500
		elif r.status_code == 500:
			if 'AttributeError' in r.text:
				result = 'Bad Request\nThe provided parameters were\n\tidentifier:{}\n\talgo_id:{}\n\tversion:{}\n'.format(params['identifier'],params['algo_id'],params['version'])
				self.finish({"status_code": 400, "result": result, "ins": [], "old":params})
			else:
				self.finish({"status_code": r.status_code, "result": r.reason, "ins": [], "old":params})
		else:
			self.finish({"status_code": 400, "result": "Bad Request", "ins": [], "old":params})
